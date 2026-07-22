import { Router } from "express";
import { getReminders, createReminder } from "../controllers/reminder.controller.js";

const router = Router();

// GET /api/reminders?userId=<uuid> - Fetch all reminders for a user
router.get("/", getReminders);

// POST /api/reminders - Create a new reminder
router.post("/", createReminder);

export default router;
