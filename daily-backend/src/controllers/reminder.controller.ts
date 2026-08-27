import { Request, Response } from "express";
import prisma from "../config/db.js";

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
    const { userId, title, description, scheduledTime, phoneNumber, websiteUrl, isProactive } =
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
      },
    });

    res.status(201).json({
      success: true,
      data: reminder,
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
    const { title, scheduledTime, phoneNumber, websiteUrl, status } = req.body;

    // Build update data object with only provided fields
    const data: Record<string, unknown> = {};
    if (title !== undefined) data.title = title;
    if (phoneNumber !== undefined) data.phoneNumber = phoneNumber || null;
    if (websiteUrl !== undefined) data.websiteUrl = websiteUrl || null;
    if (status !== undefined) data.status = status;

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

    res.status(200).json({
      success: true,
      data: reminder,
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