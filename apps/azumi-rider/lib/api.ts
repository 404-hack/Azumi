import { Platform } from "react-native";

let CookieManager: typeof import("@react-native-cookies/cookies") | undefined;
if (Platform.OS !== "web") {
  CookieManager = require("@react-native-cookies/cookies");
}

// const API_BASE_URL = "http://127.0.0.1:8787/api";
const API_BASE_URL =
  Platform.OS === "web"
    ? "http://127.0.0.1:8787/api"
    : "https://wtkzkc0x-8787.uks1.devtunnels.ms/api";
export const api = {
  // Base fetch function with error handling
  // async fetch(endpoint: string, options: RequestInit = {}) {
  //   const url = `${API_BASE_URL}${endpoint}`;

  //   const response = await fetch(url, {
  //     credentials: "include",
  //     headers: {
  //       "Content-Type": "application/json",
  //       ...options.headers,
  //     },
  //     ...options,
  //   });

  //   if (!response.ok) {
  //     const errorData = await response.json().catch(() => ({}));
  //     throw new Error(
  //       errorData.message ||
  //         `API Error: ${response.status} ${response.statusText}`
  //     );
  //   }

  //   return response.json();
  // },
  async fetch(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    // For mobile: get cookies and add to headers
    if (Platform.OS !== "web") {
      try {
        const cookies = await CookieManager.get(API_BASE_URL);
        if (cookies && Object.keys(cookies).length > 0) {
          // Convert cookies object to cookie string
          const cookieString = Object.entries(cookies)
            .map(([name, cookie]) => `${name}=${cookie.value}`)
            .join("; ");
          headers.Cookie = cookieString;
        }
      } catch (error) {
        console.log("Error getting cookies:", error);
      }
    }

    const fetchOptions: RequestInit = {
      headers,
      ...options,
    };

    // Only add credentials for web
    if (Platform.OS === "web") {
      fetchOptions.credentials = "include";
    }

    const response = await fetch(url, fetchOptions);

    // For mobile: save cookies from response
    if (Platform.OS !== "web") {
      try {
        const setCookieHeader = response.headers.get("set-cookie");
        if (setCookieHeader) {
          await CookieManager.setFromResponse(API_BASE_URL, setCookieHeader);
        }
      } catch (error) {
        console.log("Error saving cookies:", error);
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message ||
          `API Error: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  },
  // Auth endpoints
  auth: {
    signInWithPhone: (
      phoneNumber: string,
      password: string,
      rememberMe?: string
    ) =>
      api.fetch("/auth/sign-in/phone-number", {
        method: "POST",
        body: JSON.stringify({ phoneNumber, password, rememberMe }),
      }),

    sendOTP: (phoneNumber: string) =>
      api.fetch("/auth/phone-number/send-otp", {
        method: "POST",
        body: JSON.stringify({ phoneNumber }),
      }),

    verifyPhone: (
      phoneNumber: string,
      code: string,
      disableSession?: string,
      updatePhoneNumber?: string
    ) =>
      api.fetch("/auth/phone-number/verify", {
        method: "POST",
        body: JSON.stringify({
          phoneNumber,
          code,
          disableSession,
          updatePhoneNumber,
        }),
      }),

    forgetPassword: (phoneNumber: string) =>
      api.fetch("/auth/phone-number/forget-password", {
        method: "POST",
        body: JSON.stringify({ phoneNumber }),
      }),

    resetPassword: (otp: string, phoneNumber: string, newPassword: string) =>
      api.fetch("/auth/phone-number/reset-password", {
        method: "POST",
        body: JSON.stringify({ otp, phoneNumber, newPassword }),
      }),
  },

  // Orders endpoints
  orders: {
    // Get all active orders assigned to the rider
    getAll: () => api.fetch("/rider/orders/actives"),
    // Get all orders (history)
    getAllHistory: () => api.fetch("/rider/orders/all"),
    // Get order by ID
    getById: (id: string) => api.fetch(`/order/${id}`),
    // Accept an order assignment
    accept: (orderId: string) =>
      api.fetch(`/rider/orders/${orderId}/accept`, { method: "POST" }),
    // Mark order as picked up
    markPickedUp: (orderId: string) =>
      api.fetch(`/rider/orders/${orderId}/pickup`, { method: "POST" }),
    // Mark order as delivered (with optional confirmation code)
    markDelivered: (orderId: string, confirmationCode?: number) =>
      api.fetch(`/rider/orders/${orderId}/deliver`, {
        method: "POST",
        body: confirmationCode
          ? JSON.stringify({ confirmationCode })
          : undefined,
      }),
    // Update order status (generic, not used for pickup/deliver)
    updateStatus: (id: string, status: string) =>
      api.fetch(`/orders/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
  },

  // Rider endpoints
  rider: {
    getProfile: () => api.fetch("/rider/profile"),
    getEarnings: (period?: string) =>
      api.fetch(`/rider/earnings${period ? `?period=${period}` : ""}`),
    updateStatus: (status: "online" | "offline") =>
      api.fetch("/rider/status", {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
  },
  notifications: {
    registerExpoPushToken: (expoPushToken: string, deviceId?: string) =>
      api.fetch("/expo-push/register-token", {
        method: "POST",
        body: JSON.stringify({ expoPushToken, deviceId }),
      }),
    sendTestNotification: (
      title: string,
      body: string,
      data?: Record<string, any>
    ) =>
      api.fetch("/expo-push/send-notification", {
        method: "POST",
        body: JSON.stringify({ title, body, data, sound: "default" }),
      }),
  },
};

export default api;
