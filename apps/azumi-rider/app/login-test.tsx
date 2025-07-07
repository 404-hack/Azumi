import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "~/lib/auth-context";
import { router } from "expo-router";

export default function LoginScreen() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const { signIn, isLoading, user } = useAuth();

  const handleLogin = async () => {
    if (!phoneNumber || !password) {
      Alert.alert("Error", "Please enter both phone number and password");
      return;
    }

    const result = await signIn(phoneNumber, password, true);
    if (result.success) {
      Alert.alert("Success", "Logged in successfully!");
      router.replace("/notification-demo");
    } else {
      Alert.alert("Error", result.message || "Login failed");
    }
  };

  const goToNotificationDemo = () => {
    router.push("/notification-demo");
  };

  if (user) {
    return (
      <SafeAreaView className="flex-1 bg-background p-4">
        <View className="flex-1 justify-center">
          <Text className="text-2xl font-bold text-foreground text-center mb-4">
            Welcome back!
          </Text>
          <Text className="text-muted-foreground text-center mb-8">
            You are logged in as: {user.phoneNumber}
          </Text>

          <TouchableOpacity
            onPress={goToNotificationDemo}
            className="bg-primary p-4 rounded-lg mb-4"
          >
            <Text className="text-primary-foreground text-center font-medium">
              Test Notifications
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background p-4">
      <View className="flex-1 justify-center">
        <Text className="text-3xl font-bold text-foreground text-center mb-8">
          Login to Test Notifications
        </Text>

        <View className="space-y-4">
          <View>
            <Text className="text-sm font-medium text-foreground mb-2">
              Phone Number
            </Text>
            <TextInput
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="Enter your phone number"
              keyboardType="phone-pad"
              className="border border-border rounded-lg p-3 text-foreground bg-background"
            />
          </View>

          <View>
            <Text className="text-sm font-medium text-foreground mb-2">
              Password
            </Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureTextEntry
              className="border border-border rounded-lg p-3 text-foreground bg-background"
            />
          </View>

          <TouchableOpacity
            onPress={handleLogin}
            disabled={isLoading}
            className={`p-4 rounded-lg ${
              isLoading ? "bg-muted" : "bg-primary"
            }`}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-primary-foreground text-center font-medium">
                Login
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={goToNotificationDemo}
            className="bg-secondary p-4 rounded-lg"
          >
            <Text className="text-secondary-foreground text-center font-medium">
              View Demo Without Login
            </Text>
          </TouchableOpacity>
        </View>

        <View className="mt-8 bg-card p-4 rounded-lg">
          <Text className="text-lg font-semibold text-foreground mb-2">
            Test Credentials
          </Text>
          <Text className="text-muted-foreground text-sm">
            Use any phone number and password to test the login functionality.
            The notification system will automatically register your device
            token when you log in.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
