import { Router } from "express";
import multer from "multer";
import { processVoice } from "../controllers/voice.controller.js";

const router = Router();

// Configure Multer to store audio files temporarily on disk
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max (Groq Whisper limit)
  fileFilter: (_req, file, cb) => {
    // Accept common audio formats
    const allowed = [
      "audio/mpeg", "audio/mp4", "audio/m4a", "audio/x-m4a",
      "audio/wav", "audio/webm", "audio/ogg", "audio/flac",
    ];
    if (allowed.includes(file.mimetype) || file.originalname.match(/\.(mp3|m4a|wav|webm|ogg|flac|mp4)$/i)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported audio format: ${file.mimetype}`));
    }
  },
});

// POST /api/voice/process — Upload audio, transcribe, parse, save reminder
router.post("/process", upload.single("audio"), processVoice);

export default router;
