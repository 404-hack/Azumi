import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNotifications } from "~/lib/notification-context";
import { useExpoPushNotifications } from "~/hooks/useExpoPushNotifications";
import { useOrderNotifications } from "~/hooks/useOrderNotifications";
import { useAuth } from "~/lib/auth-context";
import * as Device from "expo-device";

export default function NotificationDemoScreen() {
  const [deviceInfo, setDeviceInfo] = useState<any>(null);
  const { user } = useAuth();
  const {
    expoPushToken,
    isNotificationEnabled,
    scheduleLocalNotification,
    setBadgeCount,
    clearBadge,
  } = useNotifications();

  const {
    registerToken,
    sendTestNotification,
    isRegistering,
    isSendingTest,
    canSendNotifications,
  } = useExpoPushNotifications();

  const { sendOrderNotification } = useOrderNotifications();

  useEffect(() => {
    const getDeviceInfo = async () => {
      setDeviceInfo({
        brand: Device.brand,
        modelName: Device.modelName,
        osName: Device.osName,
        osVersion: Device.osVersion,
        deviceType: Device.deviceType,
        isDevice: Device.isDevice,
      });
    };
    getDeviceInfo();
  }, []);

  const handleRegisterToken = async () => {
    try {
      const deviceId = `${Device.osName}_${Device.modelName?.replace(/\s+/g, "_")}`;
      await registerToken(deviceId);
      Alert.alert("Success", "Token registered successfully!");
    } catch {
      Alert.alert("Error", "Failed to register token");
    }
  };

  const handleSendPushTest = async () => {
    try {
      await sendTestNotification(
        "🚀 Push Notification Test",
        "This push notification was sent from your server!"
      );
      Alert.alert("Success", "Push notification sent!");
    } catch {
      Alert.alert("Error", "Failed to send push notification");
    }
  };

  const handleScheduleLocal = async () => {
    try {
      await scheduleLocalNotification(
        "📱 Local Notification",
        "This notification was scheduled locally on your device",
        { type: "local_test" },
        3
      );
      Alert.alert("Success", "Local notification scheduled for 3 seconds!");
    } catch {
      Alert.alert("Error", "Failed to schedule notification");
    }
  };

  const handleOrderNotification = async () => {
    try {
      await sendOrderNotification(
        "order_123",
        "🍕 New Order Assignment",
        "You have a new delivery order nearby!",
        "assignment"
      );
      Alert.alert("Success", "Order notification sent!");
    } catch {
      Alert.alert("Error", "Failed to send order notification");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1 p-4">
        <Text className="text-3xl font-bold text-foreground mb-6 text-center">
          🔔 Notification Demo
        </Text>

        <View className="bg-card p-4 rounded-lg mb-6">
          <Text className="text-xl font-semibold text-foreground mb-3">
            📊 Status
          </Text>
          <View className="space-y-2">
            <Text className="text-muted-foreground">
              • User: {user ? "✅ Logged in" : "❌ Not logged in"}
            </Text>
            <Text className="text-muted-foreground">
              • Notifications:{" "}
              {isNotificationEnabled ? "✅ Enabled" : "❌ Disabled"}
            </Text>
            <Text className="text-muted-foreground">
              • Device: {deviceInfo?.isDevice ? "✅ Physical" : "❌ Simulator"}
            </Text>
            <Text className="text-muted-foreground">
              • Can Send Push: {canSendNotifications ? "✅ Yes" : "❌ No"}
            </Text>
          </View>
          {expoPushToken && (
            <Text className="text-xs text-muted-foreground mt-3">
              Token: {expoPushToken.substring(0, 50)}...
            </Text>
          )}
        </View>

        {deviceInfo && (
          <View className="bg-card p-4 rounded-lg mb-6">
            <Text className="text-lg font-semibold text-foreground mb-3">
              📱 Device Info
            </Text>
            <Text className="text-muted-foreground">
              Brand: {deviceInfo.brand}
            </Text>
            <Text className="text-muted-foreground">
              Model: {deviceInfo.modelName}
            </Text>
            <Text className="text-muted-foreground">
              OS: {deviceInfo.osName} {deviceInfo.osVersion}
            </Text>
          </View>
        )}

        <View className="space-y-4 mb-6">
          <Text className="text-xl font-semibold text-foreground">
            🚀 Test Notifications
          </Text>

          <TouchableOpacity
            onPress={handleRegisterToken}
            disabled={isRegistering || !expoPushToken}
            className={`p-4 rounded-lg ${
              isRegistering || !expoPushToken ? "bg-muted" : "bg-blue-500"
            }`}
          >
            {isRegistering ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-center font-medium">
                📝 Register Push Token
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSendPushTest}
            disabled={isSendingTest || !canSendNotifications}
            className={`p-4 rounded-lg ${
              isSendingTest || !canSendNotifications
                ? "bg-muted"
                : "bg-green-500"
            }`}
          >
            {isSendingTest ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-center font-medium">
                🚀 Send Push Notification
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleScheduleLocal}
            className="p-4 rounded-lg bg-orange-500"
          >
            <Text className="text-white text-center font-medium">
              📱 Schedule Local Notification (3s)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleOrderNotification}
            className="p-4 rounded-lg bg-purple-500"
          >
            <Text className="text-white text-center font-medium">
              🍕 Test Order Notification
            </Text>
          </TouchableOpacity>
        </View>

        <View className="space-y-4 mb-6">
          <Text className="text-xl font-semibold text-foreground">
            🔢 Badge Controls
          </Text>

          <View className="flex-row space-x-2">
            <TouchableOpacity
              onPress={() => setBadgeCount(1)}
              className="flex-1 p-3 rounded-lg bg-yellow-500"
            >
              <Text className="text-white text-center">Badge: 1</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setBadgeCount(5)}
              className="flex-1 p-3 rounded-lg bg-yellow-600"
            >
              <Text className="text-white text-center">Badge: 5</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={clearBadge}
              className="flex-1 p-3 rounded-lg bg-red-500"
            >
              <Text className="text-white text-center">Clear</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="bg-card p-4 rounded-lg">
          <Text className="text-lg font-semibold text-foreground mb-3">
            ℹ️ Instructions
          </Text>
          <Text className="text-muted-foreground text-sm leading-6">
            1. Make sure you&apos;re logged in{"\n"}
            2. Register your push token first{"\n"}
            3. Test push notifications (sent from server){"\n"}
            4. Test local notifications (scheduled on device){"\n"}
            5. Try order notifications (specific to rider app){"\n"}
            6. Badge notifications appear on the app icon{"\n\n"}
            Note: Push notifications only work on physical devices, not
            simulators.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
