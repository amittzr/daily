import { Request, Response } from "express";
import prisma from "../config/db.js";

/**
 * Check if a day is overloaded (>= 3 events on that day).
 * Returns the count of existing events on the same day.
 */
async function checkDayOverload(userId: string, targetTime: Date): Promise<{
  isOverloaded: boolean;
  eventCount: number;
  existingTitles: string[];
}> {
  // Get start/end of the target day in Israel timezone
  const dayStart = new Date(targetTime);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(targetTime);
  dayEnd.setHours(23, 59, 59, 999);

  const existing = await prisma.reminder.findMany({
    where: {
      userId,
      status: "pending",
      scheduledTime: { gte: dayStart, lte: dayEnd },
    },
    select: { title: true },
  });

  return {
    isOverloaded: existing.length >= 3,
    eventCount: existing.length,
    existingTitles: existing.map((r) => r.title),
  };
}

/**
 * GET /api/reminders?userId=<uuid>
 * Fetch all reminders for a given user, sorted by scheduledTime ascending.
 */
export const getReminders = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.query;

    if (!userId || typeof userId !== "string") {
      res.status(400).json({
        success: false,
        error: "Missing or invalid 'userId' query parameter.",
      });
      return;
    }

    const reminders = await prisma.reminder.findMany({
      where: { userId },
      orderBy: { scheduledTime: "asc" },
    });

    res.status(200).json({
      success: true,
      data: reminders,
    });
  } catch (error) {
    console.error("[ReminderController] getReminders error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error while fetching reminders.",
    });
  }
};

/**
 * POST /api/reminders
 * Create a new reminder. Required fields: userId, title, scheduledTime.
 */
export const createReminder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, title, description, scheduledTime, phoneNumber, websiteUrl, isProactive, isRecurring, recurrenceIntervalDays } =
      req.body;

    // Validate required fields
    if (!userId || !title || !scheduledTime) {
      res.status(400).json({
        success: false,
        error: "Missing required fields: 'userId', 'title', and 'scheduledTime' are required.",
      });
      return;
    }

    // Validate scheduledTime is a valid date
    const parsedTime = new Date(scheduledTime);
    if (isNaN(parsedTime.getTime())) {
      res.status(400).json({
        success: false,
        error: "'scheduledTime' must be a valid ISO 8601 date string.",
      });
      return;
    }

    const reminder = await prisma.reminder.create({
      data: {
        userId,
        title,
        description: description || null,
        scheduledTime: parsedTime,
        phoneNumber: phoneNumber || null,
        websiteUrl: websiteUrl || null,
        isProactive: isProactive ?? false,
        isRecurring: isRecurring ?? false,
        recurrenceIntervalDays: isRecurring ? (recurrenceIntervalDays || 1) : null,
      },
    });

    // Check if the day is overloaded for conflict warning
    const overload = await checkDayOverload(userId, parsedTime);

    const DAYS_HE = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
    const dayName = DAYS_HE[parsedTime.getDay()];

    let conflict = null;
    if (overload.isOverloaded) {
      // Find the nearest calm day (next day with < 2 events, skipping Saturday)
      let suggestedDate = new Date(parsedTime);
      for (let i = 1; i <= 7; i++) {
        suggestedDate = new Date(parsedTime.getTime() + i * 24 * 60 * 60 * 1000);
        if (suggestedDate.getDay() === 6) continue; // Skip Saturday
        const check = await checkDayOverload(userId, suggestedDate);
        if (check.eventCount < 2) break;
      }
      suggestedDate.setHours(11, 0, 0, 0); // Default 11:00
      const sugDayName = DAYS_HE[suggestedDate.getDay()];
      const sugDateStr = suggestedDate.toLocaleDateString("he-IL", { day: "numeric", month: "numeric" });

      conflict = {
        hasConflictOrOverload: true,
        suggestedTime: suggestedDate.toISOString(),
        conflictWarning: `יום ${dayName} נראה קצת עמוס (${overload.eventCount} אירועים: ${overload.existingTitles.slice(0, 2).join(", ")})`,
        recommendationReason: `לקבוע ליום ${sugDayName} ה-${sugDateStr} ב-11:00 (יום פנוי יותר)`,
      };
    }

    res.status(201).json({
      success: true,
      data: reminder,
      meta: { conflict },
    });
  } catch (error) {
    console.error("[ReminderController] createReminder error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error while creating reminder.",
    });
  }
};

/**
 * PATCH /api/reminders/:id
 * Update reminder fields (title, scheduledTime, phoneNumber, websiteUrl, status).
 */
