import React from "react";
import { View, Text, TouchableOpacity, Linking, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Reminder } from "../types";

interface ReminderCardProps {
  reminder: Reminder;
  isLast?: boolean;
}

/**
 * Format ISO date to Hebrew-friendly display string.
 */
function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const timeStr = date.toLocaleTimeString("he-IL", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (date.toDateString() === now.toDateString()) {
    return `היום, ${timeStr}`;
  } else if (date.toDateString() === tomorrow.toDateString()) {
    return `מחר, ${timeStr}`;
  } else {
    const dayStr = date.toLocaleDateString("he-IL", { weekday: "long" });
    return `${dayStr}, ${timeStr}`;
  }
}

export default function ReminderCard({ reminder, isLast }: ReminderCardProps) {
  const handleCall = () => {
    if (reminder.phoneNumber) {
      Linking.openURL(`tel:${reminder.phoneNumber}`);
    }
  };

  const handleWebsite = () => {
    if (reminder.websiteUrl) {
      Linking.openURL(reminder.websiteUrl);
    }
  };

  return (
    <View style={[styles.container, !isLast && styles.borderBottom]}>
      <View style={styles.row}>
        <Text style={styles.time}>{formatDateTime(reminder.scheduledTime)}</Text>
        <Text style={styles.title}>{reminder.title}</Text>
      </View>

      {(reminder.phoneNumber || reminder.websiteUrl) && (
        <View style={styles.actions}>
          {reminder.phoneNumber && (
            <TouchableOpacity style={styles.callBtn} onPress={handleCall}>
              <Ionicons name="call-outline" size={12} color="#2563EB" />
              <Text style={styles.callText}>חיוג מהיר</Text>
            </TouchableOpacity>
          )}
          {reminder.websiteUrl && (
            <TouchableOpacity style={styles.webBtn} onPress={handleWebsite}>
              <Ionicons name="globe-outline" size={12} color="#4B5563" />
              <Text style={styles.webText}>פתח אתר</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: "#F9FAFB",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  time: {
    fontSize: 11,
    color: "#9CA3AF",
  },
  title: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    textAlign: "right",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 8,
    gap: 8,
  },
  callBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  callText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#2563EB",
  },
  webBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  webText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#4B5563",
  },
});
