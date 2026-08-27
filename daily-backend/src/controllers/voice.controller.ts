import { Request, Response } from "express";
import Groq from "groq-sdk";
import fs from "fs";
import prisma from "../config/db.js";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
  defaultHeaders: { "Accept-Encoding": "identity" },
});

// Demo user ID (same as frontend constant)
const DEMO_USER_ID = "user-demo-123";

/**
 * Fetch user's pending reminders for the next 7 days.
 * Used as schedule context for the AI conflict detection.
 */
async function fetchWeeklySchedule(userId: string): Promise<string> {
  const now = new Date();
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const reminders = await prisma.reminder.findMany({
    where: {
      userId,
      status: "pending",
      scheduledTime: { gte: now, lte: weekFromNow },
    },
    orderBy: { scheduledTime: "asc" },
    select: { title: true, scheduledTime: true },
  });

  if (reminders.length === 0) {
    return "No existing events in the next 7 days.";
  }

  const DAYS_HE = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

  return reminders
    .map((r) => {
      const d = new Date(r.scheduledTime);
      const dayName = DAYS_HE[d.getDay()];
      const date = d.toLocaleDateString("en-CA", { timeZone: "Asia/Jerusalem" });
      const time = d.toLocaleTimeString("he-IL", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Jerusalem",
      });
      return `- ${dayName} ${date} ${time}: ${r.title}`;
    })
    .join("\n");
}

/**
 * Build the system prompt with schedule context for conflict-aware parsing.
 */
function buildSystemPrompt(weeklySchedule: string): string {
  const now = new Date();
  const israelTime = now
    .toLocaleString("en-CA", { timeZone: "Asia/Jerusalem", hour12: false })
    .replace(", ", "T") + "+03:00";

  return `You are an AI assistant for 'Daily', a smart personal organization app in Israel. Your job is to analyze Hebrew transcribed text and convert it into a structured JSON object, while also detecting schedule conflicts.

Current Reference Timestamp (ISO, Israel Time): ${israelTime}
User Timezone: Asia/Jerusalem (UTC+3)

=== USER'S EXISTING SCHEDULE (next 7 days) ===
${weeklySchedule}
=== END SCHEDULE ===

Task Instructions:
1. Extract the core task/action for 'title' in clear Hebrew (remove meta phrases like 'תזכיר לי', 'תקבע לי').
2. Calculate 'scheduledTime' as ISO-8601 with +03:00 offset based on the reference timestamp.
   - If no time mentioned, default to 09:00:00.000+03:00.
   - Always use +03:00 offset, never Z.
3. Extract 'phoneNumber' (digits string) or null.
4. Extract 'websiteUrl' or null.
5. Extract 'notificationOffsetMinutes' if user mentions advance timing, else 0.

6. CONFLICT & OVERLOAD DETECTION:
   - Check if the target day already has >= 3 events OR has overlapping/adjacent times (within 1 hour).
   - Respect Israeli business days: Sun-Thu are full workdays. Friday is short (until ~13:00). Saturday (Shabbat) is closed for clinics, offices, barbers.
   - If overloaded or conflicting:
     - Set 'hasConflictOrOverload' to true.
     - Propose 'suggestedTime' (ISO-8601 +03:00) on the nearest calm business day with fewer events. Pick a reasonable hour (09:00-17:00).
     - Write 'conflictWarning' in Hebrew explaining the problem (e.g., "יום חמישי נראה קצת עמוס (יש לך כבר ישיבה וספר)").
     - Write 'recommendationReason' in Hebrew with the suggestion (e.g., "לקבוע ליום ראשון ה-30.08 ב-11:00 (יום פנוי יותר)").
   - If NO conflict: set hasConflictOrOverload=false, suggestedTime=null, conflictWarning=null, recommendationReason=null.

CRITICAL: Return ONLY a valid JSON object matching this exact schema, no markdown or conversation:
{"title":"string","scheduledTime":"string","phoneNumber":"string or null","websiteUrl":"string or null","notificationOffsetMinutes":0,"hasConflictOrOverload":false,"suggestedTime":"string or null","conflictWarning":"string or null","recommendationReason":"string or null"}`;
}

/**
 * POST /api/voice/process
 * Receives an audio file, transcribes via Groq Whisper,
 * parses intent + detects conflicts via LLM, saves reminder to DB.
 */
