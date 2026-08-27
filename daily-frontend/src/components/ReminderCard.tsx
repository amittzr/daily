import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Linking,
  StyleSheet,
  Animated,
  PanResponder,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Reminder } from "../types";
import { updateReminder, deleteReminder } from "../api/reminderApi";
import { cancelReminderNotification } from "../services/notificationService";

interface ReminderCardProps {
  reminder: Reminder;
  isLast?: boolean;
  onDeleted: (id: string) => void;
  onUpdated: (updated: Reminder) => void;
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

/**
 * Check if a reminder is overdue (past time + still pending).
 */
function isOverdue(reminder: Reminder): boolean {
  return (
    reminder.status === "pending" && new Date(reminder.scheduledTime) < new Date()
  );
}

const SWIPE_THRESHOLD = -80;

export default function ReminderCard({
  reminder,
  isLast,
  onDeleted,
  onUpdated,
}: ReminderCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [status, setStatus] = useState(reminder.status);
  const translateX = useRef(new Animated.Value(0)).current;

  const isCompleted = status === "completed";
  const overdue = isOverdue({ ...reminder, status });

  // PanResponder for swipe-to-delete
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dy) < 10,
      onPanResponderMove: (_, gestureState) => {
        // Only allow swipe left (negative dx)
        if (gestureState.dx < 0) {
          translateX.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < SWIPE_THRESHOLD) {
          // Swiped far enough — trigger delete
          Animated.timing(translateX, {
            toValue: -200,
            duration: 200,
            useNativeDriver: true,
          }).start(() => handleDelete());
        } else {
          // Snap back
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  // Toggle status between pending and completed
  const handleToggleStatus = async () => {
    const newStatus = isCompleted ? "pending" : "completed";
    setStatus(newStatus);

    try {
      const updated = await updateReminder(reminder.id, { status: newStatus });
      onUpdated(updated);

      // Cancel notifications if completed
      if (newStatus === "completed") {
        await cancelReminderNotification(reminder.id);
      }
    } catch {
      // Revert on failure
      setStatus(isCompleted ? "completed" : "pending");
      Alert.alert("שגיאה", "לא ניתן לעדכן סטטוס");
    }
  };

  // Handle delete
  const handleDelete = async () => {
    try {
      await deleteReminder(reminder.id);
      await cancelReminderNotification(reminder.id);
      onDeleted(reminder.id);
    } catch {
      Alert.alert("שגיאה", "לא ניתן למחוק תזכורת");
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    }
  };

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
    <View style={[styles.swipeWrapper, !isLast && styles.borderBottom]}>
      {/* Delete background (revealed on swipe) */}
      <View style={styles.deleteBackground}>
        <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
        <Text style={styles.deleteText}>מחק</Text>
      </View>

      {/* Card content (slides left) */}
      <Animated.View
        style={[styles.container, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          onPress={() => setIsExpanded(!isExpanded)}
          activeOpacity={0.7}
          style={styles.touchable}
        >
          {/* Main row */}
          <View style={styles.mainRow}>
            {/* Status checkbox */}
            <TouchableOpacity
              style={[styles.checkbox, isCompleted && styles.checkboxDone]}
              onPress={handleToggleStatus}
            >
              {isCompleted && (
                <Ionicons name="checkmark" size={14} color="#FFFFFF" />
              )}
            </TouchableOpacity>

            {/* Content */}
            <View style={styles.content}>
              <View style={styles.row}>
                <Text style={styles.time}>{formatDateTime(reminder.scheduledTime)}</Text>
                <Text
                  style={[styles.title, isCompleted && styles.titleCompleted]}
                  numberOfLines={isExpanded ? undefined : 1}
                >
                  {reminder.title}
                </Text>
              </View>

              {/* Overdue badge */}
              {overdue && (
                <View style={styles.overdueBadge}>
                  <Ionicons name="alert-circle" size={10} color="#DC2626" />
                  <Text style={styles.overdueText}>עבר הזמן</Text>
                </View>
              )}
            </View>

            {/* Expand indicator */}
            <Ionicons
              name={isExpanded ? "chevron-up" : "chevron-down"}
              size={16}
              color="#9CA3AF"
            />
          </View>

          {/* Expanded section */}
          {isExpanded && (
            <View style={styles.expanded}>
              {reminder.description && (
                <Text style={styles.description}>{reminder.description}</Text>
              )}

              <View style={styles.actions}>
                {reminder.phoneNumber && (
                  <TouchableOpacity style={styles.callBtn} onPress={handleCall}>
                    <Ionicons name="call-outline" size={13} color="#2563EB" />
                    <Text style={styles.callText}>חיוג מהיר</Text>
                  </TouchableOpacity>
                )}
                {reminder.websiteUrl && (
                  <TouchableOpacity style={styles.webBtn} onPress={handleWebsite}>
                    <Ionicons name="globe-outline" size={13} color="#4B5563" />
                    <Text style={styles.webText}>פתח אתר</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  swipeWrapper: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 8,
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  deleteBackground: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 80,
    backgroundColor: "#DC2626",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  deleteText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
    marginTop: 3,
  },
  container: {
    backgroundColor: "#FFFFFF",
  },
  touchable: {
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  mainRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxDone: {
    backgroundColor: "#059669",
    borderColor: "#059669",
  },
  content: {
    flex: 1,
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
    flex: 1,
    marginLeft: 8,
  },
  titleCompleted: {
    textDecorationLine: "line-through",
    color: "#9CA3AF",
  },
  overdueBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-end",
    marginTop: 4,
    backgroundColor: "#FEF2F2",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  overdueText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#DC2626",
  },
  expanded: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F9FAFB",
    marginLeft: 32,
  },
  description: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "right",
    marginBottom: 10,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  callBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 5,
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 5,
  },
  webText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#4B5563",
  },
});
