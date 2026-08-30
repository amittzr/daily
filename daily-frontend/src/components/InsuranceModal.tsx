import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ActivityIndicator,
  Image,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import {
  getInsuranceComparison,
  compareOnDemand,
  InsuranceComparison,
} from "../api/insuranceApi";

interface InsuranceModalProps {
  visible: boolean;
  documentId: string | null;
  /** If true, uses the on-demand endpoint instead of GET compare */
  onDemand?: boolean;
  onClose: () => void;
}

/**
 * Modal showing insurance comparison: current policy vs. TOP 5 cheapest carriers.
 * Provides a deep link to Bestie for comprehensive coverage comparison.
 */
export default function InsuranceModal({
  visible,
  documentId,
  onDemand,
  onClose,
}: InsuranceModalProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<InsuranceComparison | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setLoading(true);
      setError(null);
      setData(null);

      const fetcher = onDemand
        ? compareOnDemand({ documentId: documentId || undefined })
        : documentId
        ? getInsuranceComparison(documentId)
        : Promise.reject(new Error("אין מסמך ביטוח. העלה מסמך תחילה."));

      fetcher
        .then(setData)
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [visible, documentId, onDemand]);

  const handleOpenBestie = async () => {
    if (data?.bestieDeepLink) {
      await WebBrowser.openBrowserAsync(data.bestieDeepLink);
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
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color="#2563EB" />
              <Text style={styles.loadingText}>מחשב מחירים מהמאגר הממשלתי...</Text>
            </View>
          )}

          {error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={24} color="#DC2626" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {data && !loading && (
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Current Policy Benchmark */}
              {data.currentPolicy.annualCost > 0 && (
                <View style={styles.currentBox}>
                  <Text style={styles.currentLabel}>התשלום השנתי הנוכחי שלך</Text>
                  <View style={styles.currentRow}>
                    <Text style={styles.currentValue}>
                      ₪{data.currentPolicy.annualCost.toLocaleString()}
                    </Text>
                    <Text style={styles.currentProvider}>{data.currentPolicy.providerName}</Text>
                  </View>
                </View>
              )}

              {/* Top 5 Cheapest Section */}
              <Text style={styles.sectionTitle}>5 החברות הזולות בשוק (ביטוח חובה)</Text>

              {data.top5Rates.map((rate, index) => (
                <TouchableOpacity
                  key={rate.companyName}
                  style={[styles.rateRow, index === 0 && styles.rateRowCheapest]}
                  activeOpacity={rate.companyUrl ? 0.6 : 1}
                  onPress={() => {
                    if (rate.companyUrl) WebBrowser.openBrowserAsync(rate.companyUrl);
                  }}
                >
                  {/* Price */}
                  <View style={styles.priceWrap}>
                    <Text style={[styles.priceValue, index === 0 && styles.priceCheapest]}>
                      ₪{rate.price.toLocaleString()}
                    </Text>
                    {index === 0 && (
                      <View style={styles.cheapestBadge}>
                        <Text style={styles.cheapestBadgeText}>הכי זול בשוק</Text>
                      </View>
                    )}
                  </View>

                  {/* Company name + logo + link icon */}
                  <View style={styles.companyWrap}>
                    {rate.companyUrl ? (
                      <Ionicons name="open-outline" size={14} color="#9CA3AF" />
                    ) : null}
                    <Text style={styles.companyName}>{rate.companyName}</Text>
                    <Image
                      source={{ uri: rate.logoUrl }}
                      style={styles.logo}
                      resizeMode="contain"
                    />
                  </View>
                </TouchableOpacity>
              ))}

              {/* Savings */}
              {data.estimatedSavings > 0 && (
                <View style={styles.savingsBadge}>
                  <Ionicons name="flash" size={16} color="#059669" />
                  <Text style={styles.savingsText}>
                    חיסכון פוטנציאלי: ₪{data.estimatedSavings.toLocaleString()} בשנה
                  </Text>
                </View>
              )}

              {/* Bestie CTA */}
              <TouchableOpacity style={styles.bestieBtn} onPress={handleOpenBestie}>
                <Text style={styles.bestieText}>השלם השוואת מקיף ב-Bestie</Text>
                <Ionicons name="open-outline" size={16} color="#FFFFFF" />
              </TouchableOpacity>

              <Text style={styles.disclaimer}>
                * מחירי ביטוח חובה מבוססים על מחשבון רשות שוק ההון. הצעה סופית מותנית באתר המבטח.
              </Text>
            </ScrollView>
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
  backdropPress: { flex: 1 },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "88%",
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
  title: { fontSize: 18, fontWeight: "700", color: "#1F2937" },
  centerBox: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 12,
  },
  loadingText: { fontSize: 13, color: "#6B7280" },
  errorBox: {
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    padding: 20,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  errorText: { color: "#DC2626", fontSize: 13, textAlign: "center" },
  currentBox: {
    backgroundColor: "#F9FAFB",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 16,
  },
  currentLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6B7280",
    textAlign: "right",
    marginBottom: 8,
  },
  currentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  currentProvider: { fontSize: 15, fontWeight: "700", color: "#1F2937" },
  currentValue: { fontSize: 20, fontWeight: "800", color: "#DC2626" },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
    textAlign: "right",
    marginBottom: 12,
  },
  rateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    marginBottom: 8,
    backgroundColor: "#FFFFFF",
  },
  rateRowCheapest: {
    borderColor: "#A7F3D0",
    backgroundColor: "#ECFDF5",
  },
  priceWrap: {
    alignItems: "flex-start",
  },
  priceValue: { fontSize: 18, fontWeight: "800", color: "#1F2937" },
  priceCheapest: { color: "#059669" },
  cheapestBadge: {
    backgroundColor: "#059669",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 4,
  },
  cheapestBadgeText: { fontSize: 9, fontWeight: "700", color: "#FFFFFF" },
  companyWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  companyName: { fontSize: 14, fontWeight: "700", color: "#1F2937" },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: "#F9FAFB",
  },
  savingsBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ECFDF5",
    borderRadius: 10,
    paddingVertical: 12,
    gap: 8,
    marginTop: 8,
    marginBottom: 16,
  },
  savingsText: { fontSize: 14, fontWeight: "700", color: "#059669" },
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
  bestieText: { fontSize: 15, fontWeight: "700", color: "#FFFFFF" },
  disclaimer: {
    fontSize: 10,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 16,
    marginTop: 12,
  },
});
