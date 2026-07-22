import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface ProactiveCardProps {
  title: string;
  description: string;
  actionLabel: string;
  onPress: () => void;
}

export default function ProactiveCard({
  title,
  description,
  actionLabel,
  onPress,
}: ProactiveCardProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
        <Text style={styles.action}>{actionLabel}</Text>
      </View>
      <View style={styles.iconWrap}>
        <Ionicons name="alert-circle" size={22} color="#EF4444" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#FEF2F2",
    borderRightWidth: 4,
    borderRightColor: "#EF4444",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  content: {
    flex: 1,
    alignItems: "flex-end",
  },
  iconWrap: {
    marginLeft: 10,
    marginTop: 2,
  },
  title: {
    fontSize: 13,
    fontWeight: "700",
    color: "#7F1D1D",
    textAlign: "right",
    marginBottom: 4,
  },
  description: {
    fontSize: 11,
    color: "#991B1B",
    textAlign: "right",
    marginBottom: 6,
  },
  action: {
    fontSize: 11,
    fontWeight: "700",
    color: "#7F1D1D",
    textDecorationLine: "underline",
    textAlign: "right",
  },
});
