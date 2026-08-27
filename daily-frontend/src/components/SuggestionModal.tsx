import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
} from "react-native";

export interface ConflictData {
  reminderId: string;
  hasConflictOrOverload: boolean;
  suggestedTime: string;
  conflictWarning: string;
  recommendationReason: string;
  originalDayName: string;
}

interface SuggestionModalProps {
  visible: boolean;
  conflict: ConflictData | null;
  onAcceptSuggestion: () => void;
  onKeepOriginal: () => void;
}

/**
 * Modal that shows AI-driven schedule conflict warning and alternative suggestion.
 * Appears when the backend detects the target day is overloaded.
 */
export default function SuggestionModal({
  visible,
  conflict,
  onAcceptSuggestion,
  onKeepOriginal,
}: SuggestionModalProps) {
  if (!conflict) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onKeepOriginal}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerIcon}>🧠</Text>
            <Text style={styles.headerTitle}>Daily מציע</Text>
          </View>

          {/* Warning */}
          <View style={styles.warningBox}>
            <Text style={styles.warningIcon}>⚠️</Text>
            <Text style={styles.warningText}>{conflict.conflictWarning}</Text>
          </View>

          {/* Suggestion */}
          <View style={styles.suggestionBox}>
            <Text style={styles.suggestionIcon}>💡</Text>
            <Text style={styles.suggestionText}>
              הצעה של Daily: {conflict.recommendationReason}
            </Text>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.acceptBtn}
              onPress={onAcceptSuggestion}
            >
              <Text style={styles.acceptText}>קבל את ההצעה</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.keepBtn}
              onPress={onKeepOriginal}
            >
              <Text style={styles.keepText}>
                השאר ביום {conflict.originalDayName}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 360,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 18,
  },
  headerIcon: {
    fontSize: 22,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
  },
  warningBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FEF3C7",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    gap: 8,
  },
  warningIcon: {
    fontSize: 16,
    marginTop: 1,
  },
  warningText: {
    fontSize: 13,
    color: "#92400E",
    flex: 1,
    textAlign: "right",
    lineHeight: 20,
  },
  suggestionBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    gap: 8,
  },
  suggestionIcon: {
    fontSize: 16,
    marginTop: 1,
  },
  suggestionText: {
    fontSize: 13,
    color: "#1E40AF",
    flex: 1,
    textAlign: "right",
    lineHeight: 20,
  },
  actions: {
    gap: 10,
  },
  acceptBtn: {
    backgroundColor: "#2563EB",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  acceptText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  keepBtn: {
    backgroundColor: "#F3F4F6",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  keepText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4B5563",
  },
});
