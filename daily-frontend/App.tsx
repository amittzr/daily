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
  ScrollView,
} from "react-native";
import OnboardingScreen from "./src/screens/OnboardingScreen";
import DashboardScreen from "./src/screens/DashboardScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import GroceryModal from "./src/screens/GroceryModal";
import DateTimePickerCustom from "./src/components/DateTimePicker";
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
            <ScrollView showsVerticalScrollIndicator={false}>
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

              {/* Date & Time Picker */}
              <Text style={styles.inputLabel}>תאריך ושעה *</Text>
              <DateTimePickerCustom
                value={newDate}
                onChange={(date) => setNewDate(date)}
              />

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
            </ScrollView>
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
});
