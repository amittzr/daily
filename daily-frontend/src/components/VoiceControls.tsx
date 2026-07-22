import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface VoiceControlsProps {
  onMicPress: () => void;
  onCameraPress: () => void;
  onAddPress: () => void;
  isRecording: boolean;
}

export default function VoiceControls({
  onMicPress,
  onCameraPress,
  onAddPress,
  isRecording,
}: VoiceControlsProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.sideBtn} onPress={onCameraPress}>
        <Ionicons name="camera-outline" size={22} color="#4B5563" />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.micBtn, isRecording && styles.micBtnActive]}
        onPress={onMicPress}
      >
        <Ionicons
          name={isRecording ? "stop" : "mic"}
          size={30}
          color="#FFFFFF"
        />
      </TouchableOpacity>

      <TouchableOpacity style={styles.sideBtn} onPress={onAddPress}>
        <Ionicons name="add" size={22} color="#4B5563" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 32,
    paddingTop: 20,
    gap: 24,
    backgroundColor: "rgba(255,255,255,0.95)",
  },
  sideBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  micBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  micBtnActive: {
    backgroundColor: "#EF4444",
  },
});
