import { Request, Response } from "express";
import Groq from "groq-sdk";
import fs from "fs";
import prisma from "../config/db.js";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
  // Disable gzip to avoid node-fetch premature close issues
  defaultHeaders: { "Accept-Encoding": "identity" },
});

// Demo user ID (same as frontend constant)
const DEMO_USER_ID = "user-demo-123";

/**
 * Build the system prompt for intent parsing.
 * Injects the current timestamp so the LLM can resolve relative dates.
 */
function buildSystemPrompt(): string {
  return `You are an AI assistant for 'Daily', a smart personal organization app. Your job is to analyze Hebrew transcribed text from a voice recording and convert it into a structured JSON object representing a reminder or appointment.

Current Reference Timestamp (ISO): ${new Date().toISOString()}

Task Instructions:
1. Extract the core task/action for the 'title' field in clear Hebrew (remove meta phrases like 'תזכיר לי', 'תקבע לי', 'אני צריך').
2. Calculate the exact target timestamp for 'scheduledTime' as an ISO-8601 string based on the Current Reference Timestamp provided above.
   - Example: If current date is "2026-08-11T12:00:00Z" and text says "מחר ב-4 אחה"צ", target date is "2026-08-12T16:00:00.000Z".
   - If no specific time is mentioned, default to 09:00:00.000Z of the target day.
3. Extract any phone numbers into 'phoneNumber' (format as plain digits string, e.g., "031234567") or null if absent.
4. Extract any web links into 'websiteUrl' or null if absent.

CRITICAL: Return ONLY a valid JSON object matching this schema, with no markdown wrappers or conversation:
{"title": "string", "scheduledTime": "string (ISO 8601)", "phoneNumber": "string or null", "websiteUrl": "string or null"}`;
}

/**
 * POST /api/voice/process
 * Receives an audio file, transcribes it via Groq Whisper,
 * parses intent via Llama 3, saves reminder to DB.
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
    
    // Determine file extension from original filename
    const ext = file.originalname.split(".").pop() || "webm";
    const filePath = file.path;
    // Rename temp file to include extension (Groq needs it for format detection)
    const filePathWithExt = `${filePath}.${ext}`;
    fs.renameSync(filePath, filePathWithExt);

    // Read file into buffer and create a File object for Groq
    const fileBuffer = fs.readFileSync(filePathWithExt);
    const audioFile = new File([fileBuffer], `recording.${ext}`, {
      type: file.mimetype || `audio/${ext}`,
    });

    const transcription = await groq.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-large-v3",
      language: "he",
      response_format: "text",
    });

    const transcript = typeof transcription === "string"
      ? transcription.trim()
      : (transcription as { text: string }).text.trim();

    console.log(`[Voice] Transcript: "${transcript}"`);

    if (!transcript) {
      res.status(400).json({
        success: false,
        error: "Could not transcribe audio. Please try again with clearer speech.",
      });
      return;
    }

    // 3. Parse intent via Groq LLM (Llama 3)
    console.log("[Voice] Parsing intent with LLM...");
    const chatResponse = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: buildSystemPrompt() },
        { role: "user", content: transcript },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
      max_tokens: 256,
    });

    const llmContent = chatResponse.choices[0]?.message?.content;
    if (!llmContent) {
      res.status(500).json({
        success: false,
        error: "LLM returned empty response.",
      });
      return;
    }

    console.log(`[Voice] LLM output: ${llmContent}`);

    // 4. Parse JSON from LLM
    let parsed: {
      title: string;
      scheduledTime: string;
      phoneNumber: string | null;
      websiteUrl: string | null;
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

    // 5. Validate parsed fields
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

    // 6. Save reminder to database
    const reminder = await prisma.reminder.create({
      data: {
        userId: DEMO_USER_ID,
        title: parsed.title,
        scheduledTime,
        phoneNumber: parsed.phoneNumber || null,
        websiteUrl: parsed.websiteUrl || null,
      },
    });

    console.log(`[Voice] Reminder created: ${reminder.id}`);

    // 7. Clean up temp file
    fs.unlink(filePathWithExt, () => {});

    // 8. Return success
    res.status(201).json({
      success: true,
      data: reminder,
      meta: {
        transcript,
        parsed,
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
