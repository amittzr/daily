import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface HeaderProps {
  onProfilePress: () => void;
}

export default function Header({ onProfilePress }: HeaderProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onProfilePress} style={styles.profileBtn}>
        <Ionicons name="person-outline" size={20} color="#6B7280" />
      </TouchableOpacity>

      <View style={styles.userInfo}>
        <Text style={styles.greeting}>היי עמית</Text>
        <Text style={styles.subtitle}>הכל מעודכן ליומיום שלך</Text>
      </View>

      <View style={styles.avatar}>
        <Text style={styles.avatarText}>ע</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  profileBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F9FAFB",
    alignItems: "center",
    justifyContent: "center",
  },
  userInfo: {
    flex: 1,
    alignItems: "flex-end",
    marginRight: 12,
  },
  greeting: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    textAlign: "right",
  },
  subtitle: {
    fontSize: 11,
    color: "#9CA3AF",
    textAlign: "right",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
