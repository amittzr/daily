import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  StyleSheet,
  StatusBar,
  Alert,
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  Switch,
} from "react-native";
import OnboardingScreen from "./src/screens/OnboardingScreen";
import DashboardScreen from "./src/screens/DashboardScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import GroceryModal from "./src/screens/GroceryModal";
import DateTimePickerCustom from "./src/components/DateTimePicker";
import SuggestionModal, { ConflictData } from "./src/components/SuggestionModal";
import { createReminder, updateReminder } from "./src/api/reminderApi";
import { Reminder } from "./src/types";
import {
  configureForegroundHandler,
  scheduleReminderNotifications,
  cancelReminderNotification,
} from "./src/services/notificationService";

type Screen = "onboarding" | "dashboard" | "profile";

const DAYS_HE = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("onboarding");
  const [groceryVisible, setGroceryVisible] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);

  // Form state (shared for add and edit)
  const [formTitle, setFormTitle] = useState("");
  const [formDate, setFormDate] = useState(new Date());
  const [formPhone, setFormPhone] = useState("");
  const [formUrl, setFormUrl] = useState("");
  const [formRecurring, setFormRecurring] = useState(false);
  const [formInterval, setFormInterval] = useState(1); // days
  const [formCustomInterval, setFormCustomInterval] = useState(false);

  // Conflict suggestion state
  const [conflictData, setConflictData] = useState<ConflictData | null>(null);

  // Refresh trigger for dashboard
  const [refreshKey, setRefreshKey] = useState(0);

  // Configure notification foreground handler on app startup
  useEffect(() => {
    configureForegroundHandler();
  }, []);

  // Reset form fields
  const resetForm = () => {
    setFormTitle("");
    setFormDate(new Date());
    setFormPhone("");
    setFormUrl("");
    setFormRecurring(false);
    setFormInterval(1);
    setFormCustomInterval(false);
  };

  // Open add modal
  const handleOpenAdd = () => {
    resetForm();
    setAddModalVisible(true);
  };

  // Open edit modal with existing reminder data
  const handleOpenEdit = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setFormTitle(reminder.title);
    setFormDate(new Date(reminder.scheduledTime));
    setFormPhone(reminder.phoneNumber || "");
    setFormUrl(reminder.websiteUrl || "");
    setFormRecurring(reminder.isRecurring || false);
    const interval = reminder.recurrenceIntervalDays || 1;
    setFormInterval(interval);
    // If the interval isn't a preset, show it as custom
    setFormCustomInterval(![1, 3, 7, 14, 30].includes(interval));
    setEditModalVisible(true);
  };

  // Create a new reminder
  const handleAddReminder = async () => {
    if (!formTitle.trim()) {
      Alert.alert("שגיאה", "נא למלא כותרת");
      return;
    }

    try {
      const result = await createReminder({
        title: formTitle.trim(),
        scheduledTime: formDate.toISOString(),
        phoneNumber: formPhone.trim() || undefined,
        websiteUrl: formUrl.trim() || undefined,
        isRecurring: formRecurring,
        recurrenceIntervalDays: formRecurring ? formInterval : undefined,
      });

      // Schedule local notification
      await scheduleReminderNotifications(result.reminder);

      setAddModalVisible(false);
      resetForm();
      setRefreshKey((k) => k + 1);

      // Check for conflict
      if (result.conflict?.hasConflictOrOverload) {
        const dayIndex = new Date(result.reminder.scheduledTime).getDay();
        setConflictData({
          reminderId: result.reminder.id,
          hasConflictOrOverload: true,
          suggestedTime: result.conflict.suggestedTime,
          conflictWarning: result.conflict.conflictWarning,
          recommendationReason: result.conflict.recommendationReason,
          originalDayName: DAYS_HE[dayIndex],
        });
      } else {
        Alert.alert("✓", "תזכורת נוצרה בהצלחה");
      }
    } catch {
      Alert.alert("שגיאה", "לא ניתן ליצור תזכורת");
    }
  };

  // Update an existing reminder
  const handleEditReminder = async () => {
    if (!editingReminder) return;
    if (!formTitle.trim()) {
      Alert.alert("שגיאה", "נא למלא כותרת");
      return;
    }

    try {
      const updated = await updateReminder(editingReminder.id, {
        title: formTitle.trim(),
        scheduledTime: formDate.toISOString(),
        phoneNumber: formPhone.trim() || undefined,
        websiteUrl: formUrl.trim() || undefined,
        isRecurring: formRecurring,
        recurrenceIntervalDays: formRecurring ? formInterval : null,
      });

      // Re-schedule notifications
      await cancelReminderNotification(editingReminder.id);
      await scheduleReminderNotifications(updated);

      setEditModalVisible(false);
      setEditingReminder(null);
      resetForm();
      setRefreshKey((k) => k + 1);

      // Check for conflict after edit
      if (updated.conflict?.hasConflictOrOverload) {
        const dayIndex = new Date(updated.scheduledTime).getDay();
        setConflictData({
          reminderId: updated.id,
          hasConflictOrOverload: true,
          suggestedTime: updated.conflict.suggestedTime,
          conflictWarning: updated.conflict.conflictWarning,
          recommendationReason: updated.conflict.recommendationReason,
          originalDayName: DAYS_HE[dayIndex],
        });
      } else {
        Alert.alert("✓", "תזכורת עודכנה בהצלחה");
      }
    } catch {
      Alert.alert("שגיאה", "לא ניתן לעדכן תזכורת");
    }
  };

  // Accept AI suggestion — move reminder to suggested time
  const handleAcceptSuggestion = async () => {
    if (!conflictData) return;
    try {
      const updated = await updateReminder(conflictData.reminderId, {
        scheduledTime: conflictData.suggestedTime,
      });
      await cancelReminderNotification(conflictData.reminderId);
      await scheduleReminderNotifications(updated);
      setRefreshKey((k) => k + 1);
    } catch {
      Alert.alert("שגיאה", "לא ניתן לעדכן את המועד");
    }
    setConflictData(null);
  };

  // Keep original time
  const handleKeepOriginal = () => {
    setConflictData(null);
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case "onboarding":
        return (
          <OnboardingScreen onComplete={() => setCurrentScreen("dashboard")} />
        );
      case "dashboard":
        return (
          <DashboardScreen
            key={refreshKey}
            onProfilePress={() => setCurrentScreen("profile")}
            onAddPress={handleOpenAdd}
            onEditReminder={handleOpenEdit}
          />
        );
      case "profile":
        return (
          <ProfileScreen onBack={() => setCurrentScreen("dashboard")} />
        );
    }
  };

  // Shared form content for both add and edit modals
  const renderFormContent = (isEdit: boolean) => (
    <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <Text style={styles.modalTitle}>
        {isEdit ? "עריכת תזכורת" : "תזכורת חדשה"}
      </Text>

      <Text style={styles.inputLabel}>כותרת *</Text>
      <TextInput
        style={styles.input}
        placeholder="למשל: תור לרופא שיניים"
        placeholderTextColor="#9CA3AF"
        value={formTitle}
        onChangeText={setFormTitle}
        textAlign="right"
      />

      <Text style={styles.inputLabel}>תאריך ושעה *</Text>
      <DateTimePickerCustom value={formDate} onChange={(date) => setFormDate(date)} />

      <Text style={styles.inputLabel}>טלפון (אופציונלי)</Text>
      <TextInput
        style={styles.input}
        placeholder="03-1234567"
        placeholderTextColor="#9CA3AF"
        value={formPhone}
        onChangeText={setFormPhone}
        textAlign="right"
        keyboardType="phone-pad"
      />

      <Text style={styles.inputLabel}>אתר (אופציונלי)</Text>
      <TextInput
        style={styles.input}
        placeholder="https://example.com"
        placeholderTextColor="#9CA3AF"
        value={formUrl}
        onChangeText={setFormUrl}
        textAlign="right"
        keyboardType="url"
      />

      {/* Recurring Toggle */}
      <View style={styles.recurringRow}>
        <Switch
          value={formRecurring}
          onValueChange={setFormRecurring}
          trackColor={{ false: "#E5E7EB", true: "#93C5FD" }}
          thumbColor={formRecurring ? "#2563EB" : "#F3F4F6"}
        />
        <Text style={styles.recurringLabel}>תזכורת מחזורית 🔄</Text>
      </View>

      {/* Frequency Picker (shown when recurring is on) */}
      {formRecurring && (
        <>
          <View style={styles.freqPicker}>
            {[
              { label: "כל יום", days: 1 },
              { label: "כל 3 ימים", days: 3 },
              { label: "כל שבוע", days: 7 },
              { label: "כל שבועיים", days: 14 },
              { label: "כל חודש", days: 30 },
            ].map((opt) => (
              <TouchableOpacity
                key={opt.days}
                style={[styles.freqOption, formInterval === opt.days && styles.freqOptionActive]}
                onPress={() => {
                  setFormInterval(opt.days);
                  setFormCustomInterval(false);
                }}
              >
                <Text
                  style={[styles.freqText, formInterval === opt.days && styles.freqTextActive]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
            {/* Custom option */}
            <TouchableOpacity
              style={[styles.freqOption, formCustomInterval && styles.freqOptionActive]}
              onPress={() => setFormCustomInterval(true)}
            >
              <Text style={[styles.freqText, formCustomInterval && styles.freqTextActive]}>
                מותאם אישית
              </Text>
            </TouchableOpacity>
          </View>

          {/* Custom days input */}
          {formCustomInterval && (
            <View style={styles.customIntervalRow}>
              <Text style={styles.customIntervalLabel}>ימים</Text>
              <TextInput
                style={styles.customIntervalInput}
                value={formInterval.toString()}
                onChangeText={(t) => {
                  const n = parseInt(t.replace(/[^0-9]/g, "")) || 1;
                  setFormInterval(Math.max(1, Math.min(365, n)));
                }}
                keyboardType="number-pad"
                textAlign="center"
                maxLength={3}
              />
              <Text style={styles.customIntervalLabel}>כל</Text>
            </View>
          )}
        </>
      )}

      <TouchableOpacity
        style={styles.submitBtn}
        onPress={isEdit ? handleEditReminder : handleAddReminder}
      >
        <Text style={styles.submitText}>
          {isEdit ? "עדכן תזכורת" : "צור תזכורת"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderFormModal = (visible: boolean, onClose: () => void, isEdit: boolean) => (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <TouchableOpacity style={styles.modalBackdropPress} onPress={onClose} />
          <View style={styles.modalSheet}>
            {renderFormContent(isEdit)}
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      {renderScreen()}

      {/* Grocery Modal */}
      <GroceryModal
        visible={groceryVisible}
        onClose={() => setGroceryVisible(false)}
      />

      {/* Add Reminder Modal */}
      {renderFormModal(addModalVisible, () => setAddModalVisible(false), false)}

      {/* Edit Reminder Modal */}
      {renderFormModal(editModalVisible, () => { setEditModalVisible(false); setEditingReminder(null); }, true)}

      {/* AI Suggestion Modal */}
      <SuggestionModal
        visible={conflictData !== null}
        conflict={conflictData}
        onAcceptSuggestion={handleAcceptSuggestion}
        onKeepOriginal={handleKeepOriginal}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalBackdropPress: {
    flex: 1,
  },
  modalSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "90%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
    textAlign: "right",
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4B5563",
    textAlign: "right",
    marginBottom: 4,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: "#1F2937",
  },
  submitBtn: {
    backgroundColor: "#2563EB",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 10,
  },
  submitText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  recurringRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 16,
  },
  recurringLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#374151",
  },
  freqPicker: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 12,
  },
  freqOption: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
  },
  freqOptionActive: {
    backgroundColor: "#EFF6FF",
    borderColor: "#2563EB",
  },
  freqText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
  },
  freqTextActive: {
    color: "#2563EB",
    fontWeight: "700",
  },
  customIntervalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 12,
  },
  customIntervalLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  customIntervalInput: {
    borderWidth: 1,
    borderColor: "#2563EB",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    minWidth: 60,
  },
});
