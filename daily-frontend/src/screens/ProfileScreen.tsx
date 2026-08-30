import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import {
  uploadInsuranceDocument,
  getInsuranceDocuments,
  InsuranceDocument,
} from "../api/insuranceApi";
import InsuranceDetailModal from "../components/InsuranceDetailModal";

interface ProfileScreenProps {
  onBack: () => void;
}

export default function ProfileScreen({ onBack }: ProfileScreenProps) {
  const [uploading, setUploading] = useState(false);
  const [insuranceDoc, setInsuranceDoc] = useState<InsuranceDocument | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  // Load existing insurance document on mount
  useEffect(() => {
    (async () => {
      try {
        const docs = await getInsuranceDocuments();
        if (docs.length > 0) setInsuranceDoc(docs[0]);
      } catch {
        // Non-critical
      }
    })();
  }, []);

  // Pick and upload insurance document
  const handleUploadInsurance = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("שגיאה", "נדרשת הרשאת גישה לתמונות");
        return;
      }

      // Pick image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.8,
        allowsEditing: false,
      });

      if (result.canceled || !result.assets[0]) return;

      setUploading(true);
      const uri = result.assets[0].uri;

      const doc = await uploadInsuranceDocument(uri);
      setInsuranceDoc(doc);
      setDetailModalVisible(true); // Show detail modal for review
    } catch (error) {
      console.error("[Profile] Upload error:", error);
      Alert.alert("שגיאה", "לא ניתן להעלות את המסמך");
    } finally {
      setUploading(false);
    }
  };

  // Take photo of insurance document
  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("שגיאה", "נדרשת הרשאת גישה למצלמה");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
        allowsEditing: false,
      });

      if (result.canceled || !result.assets[0]) return;

      setUploading(true);
      const uri = result.assets[0].uri;

      const doc = await uploadInsuranceDocument(uri);
      setInsuranceDoc(doc);
      setDetailModalVisible(true); // Show detail modal for review
    } catch (error) {
      console.error("[Profile] Camera error:", error);
      Alert.alert("שגיאה", "לא ניתן להעלות את המסמך");
    } finally {
      setUploading(false);
    }
  };

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

        {/* Documents Section */}
        <Text style={styles.sectionTitle}>
          העלאת מסמכים לניתוח (ביטוחים, רכב, בריאות)
        </Text>

        {/* Car Insurance Doc */}
        <View style={styles.docRow}>
          <View style={styles.docActions}>
            {uploading ? (
              <ActivityIndicator size="small" color="#2563EB" />
            ) : (
              <>
                <TouchableOpacity style={styles.docUploadBtn} onPress={handleUploadInsurance}>
                  <Ionicons name="image-outline" size={14} color="#2563EB" />
                  <Text style={styles.docUploadText}>גלריה</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.docCameraBtn} onPress={handleTakePhoto}>
                  <Ionicons name="camera-outline" size={14} color="#7C3AED" />
                  <Text style={styles.docCameraText}>צלם</Text>
                </TouchableOpacity>
                {insuranceDoc && (
                  <TouchableOpacity
                    style={styles.docViewBtn}
                    onPress={() => setDetailModalVisible(true)}
                  >
                    <Ionicons name="eye-outline" size={14} color="#059669" />
                    <Text style={styles.docViewText}>פרטים</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
          <View style={styles.docInfo}>
            <Ionicons name="car-sport-outline" size={28} color="#7C3AED" />
            <View style={styles.docText}>
              <Text style={styles.docTitle}>ביטוח רכב (מקיף/חובה)</Text>
              <Text style={insuranceDoc ? styles.docStatus : styles.docPending}>
                {insuranceDoc ? (
                  <>
                    <Ionicons name="checkmark" size={10} color="#059669" /> פוליסה מעודכנת
                    {insuranceDoc.carModel ? ` — ${insuranceDoc.carModel}` : ""}
                  </>
                ) : (
                  "העלה תמונה/סריקה של הפוליסה"
                )}
              </Text>
            </View>
          </View>
        </View>

        {/* Medical Doc (placeholder) */}
        <View style={styles.docRow}>
          <TouchableOpacity style={[styles.docUploadBtn, { opacity: 0.5 }]} disabled>
            <Text style={styles.docUploadText}>בקרוב</Text>
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

      {/* Insurance Detail Modal */}
      <InsuranceDetailModal
        visible={detailModalVisible}
        document={insuranceDoc}
        onClose={() => setDetailModalVisible(false)}
        onUpdated={(doc) => setInsuranceDoc(doc)}
      />
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
  docActions: {
    flexDirection: "column",
    gap: 6,
  },
  docUploadBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  docUploadText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#2563EB",
  },
  docCameraBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F3FF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  docCameraText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#7C3AED",
  },
  docViewBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  docViewText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#059669",
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
