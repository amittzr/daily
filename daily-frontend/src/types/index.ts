export interface Reminder {
  id: string;
  userId: string;
  title: string;
  description?: string;
  scheduledTime: string;
  phoneNumber?: string;
  websiteUrl?: string;
  status: string;
  isProactive?: boolean;
  createdAt?: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  createdAt?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
