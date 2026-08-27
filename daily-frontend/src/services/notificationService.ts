import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { Reminder } from "../types";

// Hebrew keywords that indicate an appointment (deserves advance notification)
const APPOINTMENT_KEYWORDS = ["תור", "רופא", "וטרינר", "ספר", "פגישה", "ישיבה"];

/**
 * Request notification permissions from the OS.
 * Should be called on app launch or Dashboard mount.
 */
export async function requestPermissions(): Promise<boolean> {
  const settings = await Notifications.getPermissionsAsync();
  const existingStatus = (settings as { status: string }).status;

  if (existingStatus === "granted") return true;

  const result = await Notifications.requestPermissionsAsync();
  const finalStatus = (result as { status: string }).status;
  return finalStatus === "granted";
}

/**
 * Schedule local notifications for a single reminder.
 * Uses smart tiered logic based on how far away the reminder is:
 * - > 7 days: 1 week before + 1 day before + 2 hours before + exact
 * - 2–7 days: 1 day before + 2 hours before + exact
 * - 5h–2 days: 2 hours before + exact
 * - < 5 hours: exact only
 * Appointments (תור, רופא, etc.) get an extra 5-hours-before notification.
 */
export async function scheduleReminderNotifications(
  reminder: Reminder
): Promise<void> {
  const scheduledDate = new Date(reminder.scheduledTime);
  const now = new Date();
  const msUntil = scheduledDate.getTime() - now.getTime();

  // Don't schedule for past reminders
  if (msUntil <= 0) return;

  const HOUR = 60 * 60 * 1000;
  const DAY = 24 * HOUR;

  const isAppointment = APPOINTMENT_KEYWORDS.some((keyword) =>
    reminder.title.includes(keyword)
  );

  // Build notification schedule based on distance
  const offsets: { ms: number; label: string }[] = [];

  // Always notify at exact time
  offsets.push({ ms: 0, label: "" });

  // 2 hours before (if reminder is > 5 hours away)
  if (msUntil > 5 * HOUR) {
    offsets.push({ ms: 2 * HOUR, label: "בעוד שעתיים" });
  }

  // 5 hours before for appointments (if > 1 day away)
  if (isAppointment && msUntil > 1 * DAY) {
    offsets.push({ ms: 5 * HOUR, label: "בעוד 5 שעות" });
  }

  // 1 day before (if > 2 days away)
  if (msUntil > 2 * DAY) {
    offsets.push({ ms: 1 * DAY, label: "מחר" });
  }

  // 1 week before (if > 7 days away)
  if (msUntil > 7 * DAY) {
    offsets.push({ ms: 7 * DAY, label: "בעוד שבוע" });
  }

  // Schedule each notification
  for (const offset of offsets) {
    const triggerDate = new Date(scheduledDate.getTime() - offset.ms);
    if (triggerDate <= now) continue; // Skip if already past

    const body = offset.label
      ? `${offset.label}: ${reminder.title}`
      : reminder.title;

    await Notifications.scheduleNotificationAsync({
      identifier: `${reminder.id}_${offset.ms}`,
      content: {
        title: "Daily - תזכורת",
        body,
        sound: true,
        data: { reminderId: reminder.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
      },
    });
  }
}

/**
 * Cancel all scheduled notifications for a specific reminder.
 */
export async function cancelReminderNotification(
  reminderId: string
): Promise<void> {
  const HOUR = 60 * 60 * 1000;
  const DAY = 24 * HOUR;

  // Cancel all possible offset identifiers
  const possibleOffsets = [0, 2 * HOUR, 5 * HOUR, 1 * DAY, 7 * DAY];
  for (const offset of possibleOffsets) {
    await Notifications.cancelScheduledNotificationAsync(`${reminderId}_${offset}`);
  }
}

/**
 * Sync all reminders: cancel everything and re-schedule future reminders.
 * Called after fetching the full reminder list from the backend.
 */
export async function syncAllRemindersNotifications(
  reminders: Reminder[]
): Promise<void> {
  // Cancel all existing scheduled notifications to avoid duplicates
  await Notifications.cancelAllScheduledNotificationsAsync();

  // Re-schedule for all future reminders
  for (const reminder of reminders) {
    if (reminder.status === "pending") {
      await scheduleReminderNotifications(reminder);
    }
  }
}

/**
 * Configure how notifications behave when the app is in the foreground.
 * Call this once at app startup.
 */
export function configureForegroundHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}
