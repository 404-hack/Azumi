import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useNotifications } from "~/lib/notification-context";
import { useAuth } from "~/lib/auth-context";

export default function NotificationTestScreen() {
  const [loading, setLoading] = useState(false);
  const {
    expoPushToken,
    isNotificationEnabled,
    sendTestNotification,
    scheduleLocalNotification,
    setBadgeCount,
    clearBadge,
  } = useNotifications();
  const { user } = useAuth();

  const handleSendTestNotification = async () => {
    if (!user) {
      Alert.alert("Error", "Please login first");
      return;
    }

    setLoading(true);
    try {
      const success = await sendTestNotification();
      if (success) {
        Alert.alert("Success", "Test notification sent successfully!");
      } else {
        Alert.alert("Error", "Failed to send test notification");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to send test notification");
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleLocalNotification = async () => {
    setLoading(true);
    try {
      const id = await scheduleLocalNotification(
        "Local Test Notification",
        "This is a local notification scheduled for 3 seconds from now",
        { type: "local_test", timestamp: new Date().toISOString() },
        3
      );

      if (id) {
        Alert.alert("Success", "Local notification scheduled for 3 seconds!");
      } else {
        Alert.alert("Error", "Failed to schedule local notification");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to schedule local notification");
    } finally {
      setLoading(false);
    }
  };

  const handleSetBadge = async (count: number) => {
    try {
      await setBadgeCount(count);
      Alert.alert("Success", `Badge count set to ${count}`);
    } catch (error) {
      Alert.alert("Error", "Failed to set badge count");
    }
  };

  const handleClearBadge = async () => {
    try {
      await clearBadge();
      Alert.alert("Success", "Badge cleared");
    } catch (error) {
      Alert.alert("Error", "Failed to clear badge");
    }
  };

  return (
    <ScrollView className="flex-1 bg-background p-4">
      <Text className="text-2xl font-bold text-foreground mb-6">
        Notification Settings
      </Text>

      <View className="bg-card p-4 rounded-lg mb-4">
        <Text className="text-lg font-semibold text-foreground mb-2">
          Notification Status
        </Text>
        <Text className="text-muted-foreground mb-2">
          Enabled: {isNotificationEnabled ? "Yes" : "No"}
        </Text>
        <Text className="text-muted-foreground mb-2">
          User: {user ? "Logged in" : "Not logged in"}
        </Text>
        {expoPushToken && (
          <Text className="text-muted-foreground text-xs">
            Token: {expoPushToken.substring(0, 50)}...
          </Text>
        )}
      </View>

      <View className="space-y-4">
        <TouchableOpacity
          onPress={handleSendTestNotification}
          disabled={loading || !isNotificationEnabled || !user}
          className={`p-4 rounded-lg ${
            loading || !isNotificationEnabled || !user
              ? "bg-muted"
              : "bg-primary"
          }`}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-primary-foreground text-center font-medium">
              Send Push Notification Test
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleScheduleLocalNotification}
          disabled={loading}
          className={`p-4 rounded-lg ${loading ? "bg-muted" : "bg-secondary"}`}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-secondary-foreground text-center font-medium">
              Schedule Local Notification (3s)
            </Text>
          )}
        </TouchableOpacity>

        <View className="flex-row space-x-2">
          <TouchableOpacity
            onPress={() => handleSetBadge(1)}
            className="flex-1 p-4 rounded-lg bg-orange-500"
          >
            <Text className="text-white text-center font-medium">
              Set Badge (1)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleSetBadge(5)}
            className="flex-1 p-4 rounded-lg bg-orange-600"
          >
            <Text className="text-white text-center font-medium">
              Set Badge (5)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleClearBadge}
            className="flex-1 p-4 rounded-lg bg-red-500"
          >
            <Text className="text-white text-center font-medium">
              Clear Badge
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View className="mt-6 bg-card p-4 rounded-lg">
        <Text className="text-lg font-semibold text-foreground mb-2">
          How it works
        </Text>
        <Text className="text-muted-foreground text-sm leading-6">
          • Push notifications are sent from the server to your device{"\n"}•
          Local notifications are scheduled on your device{"\n"}• Badge count
          appears on the app icon{"\n"}• You must be logged in to receive push
          notifications{"\n"}• Notifications work on physical devices only
        </Text>
      </View>
    </ScrollView>
  );
}
