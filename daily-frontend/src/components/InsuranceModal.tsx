import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ActivityIndicator,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getInsuranceComparison, InsuranceComparison } from "../api/insuranceApi";

interface InsuranceModalProps {
  visible: boolean;
  documentId: string | null;
  onClose: () => void;
}

/**
 * Modal showing insurance comparison: current policy vs. government rate.
 * Provides a deep link to Bestie for full comparison.
 */
export default function InsuranceModal({
  visible,
  documentId,
  onClose,
}: InsuranceModalProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<InsuranceComparison | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible && documentId) {
      setLoading(true);
      setError(null);
      getInsuranceComparison(documentId)
        .then(setData)
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [visible, documentId]);

  const handleOpenBestie = () => {
    if (data?.bestieDeepLink) {
      Linking.openURL(data.bestieDeepLink);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <TouchableOpacity style={styles.backdropPress} onPress={onClose} />
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color="#9CA3AF" />
            </TouchableOpacity>
            <Text style={styles.title}>השוואת ביטוח רכב</Text>
            <Ionicons name="car-sport-outline" size={22} color="#2563EB" />
          </View>

          {loading && (
            <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 40 }} />
          )}

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>שגיאה: {error}</Text>
            </View>
          )}

          {data && !loading && (
            <View style={styles.content}>
              {/* Current Policy */}
              <View style={styles.policyCard}>
                <Text style={styles.policyLabel}>הפוליסה הנוכחית שלך</Text>
                <View style={styles.policyRow}>
                  <Text style={styles.policyValue}>₪{data.currentPolicy.cost?.toLocaleString()}</Text>
                  <Text style={styles.policyProvider}>{data.currentPolicy.provider}</Text>
                </View>
                {data.currentPolicy.carModel && (
                  <Text style={styles.policyDetail}>
                    {data.currentPolicy.carModel} | {data.currentPolicy.carNumber}
                  </Text>
                )}
                {data.currentPolicy.expirationDate && (
                  <Text style={styles.policyExpiry}>
                    תוקף עד: {new Date(data.currentPolicy.expirationDate).toLocaleDateString("he-IL")}
                  </Text>
                )}
              </View>

              {/* Government Rate */}
              <View style={styles.govCard}>
                <Text style={styles.govLabel}>תעריף חובה ממשלתי (משוער)</Text>
                <Text style={styles.govValue}>₪{data.governmentCompulsoryRate.toLocaleString()}</Text>
              </View>

              {/* Savings Badge */}
              {data.estimatedSavings > 0 && (
                <View style={styles.savingsBadge}>
                  <Ionicons name="flash" size={16} color="#059669" />
                  <Text style={styles.savingsText}>
                    חיסכון משוער: ₪{data.estimatedSavings.toLocaleString()} בשנה
                  </Text>
                </View>
              )}

              {/* Bestie CTA */}
              <TouchableOpacity style={styles.bestieBtn} onPress={handleOpenBestie}>
                <Text style={styles.bestieText}>השווה והשלם ב-Bestie</Text>
                <Ionicons name="open-outline" size={16} color="#FFFFFF" />
              </TouchableOpacity>

              <Text style={styles.disclaimer}>
                * הנתונים מבוססים על חישוב משוער. לקבלת הצעה מדויקת יש להשלים את התהליך באתר.
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  backdropPress: {
    flex: 1,
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "85%",
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
  errorBox: {
    backgroundColor: "#FEF2F2",
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  errorText: {
    color: "#DC2626",
    fontSize: 13,
    textAlign: "center",
  },
  content: {
    gap: 14,
  },
  policyCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  policyLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6B7280",
    textAlign: "right",
    marginBottom: 8,
  },
  policyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  policyProvider: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
  },
  policyValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#DC2626",
  },
  policyDetail: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "right",
    marginTop: 6,
  },
  policyExpiry: {
    fontSize: 11,
    color: "#9CA3AF",
    textAlign: "right",
    marginTop: 4,
  },
  govCard: {
    backgroundColor: "#EFF6FF",
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  govLabel: {
    fontSize: 12,
    color: "#1E40AF",
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
  },
  govValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#2563EB",
  },
  savingsBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ECFDF5",
    borderRadius: 10,
    paddingVertical: 10,
    gap: 8,
  },
  savingsText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#059669",
  },
  bestieBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2563EB",
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  bestieText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  disclaimer: {
    fontSize: 10,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 16,
  },
});
