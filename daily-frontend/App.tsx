import React, { useState } from "react";
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
  Platform,
} from "react-native";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import OnboardingScreen from "./src/screens/OnboardingScreen";
import DashboardScreen from "./src/screens/DashboardScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import GroceryModal from "./src/screens/GroceryModal";
import { createReminder } from "./src/api/reminderApi";

type Screen = "onboarding" | "dashboard" | "profile";

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("onboarding");
  const [groceryVisible, setGroceryVisible] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);

  // Add Reminder form state
  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState(new Date());
  const [newPhone, setNewPhone] = useState("");
  const [newUrl, setNewUrl] = useState("");

  // Date/Time picker visibility
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const handleDateChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      // Keep the time from current newDate, update only the date part
      const updated = new Date(newDate);
      updated.setFullYear(selectedDate.getFullYear());
      updated.setMonth(selectedDate.getMonth());
      updated.setDate(selectedDate.getDate());
      setNewDate(updated);

      // On Android, show time picker after date is selected
      if (Platform.OS === "android") {
        setTimeout(() => setShowTimePicker(true), 300);
      }
    }
  };

  const handleTimeChange = (_event: DateTimePickerEvent, selectedTime?: Date) => {
    if (Platform.OS === "android") {
      setShowTimePicker(false);
    }
    if (selectedTime) {
      const updated = new Date(newDate);
      updated.setHours(selectedTime.getHours());
      updated.setMinutes(selectedTime.getMinutes());
      setNewDate(updated);
    }
  };

  const formatDisplayDate = (date: Date): string => {
    return date.toLocaleDateString("he-IL", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatDisplayTime = (date: Date): string => {
    return date.toLocaleTimeString("he-IL", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleAddReminder = async () => {
    if (!newTitle.trim()) {
      Alert.alert("שגיאה", "נא למלא כותרת");
      return;
    }

    try {
      await createReminder({
        title: newTitle.trim(),
        scheduledTime: newDate.toISOString(),
        phoneNumber: newPhone.trim() || undefined,
        websiteUrl: newUrl.trim() || undefined,
      });
      Alert.alert("✓", "תזכורת נוצרה בהצלחה");
      setAddModalVisible(false);
      setNewTitle("");
      setNewDate(new Date());
      setNewPhone("");
      setNewUrl("");
      // Force re-render dashboard
      setCurrentScreen("onboarding");
      setTimeout(() => setCurrentScreen("dashboard"), 0);
    } catch {
      Alert.alert("שגיאה", "לא ניתן ליצור תזכורת");
    }
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
            onProfilePress={() => setCurrentScreen("profile")}
            onAddPress={() => setAddModalVisible(true)}
          />
        );
      case "profile":
        return (
          <ProfileScreen onBack={() => setCurrentScreen("dashboard")} />
        );
    }
  };

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
      <Modal
        visible={addModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={styles.modalBackdropPress}
            onPress={() => setAddModalVisible(false)}
          />
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>תזכורת חדשה</Text>

            {/* Title Input */}
            <Text style={styles.inputLabel}>כותרת *</Text>
            <TextInput
              style={styles.input}
              placeholder="למשל: תור לרופא שיניים"
              placeholderTextColor="#9CA3AF"
              value={newTitle}
              onChangeText={setNewTitle}
              textAlign="right"
            />

            {/* Date Picker */}
            <Text style={styles.inputLabel}>תאריך *</Text>
            <TouchableOpacity
              style={styles.pickerBtn}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.pickerText}>
                📅 {formatDisplayDate(newDate)}
              </Text>
            </TouchableOpacity>

            {/* Time Picker */}
            <Text style={styles.inputLabel}>שעה *</Text>
            <TouchableOpacity
              style={styles.pickerBtn}
              onPress={() => setShowTimePicker(true)}
            >
              <Text style={styles.pickerText}>
                🕐 {formatDisplayTime(newDate)}
              </Text>
            </TouchableOpacity>

            {/* Native Date Picker */}
            {showDatePicker && (
              <DateTimePicker
                value={newDate}
                mode="date"
                display={Platform.OS === "ios" ? "inline" : "calendar"}
                onChange={handleDateChange}
                minimumDate={new Date()}
              />
            )}

            {/* Native Time Picker */}
            {showTimePicker && (
              <DateTimePicker
                value={newDate}
                mode="time"
                display={Platform.OS === "ios" ? "spinner" : "clock"}
                onChange={handleTimeChange}
                is24Hour={true}
              />
            )}

            {/* iOS: Confirm button to dismiss pickers */}
            {Platform.OS === "ios" && (showDatePicker || showTimePicker) && (
              <TouchableOpacity
                style={styles.confirmPickerBtn}
                onPress={() => {
                  setShowDatePicker(false);
                  setShowTimePicker(false);
                }}
              >
                <Text style={styles.confirmPickerText}>אישור</Text>
              </TouchableOpacity>
            )}

            {/* Phone Input */}
            <Text style={styles.inputLabel}>טלפון (אופציונלי)</Text>
            <TextInput
              style={styles.input}
              placeholder="03-1234567"
              placeholderTextColor="#9CA3AF"
              value={newPhone}
              onChangeText={setNewPhone}
              textAlign="right"
              keyboardType="phone-pad"
            />

            {/* URL Input */}
            <Text style={styles.inputLabel}>אתר (אופציונלי)</Text>
            <TextInput
              style={styles.input}
              placeholder="https://example.com"
              placeholderTextColor="#9CA3AF"
              value={newUrl}
              onChangeText={setNewUrl}
              textAlign="right"
              keyboardType="url"
            />

            <TouchableOpacity style={styles.submitBtn} onPress={handleAddReminder}>
              <Text style={styles.submitText}>צור תזכורת</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    maxHeight: "85%",
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
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: "#1F2937",
  },
  pickerBtn: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 14,
    backgroundColor: "#F9FAFB",
  },
  pickerText: {
    fontSize: 14,
    color: "#1F2937",
    textAlign: "right",
  },
  confirmPickerBtn: {
    alignSelf: "center",
    backgroundColor: "#2563EB",
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  confirmPickerText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
  submitBtn: {
    backgroundColor: "#2563EB",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 20,
  },
  submitText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
