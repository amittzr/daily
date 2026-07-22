import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface OnboardingScreenProps {
  onComplete: () => void;
}

interface ModuleItem {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bgColor: string;
  title: string;
  subtitle: string;
}

const MODULES: ModuleItem[] = [
  {
    id: "groceries",
    icon: "cart-outline",
    color: "#2563EB",
    bgColor: "#DBEAFE",
    title: "קניות לבית וסופר",
    subtitle: "רשימות אוטומטיות וסריקת קבלות",
  },
  {
    id: "insurance",
    icon: "car-sport-outline",
    color: "#7C3AED",
    bgColor: "#EDE9FE",
    title: "ביטוחים ורכב",
    subtitle: "מעקב תפוגה והשוואת מחירים",
  },
  {
    id: "finance",
    icon: "wallet-outline",
    color: "#059669",
    bgColor: "#D1FAE5",
    title: "ניהול פיננסי והוצאות",
    subtitle: "ריכוז הוצאות והצעות לייעול",
  },
  {
    id: "appointments",
    icon: "calendar-outline",
    color: "#DC2626",
    bgColor: "#FEE2E2",
    title: "תורים ולוח זמנים",
    subtitle: "רופאים, וטרינר, ספר ותזכורות",
  },
];

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [selected, setSelected] = useState<Set<string>>(
    new Set(["groceries", "insurance", "appointments"])
  );

  const toggleModule = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelected(next);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.appName}>Daily</Text>
          <Text style={styles.tagline}>
            העוזרת האישית החכמה שלך. מה ננהל היום?
          </Text>
        </View>

        <View style={styles.modules}>
          {MODULES.map((mod) => (
            <TouchableOpacity
              key={mod.id}
              style={[
                styles.moduleCard,
                selected.has(mod.id) && styles.moduleCardActive,
              ]}
              onPress={() => toggleModule(mod.id)}
            >
              <View style={styles.moduleRow}>
                <View style={[styles.iconCircle, { backgroundColor: mod.bgColor }]}>
                  <Ionicons name={mod.icon} size={22} color={mod.color} />
                </View>
                <View style={styles.moduleText}>
                  <Text style={styles.moduleTitle}>{mod.title}</Text>
                  <Text style={styles.moduleSubtitle}>{mod.subtitle}</Text>
                </View>
              </View>
              <View
                style={[
                  styles.checkbox,
                  selected.has(mod.id) && styles.checkboxActive,
                ]}
              >
                {selected.has(mod.id) && (
                  <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.ctaBtn} onPress={onComplete}>
        <Ionicons name="arrow-back" size={18} color="#FFFFFF" />
        <Text style={styles.ctaText}>בוא נתחיל</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    justifyContent: "space-between",
  },
  content: {
    padding: 24,
  },
  header: {
    alignItems: "center",
    marginTop: 40,
    marginBottom: 24,
  },
  appName: {
    fontSize: 36,
    fontWeight: "700",
    color: "#2563EB",
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
  },
  modules: {
    gap: 12,
  },
  moduleCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    backgroundColor: "#F9FAFB",
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderRadius: 14,
  },
  moduleCardActive: {
    borderColor: "#2563EB",
    backgroundColor: "#EFF6FF",
  },
  moduleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  moduleText: {
    flex: 1,
    alignItems: "flex-start",
  },
  moduleTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1F2937",
    textAlign: "right",
  },
  moduleSubtitle: {
    fontSize: 11,
    color: "#6B7280",
    textAlign: "right",
    marginTop: 2,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxActive: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2563EB",
    marginHorizontal: 24,
    marginBottom: 32,
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  ctaText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
