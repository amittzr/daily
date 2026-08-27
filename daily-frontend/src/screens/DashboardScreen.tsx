import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import Header from "../components/Header";
import ProactiveCard from "../components/ProactiveCard";
import ReminderCard from "../components/ReminderCard";
import VoiceControls from "../components/VoiceControls";
import SuggestionModal, { ConflictData } from "../components/SuggestionModal";
import { fetchReminders, updateReminder } from "../api/reminderApi";
import { Reminder } from "../types";
import {
  requestPermissions,
  syncAllRemindersNotifications,
  scheduleReminderNotifications,
  cancelReminderNotification,
} from "../services/notificationService";

interface DashboardScreenProps {
  onProfilePress: () => void;
  onAddPress: () => void;
  onEditReminder: (reminder: Reminder) => void;
}

export default function DashboardScreen({
  onProfilePress,
  onAddPress,
  onEditReminder,
}: DashboardScreenProps) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflictData, setConflictData] = useState<ConflictData | null>(null);

  const loadReminders = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchReminders();
      setReminders(data);
      // Sync local notifications with fetched reminders
      await syncAllRemindersNotifications(data);
    } catch (err) {
      setError("לא ניתן להתחבר לשרת");
      console.error("[Dashboard] Load error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    // Request notification permissions on first load
    requestPermissions();
    loadReminders();
  }, [loadReminders]);

  const onRefresh = () => {
    setRefreshing(true);
    loadReminders();
  };

  const handleCameraPress = () => {
    Alert.alert("סימולציה", "סריקת קבלה / מסמך");
  };

  // Handle reminder deletion from child component
  const handleReminderDeleted = (id: string) => {
    setReminders((prev) => prev.filter((r) => r.id !== id));
  };

  // Handle reminder update from child component
  const handleReminderUpdated = (updated: Reminder) => {
    setReminders((prev) =>
      prev.map((r) => (r.id === updated.id ? updated : r))
    );
  };

  // Handle conflict detected from voice processing
  const handleConflictDetected = (data: Omit<ConflictData, "hasConflictOrOverload">) => {
    setConflictData({ ...data, hasConflictOrOverload: true });
  };

  // Accept the AI suggestion — update the reminder's scheduledTime
  const handleAcceptSuggestion = async () => {
    if (!conflictData) return;
    try {
      const updated = await updateReminder(conflictData.reminderId, {
        scheduledTime: conflictData.suggestedTime,
      });
      // Re-schedule notifications for the new time
      await cancelReminderNotification(conflictData.reminderId);
      await scheduleReminderNotifications(updated);
      // Update local state
      setReminders((prev) =>
        prev.map((r) => (r.id === updated.id ? updated : r))
      );
    } catch {
      Alert.alert("שגיאה", "לא ניתן לעדכן את המועד");
    }
    setConflictData(null);
  };

  // Keep original time — just dismiss modal
  const handleKeepOriginal = () => {
    setConflictData(null);
  };

  return (
    <View style={styles.container}>
      <Header onProfilePress={onProfilePress} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Proactive Notification */}
        <ProactiveCard
          title="ביטוח הרכב שלך מסתיים ב-1 בספטמבר"
          description="נמצאו חלופות זהות שיחסכו לך כ-450 ₪ בשנה."
          actionLabel="לחץ לצפייה בהשוואה והצעות חיסכון"
          onPress={() =>
            Alert.alert("ביטוח רכב", "השוואת מחירים תוצג כאן בגרסה המלאה")
          }
        />

        {/* Reminders Section */}
        <View style={styles.remindersCard}>
          <Text style={styles.sectionTitle}>תזכורות קרובות ופעולות מהירות</Text>

          {loading && (
            <ActivityIndicator
              size="small"
              color="#2563EB"
              style={{ marginTop: 20 }}
            />
          )}

          {error && !loading && (
            <View style={styles.errorState}>
              <Text style={styles.errorText}>{error}</Text>
              <Text style={styles.retryText} onPress={loadReminders}>
                נסה שוב
              </Text>
            </View>
          )}

          {!loading && !error && reminders.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🔕</Text>
              <Text style={styles.emptyText}>אין תזכורות קרובות</Text>
              <Text style={styles.emptySubtext}>
                לחץ על "+" או דבר עם Daily ליצירת תזכורת
              </Text>
            </View>
          )}

          {!loading &&
            !error &&
            reminders.map((reminder, index) => (
              <ReminderCard
                key={reminder.id}
                reminder={reminder}
                isLast={index === reminders.length - 1}
                onDeleted={handleReminderDeleted}
                onUpdated={handleReminderUpdated}
                onEdit={() => onEditReminder(reminder)}
              />
            ))}
        </View>
      </ScrollView>

      {/* Voice controls — handles recording internally */}
      <VoiceControls
        onCameraPress={handleCameraPress}
        onAddPress={onAddPress}
        onReminderCreated={loadReminders}
        onConflictDetected={handleConflictDetected}
      />

      {/* AI Suggestion Modal for schedule conflicts */}
      <SuggestionModal
        visible={conflictData !== null}
        conflict={conflictData}
        onAcceptSuggestion={handleAcceptSuggestion}
        onKeepOriginal={handleKeepOriginal}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 140,
  },
  remindersCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
    textAlign: "right",
    marginBottom: 12,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 24,
  },
  emptyIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  emptySubtext: {
    fontSize: 11,
    color: "#D1D5DB",
    marginTop: 4,
  },
  errorState: {
    alignItems: "center",
    paddingVertical: 16,
  },
  errorText: {
    fontSize: 12,
    color: "#EF4444",
  },
  retryText: {
    fontSize: 12,
    color: "#2563EB",
    fontWeight: "700",
    marginTop: 8,
    textDecorationLine: "underline",
  },
});
