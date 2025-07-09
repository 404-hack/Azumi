import { Phone, MapPin, Eye, CheckCircle2, Clock } from "lucide-react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Modal,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { client } from "~/lib/hono-client";

export default function RiderDashboard() {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [confirmationCode, setConfirmationCode] = useState("");
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);
  const [orderToDeliver, setOrderToDeliver] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: ordersData } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const response = await client.rider.orders.actives.$get();
      if (!response.ok) {
        throw new Error("Failed to fetch orders");
      }
      return response.json();
    },
  });

  const orders = ordersData?.data || [];

  const activeOrders = orders?.filter(
    (order: any) =>
      order.status === "RIDER_ASSIGNED" || order.status === "IN_TRANSIT"
  );

  useEffect(() => {
    if (activeOrders.length > 0 && !selectedOrderId) {
      setSelectedOrderId(activeOrders[0].id);
    }
  }, [activeOrders, selectedOrderId]);

  const markAsPickedUpMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const response = await client.rider.orders[":id"].pickup.$post({
        param: { id: orderId },
      });
      if (!response.ok) {
        throw new Error("Failed to mark as picked up");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });

  const markAsDeliveredMutation = useMutation({
    mutationFn: async ({
      orderId,
      confirmationCode,
    }: {
      orderId: string;
      confirmationCode?: number;
    }) => {
      const response = await client.rider.orders[":id"].deliver.$post({
        param: { id: orderId },
        json: confirmationCode ? { confirmationCode } : {},
      });
      if (!response.ok) {
        throw new Error("Failed to mark as delivered");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });

  const markAsPickedUp = async (orderId: string) => {
    markAsPickedUpMutation.mutate(orderId);
  };

  const handleMarkAsDelivered = (orderId: string) => {
    setOrderToDeliver(orderId);
    setShowConfirmationDialog(true);
  };

  const confirmDelivery = async () => {
    if (!orderToDeliver) return;
    markAsDeliveredMutation.mutate({
      orderId: orderToDeliver,
      confirmationCode: confirmationCode
        ? parseInt(confirmationCode)
        : undefined,
    });
    setShowConfirmationDialog(false);
    setConfirmationCode("");
    setOrderToDeliver(null);
  };

  // Helpers
  const getStatusColor = (status: string) => {
    switch (status) {
      case "RIDER_ASSIGNED":
        return "#3B82F6"; // blue-500
      case "IN_TRANSIT":
        return "#F59E42"; // orange-500
      case "DELIVERED":
        return "#22C55E"; // green-500
      default:
        return "#6B7280"; // gray-500
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "RIDER_ASSIGNED":
        return "Assigned";
      case "IN_TRANSIT":
        return "In Transit";
      case "DELIVERED":
        return "Delivered";
      default:
        return status;
    }
  };

  // UI
  return (
    <ScrollView className="flex-1 bg-background px-4 py-2">
      {/* Header */}
      <View className="bg-primary rounded-2xl p-6 mb-4 shadow-sm shadow-primary/10">
        <View className="flex-row justify-between items-center">
          <View>
            <Link
              href="/login"
              className="text-xs text-secondary underline mb-1"
            >
              go to a new page
            </Link>

            <Text className="text-2xl font-bold text-primary-foreground">
              Rider Dashboard
            </Text>
            <Text className="text-sm text-primary-foreground/70">
              {/* Welcome, {profile?.firstName || "Rider"} */}
            </Text>
          </View>
        </View>
      </View>

      {/* Active Orders */}
      {activeOrders.length > 0 ? (
        <View>
          <View className="bg-card rounded-2xl p-4 mb-4">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-lg font-bold text-foreground">
                Active Orders
              </Text>
              <Text className="bg-accent text-accent-foreground rounded-full px-3 py-1 text-xs font-semibold">
                {activeOrders.length} orders
              </Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="flex-row mb-2"
            >
              {activeOrders.map((order) => (
                <View
                  key={order.id}
                  className={`mr-2 ${
                    selectedOrderId === order.id ? "bg-primary" : "bg-muted"
                  } px-3 py-2 rounded-lg`}
                >
                  <Text
                    className={`font-bold ${
                      selectedOrderId === order.id
                        ? "text-primary-foreground"
                        : "text-muted-foreground"
                    }`}
                    onPress={() => setSelectedOrderId(order.id)}
                  >
                    {order.code || `Order ${order.id.slice(-6)}`}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Order Details */}
          {activeOrders.map((order) =>
            selectedOrderId === order.id ? (
              <View
                key={order.id}
                className="border-2 border-accent bg-accent/40 rounded-2xl p-6 mb-4"
              >
                {/* Order Header */}
                <View className="items-center mb-4">
                  <View className="flex-row items-center space-x-2">
                    <Text className="text-xl font-bold text-primary">
                      {order.code || `Order ${order.id.slice(-6)}`}
                    </Text>
                    <Text className="bg-primary text-primary-foreground rounded px-2 py-1 text-xs font-semibold">
                      {getStatusText(order.status)}
                    </Text>
                  </View>
                  <Text className="text-primary mt-1 text-base font-semibold">
                    {order.total && `₦${order.total.toLocaleString()}`}
                  </Text>
                </View>
                {/* Pickup Info */}
                <View className="bg-card rounded-xl p-4 mb-3">
                  <Text className="font-bold text-foreground">
                    Pickup from {order.shop?.name}
                  </Text>
                  <Text className="text-muted-foreground">
                    {order.shop?.address}
                  </Text>
                  <Text className="text-xs text-muted-foreground mt-1">
                    Distance to be calculated
                  </Text>
                  <View className="flex-row space-x-2 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onPress={() =>
                        Linking.openURL(`tel:${order.shop?.phoneNumber}`)
                      }
                    >
                      <View className="flex-row items-center space-x-1">
                        <Phone />
                        <Text>Call Store</Text>
                      </View>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onPress={() =>
                        Linking.openURL(
                          `https://maps.google.com?daddr=${encodeURIComponent(
                            order.shop?.address || ""
                          )}`
                        )
                      }
                    >
                      <View className="flex-row items-center space-x-1">
                        <MapPin />
                        <Text>Navigate</Text>
                      </View>
                    </Button>
                  </View>
                </View>
                {/* Delivery Info */}
                <View className="bg-card rounded-xl p-4 mb-3">
                  <Text className="font-bold text-foreground">
                    Deliver to {order.customer?.name || "Customer"}
                  </Text>
                  <Text className="text-muted-foreground">
                    {order.addressName ||
                      `${order.latitude}, ${order.longitude}`}
                  </Text>
                  <View className="flex-row space-x-2 mt-2">
                    {order.customer?.phoneNumber && (
                      <Button
                        variant="outline"
                        size="sm"
                        onPress={() =>
                          Linking.openURL(`tel:${order.customer?.phoneNumber}`)
                        }
                      >
                        <View className="flex-row items-center space-x-1">
                          <Phone />
                          <Text>Call Customer</Text>
                        </View>
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onPress={() =>
                        Linking.openURL(
                          `https://maps.google.com?daddr=${order.latitude},${order.longitude}`
                        )
                      }
                    >
                      <View className="flex-row items-center space-x-1">
                        <MapPin />
                        <Text>Navigate</Text>
                      </View>
                    </Button>
                  </View>
                </View>
                {/* Actions */}
                <View className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full border-accent"
                    onPress={() => router.push(`/${order.id}`)}
                  >
                    <View className="flex-row items-center space-x-1">
                      <Eye />
                      <Text>View Details</Text>
                    </View>
                  </Button>
                  {order.status === "RIDER_ASSIGNED" ? (
                    <Button
                      onPress={() => markAsPickedUp(order.id)}
                      className="w-full bg-primary"
                      disabled={markAsPickedUpMutation.isPending}
                    >
                      <View className="flex-row items-center space-x-1">
                        <CheckCircle2 />
                        <Text>Mark as Picked Up</Text>
                      </View>
                    </Button>
                  ) : order.status === "IN_TRANSIT" ? (
                    <Button
                      onPress={() => handleMarkAsDelivered(order.id)}
                      className="w-full bg-secondary"
                      disabled={markAsDeliveredMutation.isPending}
                    >
                      <View className="flex-row items-center space-x-1">
                        <CheckCircle2 />
                        <Text>Mark as Delivered</Text>
                      </View>
                    </Button>
                  ) : null}
                </View>
              </View>
            ) : null
          )}
        </View>
      ) : (
        <View className="bg-muted rounded-2xl p-8 items-center mt-4">
          <Clock size={32} color="#6B7280" style={{ marginBottom: 12 }} />
          <Text className="text-lg font-bold text-foreground mb-1">
            No Active Orders
          </Text>
          <Text className="text-muted-foreground">
            New orders will appear here when assigned by admin
          </Text>
        </View>
      )}

      {/* Confirmation Dialog */}
      <Modal visible={showConfirmationDialog} transparent animationType="fade">
        <View className="flex-1 bg-black/60 justify-center items-center">
          <View className="bg-card rounded-2xl p-6 w-4/5">
            <Text className="text-xl font-bold mb-3 text-foreground">
              Confirm Delivery
            </Text>
            <Text className="text-muted-foreground mb-3">
              Enter the confirmation code if provided by the customer:
            </Text>
            <Input
              value={confirmationCode}
              onChangeText={setConfirmationCode}
              placeholder="Confirmation code (optional)"
              keyboardType="numeric"
              className="mb-4"
            />
            <View className="flex-row space-x-2">
              <Button
                variant="outline"
                className="flex-1"
                onPress={() => {
                  setShowConfirmationDialog(false);
                  setConfirmationCode("");
                  setOrderToDeliver(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onPress={confirmDelivery}
                className="flex-1 bg-primary"
                disabled={markAsDeliveredMutation.isPending}
              >
                {markAsDeliveredMutation.isPending ? (
                  <ActivityIndicator color="white" />
                ) : (
                  "Confirm"
                )}
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
