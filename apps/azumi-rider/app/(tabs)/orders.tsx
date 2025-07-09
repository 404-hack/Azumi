import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import {
  AlertCircle,
  CheckCircle,
  DollarSign,
  MapPin,
  Package,
  Store,
  User,
} from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Text } from "~/components/ui/text";
import api from "~/lib/api";

export default function Orders() {
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const router = useRouter();

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const response = await api.orders.getAll();
      return response.data || [];
    },
  });

  const orders = Array.isArray(data) ? data : [];

  // Filter orders based on tab and search
  const filteredOrders = orders.filter((order) => {
    const matchesTab =
      tab === "all" ||
      (tab === "today" &&
        new Date(order.date).toDateString() === new Date().toDateString()) ||
      (tab === "week" &&
        new Date(order.date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));

    const matchesSearch =
      search === "" ||
      order.id.toLowerCase().includes(search.toLowerCase()) ||
      order.store.toLowerCase().includes(search.toLowerCase()) ||
      order.customer.toLowerCase().includes(search.toLowerCase());

    return matchesTab && matchesSearch;
  });

  // Calculate totals
  const totalEarnings = orders.reduce(
    (sum, order) => sum + (typeof order.fee === "number" ? order.fee : 0),
    0
  );
  const totalOrders = orders.length;

  return (
    <SafeAreaView className="flex-1 bg-background px-4 pt-6">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
      >
        <View className="mb-6">
          <Text className="text-2xl font-bold text-foreground mb-1">
            Order History
          </Text>
          <Text className="text-base text-muted-foreground">
            View all your completed deliveries
          </Text>
        </View>

        <View className="flex-row gap-4 mb-6">
          <Card className="flex-1 items-center p-4">
            <DollarSign size={32} color="#22c55e" className="mb-2" />
            <Text className="text-3xl font-bold text-green-600 mb-1">
              ₦{typeof totalEarnings === "number" ? totalEarnings.toLocaleString() : 0}
            </Text>
            <Text className="text-base text-muted-foreground">
              Total Earnings
            </Text>
          </Card>
          <Card className="flex-1 items-center p-4">
            <Package size={32} color="#2563eb" className="mb-2" />
            <Text className="text-3xl font-bold text-blue-600 mb-1">
              {totalOrders}
            </Text>
            <Text className="text-base text-muted-foreground">
              Total Orders
            </Text>
          </Card>
        </View>

        <Card className="mb-6 p-4">
          <View className="flex-row gap-2 mb-4">
            <Button
              variant={tab === "all" ? "default" : "outline"}
              className="flex-1"
              onPress={() => setTab("all")}
            >
              <Text>All Orders</Text>
            </Button>
            <Button
              variant={tab === "today" ? "default" : "outline"}
              className="flex-1"
              onPress={() => setTab("today")}
            >
              <Text>Today</Text>
            </Button>
            <Button
              variant={tab === "week" ? "default" : "outline"}
              className="flex-1"
              onPress={() => setTab("week")}
            >
              <Text>This Week</Text>
            </Button>
          </View>
          <TextInput
            className="h-10 rounded-md border border-input bg-background px-3 text-base text-foreground mb-4"
            placeholder="Search orders..."
            value={search}
            onChangeText={setSearch}
          />

          {/* Loading State */}
          {isLoading && (
            <View className="flex-1 justify-center items-center py-8">
              <ActivityIndicator size="large" color="#f97316" />
              <Text className="text-muted-foreground mt-2">
                Loading orders...
              </Text>
            </View>
          )}

          {/* Error State */}
          {error && (
            <View className="flex-1 justify-center items-center py-8">
              <AlertCircle size={48} color="#ef4444" />
              <Text className="text-red-500 text-center mt-2 mb-4">
                Failed to load orders. Please try again.
              </Text>
              <Button onPress={() => refetch()}>
                <Text>Retry</Text>
              </Button>
            </View>
          )}

          {/* Orders List */}
          {!isLoading && !error && (
            <>
              {filteredOrders.length === 0 ? (
                <View className="flex-1 justify-center items-center py-8">
                  <Package size={48} color="#6b7280" />
                  <Text className="text-xl font-semibold text-foreground mb-2 mt-4">
                    No Orders Found
                  </Text>
                  <Text className="text-muted-foreground text-center">
                    {search
                      ? "No orders match your search criteria"
                      : "No orders available for the selected period"}
                  </Text>
                </View>
              ) : (
                filteredOrders.map((order) => (
                  <Pressable
                    key={order.id}
                    onPress={() =>
                      router.push({
                        pathname: "/[orderDetails]",
                        params: { orderDetails: order.id },
                      })
                    }
                  >
                    <Card className="mb-4 p-4">
                      <View className="flex-row justify-between items-center mb-3">
                        <Text className="font-bold text-base">
                          Order #{order.id}
                        </Text>
                        <View className="flex-row items-center gap-2">
                          <Text className="font-bold text-lg">
                            ₦{typeof order.amount === "number" ? order.amount.toLocaleString() : 0}
                          </Text>
                          <View
                            className={`px-2 py-1 rounded-full flex-row items-center ${
                              order.status === "DELIVERED"
                                ? "bg-green-100"
                                : order.status === "IN_PROGRESS"
                                  ? "bg-blue-100"
                                  : order.status === "PENDING"
                                    ? "bg-yellow-100"
                                    : "bg-gray-100"
                            }`}
                          >
                            <CheckCircle
                              size={14}
                              color={
                                order.status === "DELIVERED"
                                  ? "#22c55e"
                                  : order.status === "IN_PROGRESS"
                                    ? "#2563eb"
                                    : order.status === "PENDING"
                                      ? "#f59e0b"
                                      : "#6b7280"
                              }
                            />
                            <Text
                              className={`ml-1 text-sm font-medium ${
                                order.status === "DELIVERED"
                                  ? "text-green-700"
                                  : order.status === "IN_PROGRESS"
                                    ? "text-blue-700"
                                    : order.status === "PENDING"
                                      ? "text-yellow-700"
                                      : "text-gray-700"
                              }`}
                            >
                              {order.status}
                            </Text>
                          </View>
                        </View>
                      </View>
                      <View className="flex-row justify-between items-center mb-3">
                        <Text className="text-muted-foreground">Fee:</Text>
                        <Text className="text-green-600 font-bold">
                          ₦{typeof order.fee === "number" ? order.fee.toLocaleString() : 0}
                        </Text>
                      </View>
                      <View className="flex-row items-center gap-2 mb-2">
                        <Store size={16} color="#f59e42" />
                        <View className="flex-1">
                          <Text className="font-semibold">{order.store}</Text>
                          <Text className="text-muted-foreground">
                            {order.storeAddress}
                          </Text>
                        </View>
                      </View>
                      <View className="flex-row items-center gap-2 mb-2">
                        <User size={16} color="#2563eb" />
                        <View className="flex-1">
                          <Text className="font-semibold">
                            {order.customer}
                          </Text>
                          <Text className="text-muted-foreground">
                            {order.customerAddress}
                          </Text>
                        </View>
                      </View>
                      <View className="flex-row items-center gap-2 mt-2">
                        <MapPin size={14} color="#a3a3a3" />
                        <Text className="text-muted-foreground">
                          {order.date}
                        </Text>
                      </View>
                    </Card>
                  </Pressable>
                ))
              )}
            </>
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
