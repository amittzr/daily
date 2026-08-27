import React, { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { Audio } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import { processVoiceRecording } from "../api/voiceApi";
import { scheduleReminderNotifications } from "../services/notificationService";

interface VoiceControlsProps {
  onCameraPress: () => void;
  onAddPress: () => void;
  onReminderCreated: () => void;
}

export default function VoiceControls({
  onCameraPress,
  onAddPress,
  onReminderCreated,
}: VoiceControlsProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState<string | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);

  // Request microphone permissions on mount
  useEffect(() => {
    (async () => {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== "granted") {
        console.warn("[VoiceControls] Microphone permission not granted");
      }
      // Configure audio mode for recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
    })();
  }, []);

  const startRecording = async () => {
    try {
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();
      recordingRef.current = recording;
      setIsRecording(true);
      setStatusText("מקשיבה...");
    } catch (error) {
      console.error("[VoiceControls] Failed to start recording:", error);
      setStatusText("שגיאה בהקלטה");
      setTimeout(() => setStatusText(null), 2000);
    }
  };

  const stopAndProcess = async () => {
    if (!recordingRef.current) return;

    try {
      setIsRecording(false);
      setIsProcessing(true);
      setStatusText("מעבד...");

      // Stop the recording
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      if (!uri) {
        throw new Error("No recording URI");
      }

      // Send to backend for transcription + parsing
      const result = await processVoiceRecording(uri);

      // Schedule local notification for the new reminder
      await scheduleReminderNotifications(result.reminder);

      setStatusText(`✓ ${result.reminder.title}`);
      setTimeout(() => setStatusText(null), 3000);

      // Notify parent to refresh reminders
      onReminderCreated();
    } catch (error) {
      console.error("[VoiceControls] Processing failed:", error);
      setStatusText("שגיאה בעיבוד");
      setTimeout(() => setStatusText(null), 3000);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMicPress = () => {
    if (isProcessing) return; // Ignore taps while processing
    if (isRecording) {
      stopAndProcess();
    } else {
      startRecording();
    }
  };

  return (
    <View style={styles.wrapper}>
      {/* Status bar above controls */}
      {statusText && (
        <View style={styles.statusBar}>
          {isProcessing && <ActivityIndicator size="small" color="#FFFFFF" />}
          {isRecording && (
            <View style={styles.recordingDot} />
          )}
          <Text style={styles.statusText}>{statusText}</Text>
        </View>
      )}

      <View style={styles.container}>
        <TouchableOpacity style={styles.sideBtn} onPress={onCameraPress}>
          <Ionicons name="camera-outline" size={22} color="#4B5563" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.micBtn,
            isRecording && styles.micBtnRecording,
            isProcessing && styles.micBtnProcessing,
          ]}
          onPress={handleMicPress}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator size="large" color="#FFFFFF" />
          ) : (
            <Ionicons
              name={isRecording ? "stop" : "mic"}
              size={30}
              color="#FFFFFF"
            />
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.sideBtn} onPress={onAddPress}>
          <Ionicons name="add" size={22} color="#4B5563" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  statusBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1F2937",
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    gap: 8,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
  },
  statusText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  container: {
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
  micBtnRecording: {
    backgroundColor: "#EF4444",
  },
  micBtnProcessing: {
    backgroundColor: "#6B7280",
  },
});
