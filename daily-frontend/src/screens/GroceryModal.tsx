import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface GroceryModalProps {
  visible: boolean;
  onClose: () => void;
}

interface GroceryItem {
  name: string;
  frequency: string;
}

const GROCERY_ITEMS: GroceryItem[] = [
  { name: "חלב תנובה 3% (2 יח')", frequency: "מבוסס תדירות (שבועי)" },
  { name: "ביצים לארג' (מגש 30)", frequency: "מבוסס תדירות (10 ימים)" },
];

export default function GroceryModal({ visible, onClose }: GroceryModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <TouchableOpacity style={styles.backdropPress} onPress={onClose} />
        <View style={styles.sheet}>
          <ScrollView>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={22} color="#9CA3AF" />
              </TouchableOpacity>
              <Text style={styles.title}>רשימת קניות אוטומטית חכמה</Text>
            </View>

            <Text style={styles.subtitle}>
              המערכת יצרה רשימה זו על בסיס ניתוח תדירות צריכת הקבלות האחרונות
              שלך:
            </Text>

            {/* Items */}
            {GROCERY_ITEMS.map((item, index) => (
              <View key={index} style={styles.itemRow}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.frequency}</Text>
                </View>
                <Text style={styles.itemName}>{item.name}</Text>
              </View>
            ))}

            {/* Savings Insight */}
            <View style={styles.savingsBox}>
              <Text style={styles.savingsTitle}>
                <Ionicons name="flash" size={12} color="#065F46" /> המלצת חיסכון
                בסל הקרוב:
              </Text>
              <Text style={styles.savingsText}>
                רכישת מוצרים אלו ב"סל זול" השבוע ברשת X תחסוך לך כ-18% לעומת
                רשת Y שבה קנית בפעם האחרונה.
              </Text>
            </View>
          </ScrollView>
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
    maxHeight: "80%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    paddingBottom: 14,
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
  },
  subtitle: {
    fontSize: 11,
    color: "#6B7280",
    textAlign: "right",
    marginBottom: 14,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#EFF6FF",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  itemName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1F2937",
  },
  badge: {
    backgroundColor: "#DBEAFE",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#1D4ED8",
  },
  savingsBox: {
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    borderRadius: 12,
    padding: 14,
    marginTop: 14,
  },
  savingsTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#065F46",
    textAlign: "right",
    marginBottom: 6,
  },
  savingsText: {
    fontSize: 11,
    color: "#047857",
    textAlign: "right",
    lineHeight: 18,
  },
});
