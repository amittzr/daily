import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Modal,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  InsuranceDocument,
  updateInsuranceDocument,
  getDocumentFileUrl,
} from "../api/insuranceApi";

interface InsuranceDetailModalProps {
  visible: boolean;
  document: InsuranceDocument | null;
  onClose: () => void;
  onUpdated: (doc: InsuranceDocument) => void;
}

/**
 * Modal showing parsed insurance document details with edit capability
 * and a preview of the uploaded file.
 */
export default function InsuranceDetailModal({
  visible,
  document,
  onClose,
  onUpdated,
}: InsuranceDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [provider, setProvider] = useState("");
  const [carNumber, setCarNumber] = useState("");
  const [carModel, setCarModel] = useState("");
  const [annualCost, setAnnualCost] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [showImage, setShowImage] = useState(false);

  // Sync local state when document changes
  React.useEffect(() => {
    if (document) {
      setProvider(document.providerName || "");
      setCarNumber(document.carNumber || "");
      setCarModel(document.carModel || "");
      setAnnualCost(document.annualCost?.toString() || "");
      setExpirationDate(
        document.expirationDate
          ? new Date(document.expirationDate).toLocaleDateString("he-IL")
          : ""
      );
    }
  }, [document]);

  if (!document) return null;

  const handleSave = async () => {
    try {
      // Parse expiration date from Hebrew format (DD/MM/YYYY or DD.MM.YYYY)
      let parsedExpiration: string | undefined;
      if (expirationDate) {
        const parts = expirationDate.split(/[./\-]/);
        if (parts.length === 3) {
          const [day, month, year] = parts;
          parsedExpiration = new Date(
            parseInt(year), parseInt(month) - 1, parseInt(day)
          ).toISOString();
        }
      }

      const updated = await updateInsuranceDocument(document.id, {
        providerName: provider || undefined,
        carNumber: carNumber || undefined,
        carModel: carModel || undefined,
        annualCost: annualCost ? parseFloat(annualCost) : undefined,
        expirationDate: parsedExpiration,
      });

      onUpdated(updated);
      setIsEditing(false);
      Alert.alert("✓", "הפרטים עודכנו בהצלחה");
    } catch {
      Alert.alert("שגיאה", "לא ניתן לעדכן את הפרטים");
    }
  };

  const fileUrl = getDocumentFileUrl(document.id);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          style={styles.backdrop}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <TouchableOpacity style={styles.backdropPress} onPress={onClose} />
          <View style={styles.sheet}>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={22} color="#9CA3AF" />
              </TouchableOpacity>
              <Text style={styles.title}>פרטי ביטוח רכב</Text>
              <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
                <Ionicons
                  name={isEditing ? "checkmark-circle" : "create-outline"}
                  size={22}
                  color={isEditing ? "#059669" : "#2563EB"}
                />
              </TouchableOpacity>
            </View>

            {/* Document Image Preview */}
            <TouchableOpacity
              style={styles.imagePreview}
              onPress={() => setShowImage(!showImage)}
            >
              {showImage ? (
                <Image
                  source={{ uri: fileUrl }}
                  style={styles.documentImage}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="document-text-outline" size={32} color="#2563EB" />
                  <Text style={styles.imageText}>לחץ לצפייה במסמך</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Parsed Details */}
            <View style={styles.detailsCard}>
              <Text style={styles.sectionLabel}>פרטים שזוהו מהמסמך</Text>

              <DetailRow
                label="חברת ביטוח"
                value={provider}
                editable={isEditing}
                onChange={setProvider}
                placeholder="הפניקס, הראל..."
              />
              <DetailRow
                label="מספר רכב"
                value={carNumber}
                editable={isEditing}
                onChange={setCarNumber}
                placeholder="1234567"
                keyboardType="numeric"
              />
              <DetailRow
                label="דגם רכב"
                value={carModel}
                editable={isEditing}
                onChange={setCarModel}
                placeholder="מאזדה 3"
              />
              <DetailRow
                label="עלות שנתית (₪)"
                value={annualCost}
                editable={isEditing}
                onChange={setAnnualCost}
                placeholder="3400"
                keyboardType="numeric"
              />
              <DetailRow
                label="תאריך תפוגה"
                value={expirationDate}
                editable={isEditing}
                onChange={setExpirationDate}
                placeholder="01/09/2026"
              />
            </View>

            {/* Save button when editing */}
            {isEditing && (
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveText}>שמור שינויים</Text>
              </TouchableOpacity>
            )}

            {/* Status indicator */}
            <View style={styles.statusRow}>
              <Ionicons
                name={document.annualCost ? "checkmark-circle" : "alert-circle"}
                size={16}
                color={document.annualCost ? "#059669" : "#F59E0B"}
              />
              <Text style={[styles.statusText, { color: document.annualCost ? "#059669" : "#F59E0B" }]}>
                {document.annualCost
                  ? "המסמך נותח בהצלחה — כל הפרטים מלאים"
                  : "חלק מהפרטים חסרים — לחץ על עריכה להשלמה"}
              </Text>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
    </Modal>
  );
}

// Reusable detail row component
function DetailRow({
  label,
  value,
  editable,
  onChange,
  placeholder,
  keyboardType,
}: {
  label: string;
  value: string;
  editable: boolean;
  onChange: (v: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "numeric";
}) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      {editable ? (
        <TextInput
          style={styles.detailInput}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          textAlign="right"
          keyboardType={keyboardType || "default"}
        />
      ) : (
        <Text style={[styles.detailValue, !value && styles.detailEmpty]}>
          {value || "לא זוהה"}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  backdropPress: { flex: 1 },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "90%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
  },
  imagePreview: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
    marginBottom: 16,
  },
  imagePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#F9FAFB",
    gap: 8,
  },
  imageText: {
    fontSize: 12,
    color: "#6B7280",
  },
  documentImage: {
    width: "100%",
    height: 200,
    backgroundColor: "#F9FAFB",
  },
  detailsCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6B7280",
    textAlign: "right",
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  detailLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
  },
  detailEmpty: {
    color: "#D1D5DB",
    fontStyle: "italic",
  },
  detailInput: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
    borderBottomWidth: 1,
    borderBottomColor: "#2563EB",
    paddingVertical: 2,
    minWidth: 120,
  },
  saveBtn: {
    backgroundColor: "#059669",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  saveText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
});
