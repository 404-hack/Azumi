import { useEffect } from "react";
import { useAuth } from "../lib/auth-context";
import { useNotifications } from "../lib/notification-context";
import { useExpoPushNotifications } from "./useExpoPushNotifications";
import * as Device from "expo-device";

export const useAutoNotificationSetup = () => {
  const { user } = useAuth();
  const { expoPushToken, isNotificationEnabled } = useNotifications();
  const { registerToken } = useExpoPushNotifications();

  useEffect(() => {
    const setupNotifications = async () => {
      if (user && expoPushToken && isNotificationEnabled && Device.isDevice) {
        try {
          const deviceId = `${Device.osName}_${Device.modelName?.replace(/\s+/g, "_")}`;
          await registerToken(deviceId);
          console.log("✅ Auto-registered push token for user:", user.id);
        } catch (error) {
          console.error("❌ Failed to auto-register push token:", error);
        }
      }
    };

    setupNotifications();
  }, [user, expoPushToken, isNotificationEnabled, registerToken]);
};
