import { useMutation } from "@tanstack/react-query";
import { Link } from "expo-router";
import React, { useState } from "react";
import { Alert, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Text } from "~/components/ui/text";
import api from "~/lib/api";

export default function Login() {
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const sendOtp = useMutation({
    mutationFn: (phone: string) => api.auth.sendOTP(phone),
  });
  const validateOtp = useMutation({
    mutationFn: (otp: string) => api.auth.verifyPhone(phone, otp),
  });
  const handleSendOtp = async () => {
    setError("love");
    if (!/^\d{10,15}$/.test(phone)) {
      setError("Please enter a valid phone number");
      return;
    }
    sendOtp.mutate(phone, {
      onSuccess: (data) => {
        console.log("OTP sent successfully:", data);
        Alert.alert("OTP sent successfully", data.message);
        setStep("otp");
      },
      onError: (error) => {
        Alert.alert("Error", error.message);
      },
    });
  };

  const handleValidateOtp = () => {
    setError("");
    if (!/^\d{4,8}$/.test(otp)) {
      setError("Please enter a valid OTP");
      return;
    }
    validateOtp.mutate(otp, {
      onSuccess: (data) => {
        console.log("OTP validated successfully:", data);
        Alert.alert("OTP validated successfully", data.message);
      },
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-background px-4 justify-center">
      <View className="max-w-md w-full mx-auto">
        <Link href="/">
          <Text>Back</Text>
        </Link>
        <Card>
          <CardHeader className="items-center">
            <CardTitle>Login</CardTitle>
          </CardHeader>
          <CardContent className="gap-y-6">
            {step === "phone" && (
              <>
                <View className="mb-6">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    placeholder="Enter your phone number"
                    className="mt-2"
                  />
                </View>
                {error ? (
                  <Text className="text-destructive mb-2">{error}</Text>
                ) : null}
                <Button
                  onPress={handleSendOtp}
                  disabled={sendOtp.isPending}
                  className="w-full"
                >
                  {JSON.stringify(sendOtp.data)}
                  <Text>
                    {sendOtp.isPending ? "Sending OTP..." : "Send OTP"}
                  </Text>
                </Button>
              </>
            )}
            {step === "otp" && (
              <>
                <View className="mb-6">
                  <Label htmlFor="otp">Enter OTP</Label>
                  <Input
                    id="otp"
                    value={otp}
                    onChangeText={setOtp}
                    keyboardType="number-pad"
                    placeholder="Enter the OTP sent to your phone"
                    className="mt-2"
                  />
                </View>
                {error ? (
                  <Text className="text-destructive mb-2">{error}</Text>
                ) : null}
                <Button
                  onPress={handleValidateOtp}
                  disabled={validateOtp.isPending}
                  className="w-full"
                >
                  <Text>
                    {validateOtp.isPending ? "Validating..." : "Validate OTP"}
                  </Text>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full mt-2"
                  onPress={() => setStep("phone")}
                >
                  <Text>Change phone number</Text>
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </View>
    </SafeAreaView>
  );
}