export const updateReminder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, scheduledTime, phoneNumber, websiteUrl, status, isRecurring, recurrenceIntervalDays } = req.body;

    // Build update data object with only provided fields
    const data: Record<string, unknown> = {};
    if (title !== undefined) data.title = title;
    if (phoneNumber !== undefined) data.phoneNumber = phoneNumber || null;
    if (websiteUrl !== undefined) data.websiteUrl = websiteUrl || null;
    if (isRecurring !== undefined) data.isRecurring = isRecurring;
    if (recurrenceIntervalDays !== undefined) data.recurrenceIntervalDays = recurrenceIntervalDays;

    if (scheduledTime !== undefined) {
      const parsedTime = new Date(scheduledTime);
      if (isNaN(parsedTime.getTime())) {
        res.status(400).json({
          success: false,
          error: "'scheduledTime' must be a valid ISO 8601 date string.",
        });
        return;
      }
      data.scheduledTime = parsedTime;
    }

    // RECURRENCE AUTO-ADVANCE:
    // If marking a recurring reminder as completed, advance to next occurrence
    // and record completion time so it shows as "done for this cycle".
    if (status === "completed") {
      const existing = await prisma.reminder.findUnique({ where: { id } });
      if (existing?.isRecurring && existing.recurrenceIntervalDays) {
        // Advance from the LATER of scheduledTime or now, so it always lands
        // on a future occurrence (never re-triggers same-day repeatedly).
        const baseTime = Math.max(existing.scheduledTime.getTime(), Date.now());
        const nextTime = new Date(
          baseTime + existing.recurrenceIntervalDays * 24 * 60 * 60 * 1000
        );
        // Preserve the original time-of-day from scheduledTime
        nextTime.setHours(
          existing.scheduledTime.getHours(),
          existing.scheduledTime.getMinutes(),
          0,
          0
        );
        data.scheduledTime = nextTime;
        data.status = "pending"; // Reset for next cycle
        data.lastCompletedAt = new Date();
      } else {
        data.status = "completed";
      }
    } else if (status === "pending") {
      // Un-completing: clear lastCompletedAt
      data.status = "pending";
      data.lastCompletedAt = null;
    } else if (status !== undefined) {
      data.status = status;
    }

    if (Object.keys(data).length === 0) {
      res.status(400).json({
        success: false,
        error: "No valid fields provided for update.",
      });
      return;
    }

    const reminder = await prisma.reminder.update({
      where: { id },
      data,
    });

    // Check for conflict if scheduledTime was changed
    let conflict = null;
    if (scheduledTime !== undefined && reminder.status === "pending") {
      const targetTime = new Date(reminder.scheduledTime);
      const overload = await checkDayOverload(reminder.userId, targetTime);

      if (overload.isOverloaded) {
        const DAYS_HE = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
        const dayName = DAYS_HE[targetTime.getDay()];

        // Find nearest calm day
        let suggestedDate = new Date(targetTime);
        for (let i = 1; i <= 7; i++) {
          suggestedDate = new Date(targetTime.getTime() + i * 24 * 60 * 60 * 1000);
          if (suggestedDate.getDay() === 6) continue;
          const check = await checkDayOverload(reminder.userId, suggestedDate);
          if (check.eventCount < 2) break;
        }
        suggestedDate.setHours(11, 0, 0, 0);
        const sugDayName = DAYS_HE[suggestedDate.getDay()];
        const sugDateStr = suggestedDate.toLocaleDateString("he-IL", { day: "numeric", month: "numeric" });

        conflict = {
          hasConflictOrOverload: true,
          suggestedTime: suggestedDate.toISOString(),
          conflictWarning: `יום ${dayName} נראה קצת עמוס (${overload.eventCount} אירועים: ${overload.existingTitles.slice(0, 2).join(", ")})`,
          recommendationReason: `לקבוע ליום ${sugDayName} ה-${sugDateStr} ב-11:00 (יום פנוי יותר)`,
        };
      }
    }

    res.status(200).json({
      success: true,
      data: reminder,
      meta: { conflict },
    });
  } catch (error: unknown) {
    // Handle not found (Prisma P2025)
    if (error && typeof error === "object" && "code" in error && (error as { code: string }).code === "P2025") {
      res.status(404).json({
        success: false,
        error: "Reminder not found.",
      });
      return;
    }
    console.error("[ReminderController] updateReminder error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error while updating reminder.",
    });
  }
};

/**
 * DELETE /api/reminders/:id
 * Delete a reminder by UUID.
 */
export const deleteReminder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.reminder.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      data: null,
    });
  } catch (error: unknown) {
    // Handle not found (Prisma P2025)
    if (error && typeof error === "object" && "code" in error && (error as { code: string }).code === "P2025") {
      res.status(404).json({
        success: false,
        error: "Reminder not found.",
      });
      return;
    }
    console.error("[ReminderController] deleteReminder error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error while deleting reminder.",
    });
  }
};