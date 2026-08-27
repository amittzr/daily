import { API_REMINDERS_URL, CURRENT_USER_ID } from "../config/constants";
import { Reminder, ApiResponse } from "../types";

/**
 * Fetch all reminders for the current user, sorted by scheduledTime ascending.
 */
export async function fetchReminders(): Promise<Reminder[]> {
  try {
    const response = await fetch(
      `${API_REMINDERS_URL}?userId=${CURRENT_USER_ID}`
    );

    if (!response.ok) {
      throw new Error(`Server responded with status ${response.status}`);
    }

    const result: ApiResponse<Reminder[]> = await response.json();

    if (!result.success || !result.data) {
      throw new Error(result.error || "Unknown error");
    }

    return result.data;
  } catch (error) {
    console.error("[reminderApi] fetchReminders error:", error);
    throw error;
  }
}

/**
 * Create a new reminder.
 */
export async function createReminder(params: {
  title: string;
  scheduledTime: string;
  phoneNumber?: string;
  websiteUrl?: string;
}): Promise<Reminder> {
  try {
    const response = await fetch(API_REMINDERS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: CURRENT_USER_ID,
        title: params.title,
        scheduledTime: params.scheduledTime,
        phoneNumber: params.phoneNumber || null,
        websiteUrl: params.websiteUrl || null,
      }),
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error || `Server error ${response.status}`);
    }

    const result: ApiResponse<Reminder> = await response.json();

    if (!result.success || !result.data) {
      throw new Error(result.error || "Unknown error");
    }

    return result.data;
  } catch (error) {
    console.error("[reminderApi] createReminder error:", error);
    throw error;
  }
}

/**
 * Update a reminder's fields (status, title, scheduledTime, etc.).
 */
export async function updateReminder(
  id: string,
  updates: Partial<Pick<Reminder, "title" | "scheduledTime" | "phoneNumber" | "websiteUrl" | "status">>
): Promise<Reminder> {
  try {
    const response = await fetch(`${API_REMINDERS_URL}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error || `Server error ${response.status}`);
    }

    const result: ApiResponse<Reminder> = await response.json();

    if (!result.success || !result.data) {
      throw new Error(result.error || "Unknown error");
    }

    return result.data;
  } catch (error) {
    console.error("[reminderApi] updateReminder error:", error);
    throw error;
  }
}

/**
 * Delete a reminder by ID.
 */
export async function deleteReminder(id: string): Promise<void> {
  try {
    const response = await fetch(`${API_REMINDERS_URL}/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error || `Server error ${response.status}`);
    }
  } catch (error) {
    console.error("[reminderApi] deleteReminder error:", error);
    throw error;
  }
}
