import express from "express";
import cors from "cors";
import reminderRoutes from "./routes/reminder.routes.js";
import voiceRoutes from "./routes/voice.routes.js";

// Initialize Express application
const app = express();

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- Routes ---
app.use("/api/reminders", reminderRoutes);
app.use("/api/voice", voiceRoutes);

// Health check endpoint
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

export default app;
