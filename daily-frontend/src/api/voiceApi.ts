import { Platform } from "react-native";
import { API_VOICE_URL } from "../config/constants";
import { Reminder, ApiResponse } from "../types";

interface VoiceProcessResult {
  reminder: Reminder;
  transcript: string;
}

/**
 * Send recorded audio to the backend for transcription + intent parsing.
 * Returns the created reminder and the raw transcript.
 */
export async function processVoiceRecording(audioUri: string): Promise<VoiceProcessResult> {
  try {
    const formData = new FormData();

    if (Platform.OS === "web") {
      // On web, fetch the blob from the URI and append it
      const response = await fetch(audioUri);
      const blob = await response.blob();
      formData.append("audio", blob, "recording.webm");
    } else {
      // On native (iOS/Android), use the file URI directly
      const fileExtension = audioUri.split(".").pop() || "m4a";
      formData.append("audio", {
        uri: audioUri,
        type: `audio/${fileExtension === "m4a" ? "x-m4a" : fileExtension}`,
        name: `recording.${fileExtension}`,
      } as unknown as Blob);
    }

    const response = await fetch(API_VOICE_URL, {
      method: "POST",
      body: formData,
      // Note: Do NOT set Content-Type header — fetch sets it with the boundary automatically
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error || `Server error ${response.status}`);
    }

    const result: ApiResponse<Reminder> & { meta?: { transcript: string } } =
      await response.json();

    if (!result.success || !result.data) {
      throw new Error(result.error || "Unknown error");
    }

    return {
      reminder: result.data,
      transcript: result.meta?.transcript || "",
    };
  } catch (error) {
    console.error("[voiceApi] processVoiceRecording error:", error);
    throw error;
  }
}
