import React from "react";
import { useAutoNotificationSetup } from "~/hooks/useAutoNotificationSetup";

export const NotificationSetup: React.FC = () => {
  useAutoNotificationSetup();
  return null;
};
