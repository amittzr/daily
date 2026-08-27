import { Router } from "express";
import { getReminders, createReminder, updateReminder, deleteReminder } from "../controllers/reminder.controller.js";

const router = Router();

// GET /api/reminders?userId=<uuid> - Fetch all reminders for a user
router.get("/", getReminders);

// POST /api/reminders - Create a new reminder
router.post("/", createReminder);

// PATCH /api/reminders/:id - Update reminder fields or status
router.patch("/:id", updateReminder);

// DELETE /api/reminders/:id - Delete a reminder
router.delete("/:id", deleteReminder);

export default router;
