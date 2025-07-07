import { useEffect } from "react";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { useNotifications } from "../lib/notification-context";

export const useOrderNotifications = () => {
  const { isNotificationEnabled } = useNotifications();

  useEffect(() => {
    if (!isNotificationEnabled) return;

    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;

        console.log("Notification response received:", data);

        if (data?.orderId) {
          router.push(`/order/${data.orderId}`);
        } else if (data?.type === "order_assignment") {
          router.push("/(tabs)/orders");
        } else if (data?.type === "earnings_update") {
          router.push("/(tabs)/earnings");
        }
      }
    );

    const receivedSubscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        const data = notification.request.content.data;

        console.log("Notification received:", data);

        if (data?.type === "order_assignment") {
          console.log("New order assignment received!");
        }
      }
    );

    return () => {
      subscription.remove();
      receivedSubscription.remove();
    };
  }, [isNotificationEnabled]);

  const sendOrderNotification = async (
    orderId: string,
    title: string,
    body: string,
    type: "assignment" | "update" | "completed" = "update"
  ) => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: {
            orderId,
            type: `order_${type}`,
            timestamp: new Date().toISOString(),
          },
          sound: "default",
          badge: 1,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 1,
        },
      });
    } catch (error) {
      console.error("Failed to send order notification:", error);
    }
  };

  return {
    sendOrderNotification,
  };
};
