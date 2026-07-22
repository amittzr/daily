import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface ProfileScreenProps {
  onBack: () => void;
}

export default function ProfileScreen({ onBack }: ProfileScreenProps) {
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>פרופיל ומסמכים אישיים</Text>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Ionicons name="arrow-forward" size={22} color="#4B5563" />
          </TouchableOpacity>
        </View>

        {/* User Info */}
        <View style={styles.userCard}>
          <Text style={styles.userName}>עמית</Text>
          <Text style={styles.userSubtext}>
            הגדרות והעלאת קבצים חד-פעמית למערכת החכמה
          </Text>
        </View>

        {/* Documents */}
        <Text style={styles.sectionTitle}>
          העלאת מסמכים לניתוח (ביטוחים, רכב, בריאות)
        </Text>

        {/* Car Insurance Doc */}
        <View style={styles.docRow}>
          <TouchableOpacity style={styles.docActionBtn}>
            <Text style={styles.docActionText}>החלף</Text>
          </TouchableOpacity>
          <View style={styles.docInfo}>
            <Ionicons name="document-text-outline" size={28} color="#7C3AED" />
            <View style={styles.docText}>
              <Text style={styles.docTitle}>ביטוח רכב (מקיף/חובה)</Text>
              <Text style={styles.docStatus}>
                <Ionicons name="checkmark" size={10} color="#059669" /> פוליסה
                נוכחית מעודכנת
              </Text>
            </View>
          </View>
        </View>

        {/* Medical Doc */}
        <View style={styles.docRow}>
          <TouchableOpacity style={[styles.docActionBtn, styles.docUploadBtn]}>
            <Text style={styles.docUploadText}>העלה</Text>
          </TouchableOpacity>
          <View style={styles.docInfo}>
            <Ionicons name="medkit-outline" size={28} color="#EF4444" />
            <View style={styles.docText}>
              <Text style={styles.docTitle}>פנקס חיסונים / מסמך רפואי</Text>
              <Text style={styles.docPending}>טרם הועלה קובץ</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveBtn} onPress={onBack}>
          <Text style={styles.saveText}>שמירה וחזרה למסך הבית</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  content: {
    padding: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    gap: 14,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1F2937",
    flex: 1,
    textAlign: "right",
  },
  userCard: {
    backgroundColor: "#F9FAFB",
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    alignItems: "flex-end",
  },
  userName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
  },
  userSubtext: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
    textAlign: "right",
    marginBottom: 14,
  },
  docRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#E5E7EB",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  docInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    justifyContent: "flex-end",
  },
  docText: {
    alignItems: "flex-end",
  },
  docTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1F2937",
  },
  docStatus: {
    fontSize: 10,
    color: "#059669",
    marginTop: 2,
  },
  docPending: {
    fontSize: 10,
    color: "#9CA3AF",
    marginTop: 2,
  },
  docActionBtn: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  docActionText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#4B5563",
  },
  docUploadBtn: {
    backgroundColor: "#EFF6FF",
  },
  docUploadText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#2563EB",
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    backgroundColor: "#F9FAFB",
  },
  saveBtn: {
    backgroundColor: "#2563EB",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  saveText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
