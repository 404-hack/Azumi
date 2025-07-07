import { FontAwesome } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
    <ScrollView style={{ flex: 1, backgroundColor: "#F7F8FA", padding: 16 }}>
      {/* Header */}
      <View
        style={{
          backgroundColor: "white",
          borderRadius: 16,
          padding: 24,
          marginBottom: 16,
          shadowColor: "#000",
          shadowOpacity: 0.05,
          shadowRadius: 4,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <View>
            <Text style={{ fontSize: 20, fontWeight: "bold" }}>
              Rider Dashboard
            </Text>
            <Text style={{ fontSize: 14, color: "#6B7280" }}>
              {/* Welcome, {profile?.firstName || "Rider"} */}
            </Text>
          </View>
        </View>
      </View>

      {/* Active Orders */}
      {activeOrders.length > 0 ? (
        <View>
          <View
            style={{
              backgroundColor: "white",
              borderRadius: 16,
              padding: 16,
              marginBottom: 16,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: "bold" }}>
                Active Orders
              </Text>
              <Text
                style={{
                  backgroundColor: "#DBEAFE",
                  color: "#1D4ED8",
                  borderRadius: 16,
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                  fontSize: 14,
                }}
              >
                {activeOrders.length} orders
              </Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ flexDirection: "row", marginBottom: 8 }}
            >
              {/* {activeOrders.map((order) => (
                <TouchableOpacity
                  key={order.id}
                  onPress={() => setSelectedOrderId(order.id)}
                  style={{
                    backgroundColor:
                      selectedOrderId === order.id ? "#3B82F6" : "#F3F4F6",
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 8,
                    marginRight: 8,
                  }}
                >
                  <Text
                    style={{
                      color: selectedOrderId === order.id ? "white" : "#374151",
                      fontWeight: "bold",
                    }}
                  >
                    {order.code || `Order ${order.id.slice(-6)}`}
                  </Text>
                </TouchableOpacity>
              ))} */}
            </ScrollView>
          </View>

          {/* Order Details */}
          {activeOrders.map((order) =>
            selectedOrderId === order.id ? (
              <View
                key={order.id}
                style={{
                  borderWidth: 2,
                  borderColor: "#BFDBFE",
                  backgroundColor: "#EFF6FF",
                  borderRadius: 16,
                  padding: 24,
                  marginBottom: 16,
                }}
              >
                {/* Order Header */}
                <View style={{ alignItems: "center", marginBottom: 16 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 18,
                        fontWeight: "bold",
                        color: "#1E3A8A",
                      }}
                    >
                      {order.code || `Order ${order.id.slice(-6)}`}
                    </Text>
                    <Text
                      style={{
                        backgroundColor: getStatusColor(order.status),
                        color: "white",
                        borderRadius: 8,
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        fontSize: 12,
                      }}
                    >
                      {getStatusText(order.status)}
                    </Text>
                  </View>
                  <Text style={{ color: "#2563EB", fontSize: 14 }}>
                    {order.total && `₦${order.total.toLocaleString()}`}
                  </Text>
                </View>
                {/* Pickup Info */}
                <View
                  style={{
                    backgroundColor: "white",
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 12,
                  }}
                >
                  <Text style={{ fontWeight: "bold" }}>
                    Pickup from {order.shop?.name}
                  </Text>
                  <Text style={{ color: "#6B7280" }}>
                    {order.shop?.address}
                  </Text>
                  <Text
                    style={{ color: "#9CA3AF", fontSize: 12, marginTop: 4 }}
                  >
                    Distance to be calculated
                  </Text>
                  <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
                    <Button
                      variant="outline"
                      size="sm"
                      onPress={() =>
                        Linking.openURL(`tel:${order.shop?.phoneNumber}`)
                      }
                    >
                      <FontAwesome name="phone" size={14} /> Call Store
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onPress={() =>
                        Linking.openURL(
                          `https://maps.google.com?daddr=${encodeURIComponent(order.shop?.address || "")}`
                        )
                      }
                    >
                      <FontAwesome name="location-arrow" size={14} /> Navigate
                    </Button>
                  </View>
                </View>
                {/* Delivery Info */}
                <View
                  style={{
                    backgroundColor: "white",
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 12,
                  }}
                >
                  <Text style={{ fontWeight: "bold" }}>
                    Deliver to {order.customer?.name || "Customer"}
                  </Text>
                  <Text style={{ color: "#6B7280" }}>
                    {order.addressName ||
                      `${order.latitude}, ${order.longitude}`}
                  </Text>
                  <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
                    {order.customer?.phoneNumber && (
                      <Button
                        variant="outline"
                        size="sm"
                        onPress={() =>
                          Linking.openURL(`tel:${order.customer?.phoneNumber}`)
                        }
                      >
                        <FontAwesome name="phone" size={14} /> Call Customer
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
                      <FontAwesome name="location-arrow" size={14} /> Navigate
                    </Button>
                  </View>
                </View>
                {/* Actions */}
                <View style={{ gap: 8 }}>
                  <Button
                    variant="outline"
                    style={{
                      width: "100%",
                      borderColor: "#BFDBFE",
                    }}
                  >
                    <FontAwesome name="eye" size={16} /> View Details
                  </Button>
                  {order.status === "RIDER_ASSIGNED" ? (
                    <Button
                      onPress={() => markAsPickedUp(order.id)}
                      style={{
                        width: "100%",
                        backgroundColor: "#3B82F6",
                      }}
                      disabled={markAsPickedUpMutation.isPending}
                    >
                      <FontAwesome name="check-circle" size={18} /> Mark as
                      Picked Up
                    </Button>
                  ) : order.status === "IN_TRANSIT" ? (
                    <Button
                      onPress={() => handleMarkAsDelivered(order.id)}
                      style={{
                        width: "100%",
                        backgroundColor: "#22C55E",
                      }}
                      disabled={markAsDeliveredMutation.isPending}
                    >
                      <FontAwesome name="check-circle" size={18} /> Mark as
                      Delivered
                    </Button>
                  ) : null}
                </View>
              </View>
            ) : null
          )}
        </View>
      ) : (
        <View
          style={{
            backgroundColor: "#F3F4F6",
            borderRadius: 16,
            padding: 32,
            alignItems: "center",
            marginTop: 16,
          }}
        >
          <FontAwesome
            name="clock-o"
            size={32}
            color="#6B7280"
            style={{ marginBottom: 12 }}
          />
          <Text
            style={{
              fontSize: 16,
              fontWeight: "bold",
              color: "#181C2A",
              marginBottom: 4,
            }}
          >
            No Active Orders
          </Text>
          <Text style={{ color: "#6B7280" }}>
            New orders will appear here when assigned by admin
          </Text>
        </View>
      )}

      {/* Confirmation Dialog */}
      <Modal visible={showConfirmationDialog} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: "#00000088",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View
            style={{
              backgroundColor: "white",
              borderRadius: 16,
              padding: 24,
              width: "80%",
            }}
          >
            <Text
              style={{ fontSize: 18, fontWeight: "bold", marginBottom: 12 }}
            >
              Confirm Delivery
            </Text>
            <Text style={{ color: "#6B7280", marginBottom: 12 }}>
              Enter the confirmation code if provided by the customer:
            </Text>
            <Input
              value={confirmationCode}
              onChangeText={setConfirmationCode}
              placeholder="Confirmation code (optional)"
              keyboardType="numeric"
              style={{ marginBottom: 16 }}
            />
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Button
                variant="outline"
                style={{ flex: 1 }}
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
                style={{ flex: 1 }}
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
