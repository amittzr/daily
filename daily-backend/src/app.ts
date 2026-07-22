import express from "express";
import cors from "cors";
import reminderRoutes from "./routes/reminder.routes.js";

// Initialize Express application
const app = express();

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- Routes ---
app.use("/api/reminders", reminderRoutes);

// Health check endpoint
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

export default app;
