import { FontAwesome } from "@expo/vector-icons";
import { CheckCircle } from "lucide-react-native";
import React, { useState } from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Progress } from "~/components/ui/progress";
import { Switch } from "~/components/ui/switch";
import { Text } from "~/components/ui/text";

export default function RiderSettings() {
  const [online, setOnline] = useState(true);
  const [firstName, setFirstName] = useState("lawal");
  const [lastName, setLastName] = useState("adebola");
  const [email, setEmail] = useState("sphade010@gmail.com");
  const [address, setAddress] = useState("Lagos Road, Epe 106101, Lagos, N");
  const [vehicleType, setVehicleType] = useState("");
  const [vehicleLicense, setVehicleLicense] = useState("");
  const [maxDistance, setMaxDistance] = useState("10");

  return (
    <SafeAreaView className="flex-1 bg-background px-4 pt-6">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* Header */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-foreground mb-1">
            Rider Settings
          </Text>
          <Text className="text-base text-muted-foreground">
            Manage your account and delivery preferences
          </Text>
        </View>

        {/* Availability Status Card */}
        <Card className="mb-6">
          <CardHeader className="flex-row items-center space-y-0 pb-2">
            <FontAwesome
              name="power-off"
              size={18}
              color="hsl(var(--primary))"
            />
            <CardTitle className="ml-2">Availability Status</CardTitle>
          </CardHeader>
          <CardContent className="gap-y-5">
            <Text className="font-semibold text-lg mb-4">Go Online</Text>
            <View className="flex-row items-center mb-4">
              <Switch checked={online} onCheckedChange={setOnline} />
              <Text className="ml-2 text-primary font-semibold">
                {online ? "Online" : "Offline"}
              </Text>
            </View>
            <Text className="text-muted-foreground mb-4">
              Toggle to make yourself available for receiving delivery requests
            </Text>
            <Alert icon={CheckCircle} className="mb-0 mt-2">
              <AlertTitle>
                You are currently online and can receive delivery requests
              </AlertTitle>
              <AlertDescription>
                Your status will be automatically set to 'Available' when online
                without an active delivery
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Complete Profile Card */}
        <Card className="mb-6">
          <CardHeader className="flex-row items-center space-y-0 pb-2">
            <FontAwesome
              name="list-alt"
              size={18}
              color="hsl(var(--primary))"
            />
            <CardTitle className="ml-2">Complete Your Profile</CardTitle>
          </CardHeader>
          <CardContent className="gap-y-5">
            <CardDescription className="mb-4">
              Profile completion
            </CardDescription>
            <Progress value={100} className="mb-4" />
            <Alert icon={CheckCircle}>
              <AlertTitle>Application Approved</AlertTitle>
              <AlertDescription>
                Congratulations! Your application has been approved. You can now
                start accepting delivery requests.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Personal Information Card */}
        <Card className="mb-6">
          <CardHeader className="flex-row items-center space-y-0 pb-2">
            <FontAwesome name="user" size={18} color="hsl(var(--primary))" />
            <CardTitle className="ml-2">Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="gap-y-5">
            <View className="flex-row gap-6 mb-6">
              <View className="flex-1">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChangeText={setFirstName}
                  className="mt-2"
                />
              </View>
              <View className="flex-1">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChangeText={setLastName}
                  className="mt-2"
                />
              </View>
            </View>
            <View className="mb-6">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                value={email}
                onChangeText={setEmail}
                className="mt-2"
              />
            </View>
            <View>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={address}
                onChangeText={setAddress}
                className="mt-2"
              />
            </View>
          </CardContent>
        </Card>

        {/* Vehicle Information Card */}
        <Card className="mb-6">
          <CardHeader className="flex-row items-center space-y-0 pb-2">
            <FontAwesome name="bicycle" size={18} color="hsl(var(--primary))" />
            <CardTitle className="ml-2">Vehicle Information</CardTitle>
          </CardHeader>
          <CardContent className="gap-y-5">
            <View className="mb-6">
              <Label htmlFor="vehicleType">Vehicle Type</Label>
              <Input
                id="vehicleType"
                value={vehicleType}
                onChangeText={setVehicleType}
                placeholder="Select vehicle type"
                className="mt-2"
              />
            </View>
            <View>
              <Label htmlFor="vehicleLicense">Vehicle License</Label>
              <Input
                id="vehicleLicense"
                value={vehicleLicense}
                onChangeText={setVehicleLicense}
                placeholder="Enter vehicle license number"
                className="mt-2"
              />
            </View>
          </CardContent>
        </Card>

        {/* Delivery Preferences Card */}
        <Card className="mb-6">
          <CardHeader className="flex-row items-center space-y-0 pb-2">
            <FontAwesome
              name="map-marker"
              size={18}
              color="hsl(var(--primary))"
            />
            <CardTitle className="ml-2">Delivery Preferences</CardTitle>
          </CardHeader>
          <CardContent className="gap-y-5">
            <View>
              <Label htmlFor="maxDistance">Maximum Delivery Distance</Label>
              <Input
                id="maxDistance"
                value={maxDistance}
                onChangeText={setMaxDistance}
                keyboardType="numeric"
                className="mt-2"
              />
            </View>
          </CardContent>
        </Card>

        {/* Payment Information Card */}
        <Card className="mb-6">
          <CardHeader className="flex-row items-center space-y-0 pb-2">
            <FontAwesome
              name="credit-card"
              size={18}
              color="hsl(var(--primary))"
            />
            <CardTitle className="ml-2">Payment Information</CardTitle>
          </CardHeader>
          <CardContent className="gap-y-5">
            <CardDescription className="mb-4">
              Manage your bank accounts and payment methods for receiving
              payments from deliveries.
            </CardDescription>
            <Button variant="outline" className="mb-0">
              <Text>Manage Banking Information</Text>
            </Button>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <View className="flex-row justify-between mb-8">
          <Button variant="outline" className="flex-1 mr-2">
            <Text>Cancel</Text>
          </Button>
          <Button className="flex-1 ml-2 bg-primary">
            <Text>Save Changes</Text>
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
