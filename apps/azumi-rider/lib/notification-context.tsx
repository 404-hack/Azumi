import React, { createContext, useContext, useEffect, useState } from "react";
import { notificationService, NotificationData } from "./notification";
import { useAuth } from "./auth-context";

interface NotificationContextType {
  expoPushToken: string | null;
  isNotificationEnabled: boolean;
  sendTestNotification: () => Promise<boolean>;
  scheduleLocalNotification: (
    title: string,
    body: string,
    data?: NotificationData,
    seconds?: number
  ) => Promise<string | null>;
  setBadgeCount: (count: number) => Promise<void>;
  clearBadge: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
}) => {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [isNotificationEnabled, setIsNotificationEnabled] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      initializeNotifications();
    }
  }, [user]);

  const initializeNotifications = async () => {
    try {
      const token = await notificationService.refreshToken();
      setExpoPushToken(token);

      if (token) {
        setIsNotificationEnabled(true);
        console.log("✅ Notifications initialized successfully");
      } else {
        setIsNotificationEnabled(false);
      }
    } catch (error) {
      console.error("Failed to initialize notifications:", error);
      setIsNotificationEnabled(false);
    }
  };

  const sendTestNotification = async (): Promise<boolean> => {
    try {
      return await notificationService.sendTestNotification();
    } catch (error) {
      console.error("Failed to send test notification:", error);
      return false;
    }
  };

  const scheduleLocalNotification = async (
    title: string,
    body: string,
    data?: NotificationData,
    seconds: number = 1
  ): Promise<string | null> => {
    return await notificationService.scheduleLocalNotification(
      title,
      body,
      data,
      seconds
    );
  };

  const setBadgeCount = async (count: number): Promise<void> => {
    await notificationService.setBadgeCount(count);
  };

  const clearBadge = async (): Promise<void> => {
    await notificationService.setBadgeCount(0);
  };

  const value: NotificationContextType = {
    expoPushToken,
    isNotificationEnabled,
    sendTestNotification,
    scheduleLocalNotification,
    setBadgeCount,
    clearBadge,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
