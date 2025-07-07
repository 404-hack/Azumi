import { useMutation } from "@tanstack/react-query";
import { client } from "../lib/hono-client";
import { useNotifications } from "../lib/notification-context";
import { useAuth } from "../lib/auth-context";

export const useExpoPushNotifications = () => {
  const { expoPushToken } = useNotifications();
  const { user } = useAuth();

  const registerTokenMutation = useMutation({
    mutationFn: async (data: { expoPushToken: string; deviceId?: string }) => {
      const response = await client["expo-push"]["register-token"].$post({
        json: data,
      });

      if (!response.ok) {
        throw new Error("Failed to register token");
      }

      return response.json();
    },
    onSuccess: () => {
      console.log("✅ Expo push token registered successfully");
    },
    onError: (error) => {
      console.error("❌ Failed to register Expo push token:", error);
    },
  });

  const sendTestNotificationMutation = useMutation({
    mutationFn: async (data: {
      title: string;
      body: string;
      data?: Record<string, any>;
      sound?: string;
      badge?: number;
    }) => {
      const response = await client["expo-push"]["send-notification"].$post({
        json: data,
      });

      if (!response.ok) {
        throw new Error("Failed to send notification");
      }

      return response.json();
    },
    onSuccess: () => {
      console.log("✅ Test notification sent successfully");
    },
    onError: (error) => {
      console.error("❌ Failed to send test notification:", error);
    },
  });

  const registerToken = async (deviceId?: string) => {
    if (!expoPushToken) {
      throw new Error("No Expo push token available");
    }

    return registerTokenMutation.mutateAsync({
      expoPushToken,
      deviceId,
    });
  };

  const sendTestNotification = async (
    title = "Test Notification",
    body = "This is a test notification!",
    data?: Record<string, any>
  ) => {
    return sendTestNotificationMutation.mutateAsync({
      title,
      body,
      data: {
        type: "test",
        timestamp: new Date().toISOString(),
        ...data,
      },
      sound: "default",
      badge: 1,
    });
  };

  return {
    registerToken,
    sendTestNotification,
    isRegistering: registerTokenMutation.isPending,
    isSendingTest: sendTestNotificationMutation.isPending,
    registerError: registerTokenMutation.error,
    sendError: sendTestNotificationMutation.error,
    canSendNotifications: !!user && !!expoPushToken,
  };
};
