import { useLocalSearchParams } from "expo-router";
import {
  CheckCircle,
  Clock,
  DollarSign,
  MapPin,
  Package,
  Phone,
  Store,
  User,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  TextInput,
  View,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Text } from "~/components/ui/text";
import { client } from "~/lib/hono-client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function OrderDetails() {
  const { orderDetails } = useLocalSearchParams();
  const queryClient = useQueryClient();
  const [showDeliveryDialog, setShowDeliveryDialog] = useState(false);
  const [confirmationCode, setConfirmationCode] = useState("");

  const {
    data: order,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["order", orderDetails],
    queryFn: async () => {
      const response = await client.rider.orders[":id"].$get({
        param: { id: orderDetails as string },
      });
      if (!response.ok) throw new Error("Order not found");
      const data = await response.json();
      return data.data || data.order || data;
    },
    enabled: !!orderDetails,
  });

  const markAsPickedUpMutation = useMutation({
    mutationFn: async () => {
      const response = await client.rider.orders[":id"].pickup.$post({
        param: { id: order.id },
      });
      if (!response.ok) throw new Error("Failed to mark as picked up");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order", orderDetails] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      refetch();
    },
  });

  const markAsDeliveredMutation = useMutation({
    mutationFn: async () => {
      const response = await client.rider.orders[":id"].deliver.$post({
        param: { id: order.id },
        json: { confirmationCode: parseInt(confirmationCode) },
      });
      if (!response.ok) throw new Error("Failed to mark as delivered");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order", orderDetails] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      setShowDeliveryDialog(false);
      setConfirmationCode("");
      refetch();
    },
  });

  function getStatusAction() {
    if (!order) return null;
    switch (order.status) {
      case "RIDER_ASSIGNED":
        return {
          label: "Mark as Picked Up",
          action: () => markAsPickedUpMutation.mutate(),
          icon: Package,
          loading: markAsPickedUpMutation.isPending,
        };
      case "IN_TRANSIT":
        return {
          label: "Mark as Delivered",
          action: () => setShowDeliveryDialog(true),
          icon: CheckCircle,
          loading: markAsDeliveredMutation.isPending,
        };
      default:
        return null;
    }
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator size="large" color="#2563eb" />
        <Text className="mt-4 text-muted-foreground">
          Loading order details...
        </Text>
      </SafeAreaView>
    );
  }
  if (isError || !order) {
    return (
      <SafeAreaView className="flex-1 bg-background justify-center items-center">
        <Text className="text-red-600 font-bold mb-2">
          {error?.message || "Order not found"}
        </Text>
        <Text className="text-muted-foreground">Please try again later.</Text>
      </SafeAreaView>
    );
  }

  const statusAction = getStatusAction();

  return (
    <SafeAreaView className="flex-1 bg-background px-4 pt-6">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <View className="mb-6">
          <Text className="text-2xl font-bold text-foreground mb-1">
            Order Details
          </Text>
          <Text className="text-base text-muted-foreground">
            Order #{order.id}
          </Text>
        </View>
        {/* Order Status */}
        <Card className="mb-6">
          <CardHeader className="flex-row justify-between items-center pb-2">
            <View className="flex-row items-center gap-2">
              <CheckCircle size={20} color="#2563eb" />
              <CardTitle>Order Status</CardTitle>
            </View>
            <Text className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs">
              {order.status}
            </Text>
          </CardHeader>
          <CardContent>
            <Text className="font-bold text-lg mb-1">Total Amount</Text>
            <Text className="font-bold text-2xl mb-2">
              ₦{order.total?.toLocaleString?.() ?? "-"}
            </Text>
            <Text className="font-bold text-lg mb-1">Delivery Fee</Text>
            <Text className="font-bold text-green-600 text-2xl">
              ₦{order.deliveryFee?.toLocaleString?.() ?? "-"}
            </Text>
          </CardContent>
        </Card>
        {/* Next Action Section */}
        {statusAction && (
          <Card className="mb-6">
            <CardHeader className="flex-row items-center gap-2 pb-2">
              <statusAction.icon size={20} color="#2563eb" />
              <CardTitle>Next Action</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                className="flex-row items-center justify-center gap-2"
                onPress={statusAction.action}
                disabled={statusAction.loading}
              >
                <statusAction.icon size={18} />
                <Text>
                  {statusAction.loading
                    ? statusAction.label === "Mark as Delivered"
                      ? "Confirming..."
                      : "Updating..."
                    : statusAction.label}
                </Text>
              </Button>
            </CardContent>
          </Card>
        )}
        {/* Order Summary */}
        <Card className="mb-6">
          <CardHeader className="flex-row items-center gap-2">
            <DollarSign size={20} color="#22c55e" />
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <View className="flex-row justify-between mb-2">
              <Text>Total</Text>
              <Text>₦{order.total?.toLocaleString?.() ?? "-"}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text>Delivery Fee</Text>
              <Text>₦{order.deliveryFee?.toLocaleString?.() ?? "-"}</Text>
            </View>
          </CardContent>
        </Card>
        {/* Order Items */}
        <Card className="mb-6">
          <CardHeader className="flex-row items-center gap-2">
            <Package size={20} color="#2563eb" />
            <CardTitle>Order Items</CardTitle>
          </CardHeader>
          <CardContent>
            {order.items?.map?.((item: any, idx: number) => (
              <View key={idx} className="mb-6 flex-row gap-4">
                <View className="w-12 h-12 bg-orange-100 rounded-lg items-center justify-center">
                  <Store size={28} color="#f59e42" />
                </View>
                <View className="flex-1">
                  <Text className="font-bold">
                    {item.name || item.menuItem?.name}
                  </Text>
                  <Text className="text-xs text-muted-foreground mb-1">
                    {item.desc || item.menuItem?.description}
                  </Text>
                  <Text className="text-xs mb-1">
                    Qty: {item.qty ?? item.quantity}{" "}
                    <Text className="font-bold">
                      ₦{item.price ?? item.totalPrice}
                    </Text>
                  </Text>
                  {item.options?.length > 0 && (
                    <View className="ml-2 mt-1">
                      <Text className="text-xs font-semibold mb-1">
                        Options:
                      </Text>
                      {item.options.map((opt: any, oidx: number) => (
                        <View
                          key={oidx}
                          className="flex-row justify-between mb-1"
                        >
                          <Text className="text-xs text-muted-foreground">
                            {opt.label || opt.option?.name}
                          </Text>
                          <Text className="text-xs font-bold">
                            {opt.price > 0 ? `₦${opt.price}` : "+₦0"}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            ))}
          </CardContent>
        </Card>
        {/* Order Information */}
        <Card className="mb-6">
          <CardHeader className="flex-row items-center gap-2">
            <Clock size={20} color="#2563eb" />
            <CardTitle>Order Information</CardTitle>
          </CardHeader>
          <CardContent>
            <View className="mb-2 flex-row items-center gap-2">
              <View className="w-3 h-3 rounded-full bg-blue-400" />
              <Text>Order Created</Text>
              <Text className="text-xs text-muted-foreground ml-2">
                {order.createdAt}
              </Text>
            </View>
            <View className="flex-row items-center gap-2">
              <View className="w-3 h-3 rounded-full bg-green-500" />
              <Text>Current Status</Text>
              <Text className="text-xs text-muted-foreground ml-2">
                {order.status}
              </Text>
            </View>
          </CardContent>
        </Card>
        {/* Pickup Location */}
        <Card className="mb-6">
          <CardHeader className="flex-row items-center gap-2">
            <Store size={20} color="#f59e42" />
            <CardTitle>Pickup Location</CardTitle>
          </CardHeader>
          <CardContent>
            <Text className="font-bold mb-1">{order.shop?.name}</Text>
            <View className="flex-row items-center gap-2 mb-3">
              <MapPin size={14} color="#a3a3a3" />
              <Text className="text-xs text-muted-foreground">
                {order.shop?.address}
              </Text>
            </View>
            <View className="flex-row gap-2">
              <Button
                variant="outline"
                className="flex-1 flex-row items-center justify-center gap-2"
                onPress={() =>
                  order.shop?.phoneNumber &&
                  Linking.openURL(`tel:${order.shop.phoneNumber}`)
                }
              >
                <Phone size={16} />
                <Text>Call</Text>
              </Button>
              <Button
                variant="outline"
                className="flex-1 flex-row items-center justify-center gap-2"
                onPress={() =>
                  order.shop?.address &&
                  Linking.openURL(
                    `https://maps.google.com?daddr=${encodeURIComponent(
                      order.shop.address
                    )}`
                  )
                }
              >
                <MapPin size={16} />
                <Text>Maps</Text>
              </Button>
            </View>
          </CardContent>
        </Card>
        {/* Delivery Location */}
        <Card className="mb-6">
          <CardHeader className="flex-row items-center gap-2">
            <User size={20} color="#2563eb" />
            <CardTitle>Delivery Location</CardTitle>
          </CardHeader>
          <CardContent>
            <Text className="font-bold mb-1">{order.customer?.name}</Text>
            <View className="flex-row items-center gap-2 mb-3">
              <MapPin size={14} color="#a3a3a3" />
              <Text className="text-xs text-muted-foreground">
                {order?.addressName}
              </Text>
            </View>
            <View className="flex-row gap-2">
              <Button
                variant="outline"
                className="flex-1 flex-row items-center justify-center gap-2"
                onPress={() =>
                  order.customer?.phoneNumber &&
                  Linking.openURL(`tel:${order.customer.phoneNumber}`)
                }
              >
                <Phone size={16} />
                <Text>Call</Text>
              </Button>
              <Button
                variant="outline"
                className="flex-1 flex-row items-center justify-center gap-2"
                onPress={() =>
                  order?.addressName &&
                  Linking.openURL(
                    `https://maps.google.com?daddr=${encodeURIComponent(
                      order?.addressName
                    )}`
                  )
                }
              >
                <MapPin size={16} />
                <Text>Maps</Text>
              </Button>
            </View>
          </CardContent>
        </Card>
        {/* Order Info */}
        <Card className="mb-6">
          <CardHeader className="flex-row items-center gap-2">
            <Clock size={20} color="#2563eb" />
            <CardTitle>Order Info</CardTitle>
          </CardHeader>
          <CardContent>
            <View className="flex-row justify-between mb-2">
              <Text>Order ID:</Text>
              <Text>{order.id}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text>Created:</Text>
              <Text>{order.createdAt}</Text>
            </View>
          </CardContent>
        </Card>
        {/* Payment */}
        <Card>
          <CardHeader className="flex-row items-center gap-2">
            <DollarSign size={20} color="#22c55e" />
            <CardTitle>Payment</CardTitle>
          </CardHeader>
          <CardContent>
            <View className="flex-row justify-between mb-2">
              <Text>Order Value</Text>
              <Text>₦{order.total?.toLocaleString?.() ?? "-"}</Text>
            </View>
            <View className="flex-row justify-between mb-2">
              <Text>Delivery Fee</Text>
              <Text className="text-green-600">
                ₦{order.deliveryFee?.toLocaleString?.() ?? "-"}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="font-bold">Total Amount:</Text>
              <Text className="font-bold">
                ₦{order.total?.toLocaleString?.() ?? "-"}
              </Text>
            </View>
          </CardContent>
        </Card>
      </ScrollView>
      {/* Delivery Confirmation Dialog */}
      <Modal
        visible={showDeliveryDialog}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeliveryDialog(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center px-4">
          <View className="w-full max-w-md rounded-lg bg-white p-6">
            <Text className="mb-4 text-lg font-bold text-foreground">
              Confirm Delivery
            </Text>
            <Text className="mb-4 text-sm text-muted-foreground">
              Enter the confirmation code provided by the customer to complete
              the delivery.
            </Text>
            <TextInput
              value={confirmationCode}
              onChangeText={setConfirmationCode}
              placeholder="Enter 4-digit code"
              keyboardType="number-pad"
              maxLength={4}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-center font-mono text-lg mb-4"
              autoFocus
            />
            <View className="flex-row gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onPress={() => {
                  setShowDeliveryDialog(false);
                  setConfirmationCode("");
                }}
                disabled={markAsDeliveredMutation.isPending}
              >
                <Text>Cancel</Text>
              </Button>
              <Button
                className="flex-1"
                onPress={markAsDeliveredMutation.mutate}
                disabled={
                  markAsDeliveredMutation.isPending || !confirmationCode
                }
              >
                <Text>
                  {markAsDeliveredMutation.isPending
                    ? "Confirming..."
                    : "Confirm Delivery"}
                </Text>
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
