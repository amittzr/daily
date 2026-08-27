import { Platform } from "react-native";

/**
 * API Base URL Configuration
 *
 * Using the machine's local network IP so physical devices can reach the backend.
 * Make sure your phone is on the same Wi-Fi network as this machine.
 *
 * To find your local IP: run `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
 */
const LOCAL_IP = "10.3.0.249";

const getBaseUrl = (): string => {
  if (Platform.OS === "web") {
    return "http://localhost:3000";
  }
  // Physical devices and emulators use the machine's network IP
  return `http://${LOCAL_IP}:3000`;
};

export const API_BASE_URL = getBaseUrl();
export const API_REMINDERS_URL = `${API_BASE_URL}/api/reminders`;
export const API_VOICE_URL = `${API_BASE_URL}/api/voice/process`;

// Mock user ID for MVP testing (matches the seeded user in the backend)
export const CURRENT_USER_ID = "user-demo-123";