export const processVoice = async (req: Request, res: Response): Promise<void> => {
  try {
    // 1. Validate uploaded file
    const file = req.file;
    if (!file) {
      res.status(400).json({
        success: false,
        error: "No audio file provided. Send as 'audio' field in multipart/form-data.",
      });
      return;
    }

    console.log(`[Voice] Received audio: ${file.originalname} (${file.size} bytes)`);

    // 2. Transcribe audio via Groq Whisper
    console.log("[Voice] Transcribing with Whisper...");

    const ext = file.originalname.split(".").pop() || "webm";
    const filePath = file.path;
    const filePathWithExt = `${filePath}.${ext}`;
    fs.renameSync(filePath, filePathWithExt);

    const fileBuffer = fs.readFileSync(filePathWithExt);
    const audioFile = new File([fileBuffer], `recording.${ext}`, {
      type: file.mimetype || `audio/${ext}`,
    });

    const transcription = await groq.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-large-v3",
      language: "he",
      response_format: "verbose_json",
    });

    const transcript = (transcription as { text: string }).text.trim();
    console.log(`[Voice] Transcript: "${transcript}"`);

    if (!transcript) {
      res.status(400).json({
        success: false,
        error: "Could not transcribe audio. Please try again with clearer speech.",
      });
      return;
    }

    // 3. Fetch weekly schedule for conflict detection
    const weeklySchedule = await fetchWeeklySchedule(DEMO_USER_ID);
    console.log(`[Voice] Weekly schedule context:\n${weeklySchedule}`);

    // 4. Parse intent + detect conflicts via LLM
    console.log("[Voice] Parsing intent with LLM (schedule-aware)...");
    const chatResponse = await groq.chat.completions.create({
      model: "qwen/qwen3.8-27b",
      messages: [
        { role: "system", content: buildSystemPrompt(weeklySchedule) },
        { role: "user", content: transcript },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
      max_tokens: 512,
    });

    const llmContent = chatResponse.choices[0]?.message?.content;
    if (!llmContent) {
      res.status(500).json({ success: false, error: "LLM returned empty response." });
      return;
    }

    console.log(`[Voice] LLM output: ${llmContent}`);

    // 5. Parse JSON from LLM
    let parsed: {
      title: string;
      scheduledTime: string;
      phoneNumber: string | null;
      websiteUrl: string | null;
      notificationOffsetMinutes: number;
      hasConflictOrOverload: boolean;
      suggestedTime: string | null;
      conflictWarning: string | null;
      recommendationReason: string | null;
    };

    try {
      parsed = JSON.parse(llmContent);
    } catch {
      res.status(500).json({
        success: false,
        error: "Failed to parse LLM response as JSON.",
        raw: llmContent,
      });
      return;
    }

    // 6. Validate parsed fields
    if (!parsed.title || !parsed.scheduledTime) {
      res.status(400).json({
        success: false,
        error: "LLM could not extract required fields (title, scheduledTime).",
        parsed,
      });
      return;
    }

    const scheduledTime = new Date(parsed.scheduledTime);
    if (isNaN(scheduledTime.getTime())) {
      res.status(400).json({
        success: false,
        error: "LLM returned invalid date for scheduledTime.",
        parsed,
      });
      return;
    }

    // 7. Save reminder to database (with original time — user decides later)
    const reminder = await prisma.reminder.create({
      data: {
        userId: DEMO_USER_ID,
        title: parsed.title,
        scheduledTime,
        phoneNumber: parsed.phoneNumber || null,
        websiteUrl: parsed.websiteUrl || null,
        notificationOffsetMinutes: parsed.notificationOffsetMinutes || 0,
      },
    });

    console.log(`[Voice] Reminder created: ${reminder.id} | Conflict: ${parsed.hasConflictOrOverload}`);

    // 8. Clean up temp file
    fs.unlink(filePathWithExt, () => {});

    // 9. Return success with conflict metadata
    res.status(201).json({
      success: true,
      data: reminder,
      meta: {
        transcript,
        parsed,
        conflict: parsed.hasConflictOrOverload
          ? {
              hasConflictOrOverload: true,
              suggestedTime: parsed.suggestedTime,
              conflictWarning: parsed.conflictWarning,
              recommendationReason: parsed.recommendationReason,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("[Voice] processVoice error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error during voice processing.",
    });
  }
};
