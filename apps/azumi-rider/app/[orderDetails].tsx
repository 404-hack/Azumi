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
import React from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Text } from "~/components/ui/text";

const mockOrders = {
  nzGJev: {
    id: "nzGJev",
    status: "DELIVERED",
    amount: 8210,
    fee: 7550,
    items: [
      {
        name: "white rice 0909",
        desc: "vvvvvvvvvvv",
        qty: 1,
        price: 200,
        options: [
          { label: "second smart phone", price: 100 },
          { label: "medium size", price: 0 },
        ],
      },
      {
        name: "white rice",
        desc: "ccccccccds sdd wwe",
        qty: 4,
        price: 400,
        options: [],
      },
    ],
    created: "Jun 30, 2025, 12:16 PM",
    pickup: {
      name: "lawal store",
      address: "Ikotun, Lagos 102213, Lagos, Nigeria",
    },
    delivery: {
      name: "lawal adebola",
      address: "Lasu Rd, Epe 106101, Lagos, Nigeria",
    },
  },
};

export default function OrderDetails() {
  const { orderDetails } = useLocalSearchParams();
  const order = mockOrders[orderDetails as string] || mockOrders.nzGJev;

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
        {/* ...rest of the order details UI as before... */}
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
              ₦{order.amount.toLocaleString()}
            </Text>
            <Text className="font-bold text-lg mb-1">Delivery Fee</Text>
            <Text className="font-bold text-green-600 text-2xl">
              ₦{order.fee.toLocaleString()}
            </Text>
          </CardContent>
        </Card>
        {/* ...rest of the UI unchanged... */}
        {/* Order Summary */}
        <Card className="mb-6">
          <CardHeader className="flex-row items-center gap-2">
            <DollarSign size={20} color="#22c55e" />
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <View className="flex-row justify-between mb-2">
              <Text>Total</Text>
              <Text>₦{order.amount.toLocaleString()}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text>Delivery Fee</Text>
              <Text>₦{order.fee.toLocaleString()}</Text>
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
            {order.items.map((item, idx) => (
              <View key={idx} className="mb-6 flex-row gap-4">
                <View className="w-12 h-12 bg-orange-100 rounded-lg items-center justify-center">
                  <Store size={28} color="#f59e42" />
                </View>
                <View className="flex-1">
                  <Text className="font-bold">{item.name}</Text>
                  <Text className="text-xs text-muted-foreground mb-1">
                    {item.desc}
                  </Text>
                  <Text className="text-xs mb-1">
                    Qty: {item.qty}{" "}
                    <Text className="font-bold">₦{item.price}</Text>
                  </Text>
                  {item.options.length > 0 && (
                    <View className="ml-2 mt-1">
                      <Text className="text-xs font-semibold mb-1">
                        Options:
                      </Text>
                      {item.options.map((opt, oidx) => (
                        <View
                          key={oidx}
                          className="flex-row justify-between mb-1"
                        >
                          <Text className="text-xs text-muted-foreground">
                            {opt.label}
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
                {order.created}
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
            <Text className="font-bold mb-1">{order.pickup.name}</Text>
            <View className="flex-row items-center gap-2 mb-3">
              <MapPin size={14} color="#a3a3a3" />
              <Text className="text-xs text-muted-foreground">
                {order.pickup.address}
              </Text>
            </View>
            <View className="flex-row gap-2">
              <Button
                variant="outline"
                className="flex-1 flex-row items-center justify-center gap-2"
              >
                <Phone size={16} />
                <Text>Call</Text>
              </Button>
              <Button
                variant="outline"
                className="flex-1 flex-row items-center justify-center gap-2"
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
            <Text className="font-bold mb-1">{order.delivery.name}</Text>
            <View className="flex-row items-center gap-2 mb-3">
              <MapPin size={14} color="#a3a3a3" />
              <Text className="text-xs text-muted-foreground">
                {order.delivery.address}
              </Text>
            </View>
            <View className="flex-row gap-2">
              <Button
                variant="outline"
                className="flex-1 flex-row items-center justify-center gap-2"
              >
                <Phone size={16} />
                <Text>Call</Text>
              </Button>
              <Button
                variant="outline"
                className="flex-1 flex-row items-center justify-center gap-2"
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
              <Text>12:16 PM</Text>
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
              <Text>₦{order.amount.toLocaleString()}</Text>
            </View>
            <View className="flex-row justify-between mb-2">
              <Text>Delivery Fee</Text>
              <Text className="text-green-600">
                ₦{order.fee.toLocaleString()}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="font-bold">Total Amount:</Text>
              <Text className="font-bold">
                ₦{order.amount.toLocaleString()}
              </Text>
            </View>
          </CardContent>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
