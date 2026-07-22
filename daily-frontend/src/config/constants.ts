import { Platform } from "react-native";

/**
 * API Base URL Configuration
 *
 * - Web: localhost works directly in the browser
 * - Android Emulator: 10.0.2.2 maps to host machine's localhost
 * - iOS Simulator: localhost works directly
 * - Physical device: Replace with your machine's local IP (e.g., 192.168.1.X)
 *
 * To find your local IP: run `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
 */
const getBaseUrl = (): string => {
  if (Platform.OS === "android") {
    // Android emulator maps 10.0.2.2 to host localhost
    return "http://10.0.2.2:3000";
  }
  // iOS simulator and Web use localhost directly
  return "http://localhost:3000";
};

export const API_BASE_URL = getBaseUrl();
export const API_REMINDERS_URL = `${API_BASE_URL}/api/reminders`;

// Mock user ID for MVP testing (matches the seeded user in the backend)
export const CURRENT_USER_ID = "user-demo-123";
