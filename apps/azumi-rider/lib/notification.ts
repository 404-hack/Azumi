import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { api } from "./api";

export interface NotificationData {
  orderId?: string;
  type?: string;
  action?: string;
  [key: string]: any;
}

export interface PushNotification {
  title: string;
  body: string;
  data?: NotificationData;
  sound?: string;
  badge?: number;
}

class NotificationService {
  private expoPushToken: string | null = null;

  constructor() {
    this.initializeNotifications();
  }

  private async initializeNotifications() {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      }),
    });

    if (Device.isDevice) {
      await this.requestPermissions();
      await this.getExpoPushToken();
      this.setupNotificationListeners();
    } else {
      console.log("Must use physical device for Push Notifications");
    }
  }

  private async requestPermissions(): Promise<boolean> {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("Failed to get push token for push notification!");
      return false;
    }

    return true;
  }

  private async getExpoPushToken(): Promise<string | null> {
    try {
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ??
        Constants?.easConfig?.projectId;

      if (!projectId) {
        console.log("Project ID not found");
        return null;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      console.log("Expo Push Token:", token.data);
      this.expoPushToken = token.data;

      await this.registerTokenWithServer(token.data);
      return token.data;
    } catch (error) {
      console.error("Error getting expo push token:", error);
      return null;
    }
  }

  private async registerTokenWithServer(token: string): Promise<boolean> {
    try {
      const deviceId =
        Device.osName + "_" + Device.modelName?.replace(/\s+/g, "_");

      const response = await api.fetch("/expo-push/register-token", {
        method: "POST",
        body: JSON.stringify({
          expoPushToken: token,
          deviceId: deviceId,
        }),
      });

      console.log("Token registered successfully:", response);
      return true;
    } catch (error) {
      console.error("Failed to register token with server:", error);
      return false;
    }
  }

  private setupNotificationListeners() {
    Notifications.addNotificationReceivedListener(
      this.handleNotificationReceived
    );
    Notifications.addNotificationResponseReceivedListener(
      this.handleNotificationResponse
    );

    if (Platform.OS === "android") {
      Notifications.setNotificationChannelAsync("orders", {
        name: "Order Notifications",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
        sound: "default",
      });

      Notifications.setNotificationChannelAsync("general", {
        name: "General Notifications",
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
        sound: "default",
      });
    }
  }

  private handleNotificationReceived = (
    notification: Notifications.Notification
  ) => {
    console.log("Notification received:", notification);

    const data = notification.request.content.data as NotificationData;

    if (data?.type === "order_assignment" || data?.type === "order_update") {
      console.log("Order notification received:", data);
    }
  };

  private handleNotificationResponse = (
    response: Notifications.NotificationResponse
  ) => {
    console.log("Notification response:", response);

    const data = response.notification.request.content.data as NotificationData;

    if (data?.orderId) {
      console.log("Navigate to order:", data.orderId);
    }
  };

  async sendTestNotification(): Promise<boolean> {
    try {
      const response = await api.fetch("/expo-push/send-notification", {
        method: "POST",
        body: JSON.stringify({
          title: "Test Notification",
          body: "This is a test notification from your Expo app!",
          data: {
            type: "test",
            timestamp: new Date().toISOString(),
          },
          sound: "default",
        }),
      });

      console.log("Test notification sent:", response);
      return true;
    } catch (error) {
      console.error("Failed to send test notification:", error);
      return false;
    }
  }

  async scheduleLocalNotification(
    title: string,
    body: string,
    data?: NotificationData,
    seconds: number = 1
  ): Promise<string | null> {
    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: data || {},
          sound: "default",
        },
        trigger: { seconds },
      });

      console.log("Local notification scheduled:", id);
      return id;
    } catch (error) {
      console.error("Failed to schedule local notification:", error);
      return null;
    }
  }

  async cancelAllScheduledNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log("All scheduled notifications cancelled");
    } catch (error) {
      console.error("Failed to cancel notifications:", error);
    }
  }

  async setBadgeCount(count: number): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error("Failed to set badge count:", error);
    }
  }

  getExpoPushToken(): string | null {
    return this.expoPushToken;
  }

  async refreshToken(): Promise<string | null> {
    return await this.getExpoPushToken();
  }
}

export const notificationService = new NotificationService();
export default notificationService;
