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
import { fetchReminders, createReminder } from "../api/reminderApi";
import { Reminder } from "../types";

interface DashboardScreenProps {
  onProfilePress: () => void;
  onAddPress: () => void;
}

export default function DashboardScreen({
  onProfilePress,
  onAddPress,
}: DashboardScreenProps) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadReminders = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchReminders();
      setReminders(data);
    } catch (err) {
      setError("לא ניתן להתחבר לשרת");
      console.error("[Dashboard] Load error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadReminders();
  }, [loadReminders]);

  const onRefresh = () => {
    setRefreshing(true);
    loadReminders();
  };

  const handleMicPress = async () => {
    if (isRecording) {
      setIsRecording(false);
      // Simulate voice-to-reminder creation
      try {
        const demoTime = new Date();
        demoTime.setDate(demoTime.getDate() + 2);
        demoTime.setHours(14, 0, 0, 0);

        await createReminder({
          title: "תור לספר ביום חמישי",
          scheduledTime: demoTime.toISOString(),
        });
        await loadReminders();
        Alert.alert("✓", "תזכורת נוצרה בהצלחה");
      } catch {
        Alert.alert("שגיאה", "לא ניתן ליצור תזכורת");
      }
    } else {
      setIsRecording(true);
    }
  };

  const handleCameraPress = () => {
    Alert.alert("סימולציה", 'סריקת קבלה / מסמך');
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
              />
            ))}
        </View>
      </ScrollView>

      <VoiceControls
        onMicPress={handleMicPress}
        onCameraPress={handleCameraPress}
        onAddPress={onAddPress}
        isRecording={isRecording}
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
