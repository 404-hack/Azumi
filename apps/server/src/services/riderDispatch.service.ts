import { Context } from "../lib/types";
import { and, eq, isNotNull, not, gte, lte } from "drizzle-orm";
import { orderTable, orderItemTable } from "../lib/db/schema/order.schema";
import { riderTable } from "../lib/db/schema/rider.schema";
import { shopTable } from "../lib/db/schema/shop.schema";
import { addressesTable } from "../lib/db/schema/address.schema";
import { calculateDistance } from "../lib/utils/geo";
import { createClient } from "../lib/db";
import { env } from "cloudflare:workers";
import { PushNotificationService } from "./push-notification.service";
import { userTable } from "../lib/db/schema/auth.schema";

interface RiderForNotification {
  id: string;
  userId: string | null;
  firstName?: string | null;
  lastName?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  vehicleType?: string | null;
  rating?: number | null;
  maxDeliveryDistance?: number | null;
}

interface RiderMetricInfo {
  rider: RiderForNotification;
  metrics: {
    pickupDistanceKm: number;
    deliveryDistanceKm: number;
    totalDistanceKm: number;
    estimatedPickupMinutes: number;
    estimatedDeliveryMinutes: number;
    estimatedTotalMinutes: number;
  };
}

interface OrderInfo {
  id: string;
  shopId: string;
  shopLocation: {
    latitude: number | null | undefined;
    longitude: number | null | undefined;
  };
  deliveryLocation: {
    latitude: number | null | undefined;
    longitude: number | null | undefined;
  };
}

export class RiderDispatchService {
  private MAX_PICKUP_DISTANCE_KM = 10;
  private AVG_SPEED_KM_H = 15;
  private RIDER_RESPONSE_TIMEOUT_MS = 5 * 60 * 1000;
  private PUSH_NOTIFICATION_TIMEOUT_MS = 30 * 1000;
  private SMS_FALLBACK_ENABLED = true;

  constructor(private c?: Context) {}

  private calculateRiderEarnings(
    shopLat: number,
    shopLng: number,
    customerLat: number,
    customerLng: number
  ): number {
    const distance = calculateDistance(
      shopLat,
      shopLng,
      customerLat,
      customerLng
    );

    if (distance <= 1) {
      return 350;
    } else {
      const additionalKm = Math.ceil(distance - 1);
      return 350 + additionalKm * 150;
    }
  }

  /**
   * Finds available riders for an order directly from the database
   * @param orderId The ID of the order
   * @returns Promise<{ orderInfo: OrderInfo, availableRiders: RiderMetricInfo[] }>
   */
  public async findAvailableRiders(
    orderId: string
  ): Promise<{ orderInfo: OrderInfo; availableRiders: RiderMetricInfo[] }> {
    console.log(`RiderDispatchService: Finding riders for order ${orderId}`);

    const db = createClient(env.DB); // Get the order with shop details
    const order = await db.query.orderTable.findFirst({
      where: eq(orderTable.id, orderId),
      columns: {
        id: true,
        shopId: true,
        latitude: true, // Delivery location
        longitude: true, // Delivery location
      },
    });

    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    // Fetch shop details separately to avoid relation issues
    const shop = await db.query.shopTable.findFirst({
      where: eq(shopTable.id, order.shopId),
      columns: {
        name: true,
        latitude: true, // Shop location
        longitude: true, // Shop location
      },
    });
    if (!shop) {
      throw new Error(`Shop information not available for order ${orderId}`);
    }

    if (
      shop.latitude === null ||
      shop.longitude === null ||
      shop.latitude === undefined ||
      shop.longitude === undefined
    ) {
      throw new Error(`Shop location not available for order ${orderId}`);
    }

    // Calculate bounding box for rider search
    const shopLat = shop.latitude;
    const shopLng = shop.longitude;
    const searchRadiusKm = this.MAX_PICKUP_DISTANCE_KM; // Use the same radius for the box for simplicity, precise filter will refine

    const latDelta = searchRadiusKm / 111.32; // Kilometers per degree of latitude (approx)
    const lonDelta =
      searchRadiusKm / (111.32 * Math.cos(shopLat * (Math.PI / 180))); // Kilometers per degree of longitude

    const minLat = shopLat - latDelta;
    const maxLat = shopLat + latDelta;
    const minLon = shopLng - lonDelta;
    const maxLon = shopLng + lonDelta;

    console.log(
      `Bounding box for order ${orderId}: minLat=${minLat}, maxLat=${maxLat}, minLon=${minLon}, maxLon=${maxLon}`
    );

    // Find available riders within the bounding box
    const availableRidersFromDB = await db.query.riderTable.findMany({
      where: and(
        eq(riderTable.availabilityStatus, "AVAILABLE"),
        eq(riderTable.active, true),
        gte(riderTable.latitude, minLat),
        lte(riderTable.latitude, maxLat),
        gte(riderTable.longitude, minLon),
        lte(riderTable.longitude, maxLon)
      ),
      columns: {
        id: true,
        userId: true,
        firstName: true,
        lastName: true,
        latitude: true,
        longitude: true,
        vehicleType: true,
        rating: true,
        maxDeliveryDistance: true,
      },
    });

    // Filter riders by distance and calculate delivery metrics
    const ridersWithMetrics = availableRidersFromDB
      .map((rider) => {
        // Calculate distance from rider to shop
        const pickupDistanceKm = calculateDistance(
          rider.latitude || 0,
          rider.longitude || 0,
          shop.latitude || 0,
          shop.longitude || 0
        );

        // Calculate distance from shop to delivery location
        const deliveryDistanceKm = calculateDistance(
          shop.latitude || 0,
          shop.longitude || 0,
          order.latitude || 0,
          order.longitude || 0
        );

        // Calculate estimated time based on distance and average speed
        const estimatedPickupMinutes = Math.round(
          (pickupDistanceKm / this.AVG_SPEED_KM_H) * 60
        );
        const estimatedDeliveryMinutes = Math.round(
          (deliveryDistanceKm / this.AVG_SPEED_KM_H) * 60
        );
        return {
          rider,
          metrics: {
            pickupDistanceKm,
            deliveryDistanceKm,
            totalDistanceKm: pickupDistanceKm + deliveryDistanceKm,
            estimatedPickupMinutes,
            estimatedDeliveryMinutes,
            estimatedTotalMinutes:
              estimatedPickupMinutes + estimatedDeliveryMinutes,
          },
        };
      })
      .filter(
        (item) =>
          item.metrics.pickupDistanceKm <= this.MAX_PICKUP_DISTANCE_KM &&
          (item.rider.maxDeliveryDistance !== null &&
          item.rider.maxDeliveryDistance !== undefined
            ? item.rider.maxDeliveryDistance >= item.metrics.deliveryDistanceKm
            : true)
      )
      .sort((a, b) => {
        // Primary sort: total distance
        const distanceDiff =
          a.metrics.totalDistanceKm - b.metrics.totalDistanceKm;
        if (distanceDiff !== 0) {
          return distanceDiff;
        }
        // Secondary sort: rider rating (descending)
        return (b.rider.rating || 0) - (a.rider.rating || 0);
      });
    const orderInfo: OrderInfo = {
      id: order.id,
      shopId: order.shopId,
      shopLocation: {
        latitude: shop.latitude,
        longitude: shop.longitude,
      },
      deliveryLocation: {
        latitude: order.latitude,
        longitude: order.longitude,
      },
    };
    return {
      orderInfo,
      availableRiders: ridersWithMetrics,
    };
  }

  /**
   * Check if an order is still available for assignment
   * @param orderId The ID of the order to check
   * @returns Promise<boolean> true if order is still available
   */
  private async isOrderStillAvailable(orderId: string): Promise<boolean> {
    try {
      const db = createClient(env.DB);
      const order = await db.query.orderTable.findFirst({
        where: and(
          eq(orderTable.id, orderId),
          eq(orderTable.status, "READY"),
          not(isNotNull(orderTable.riderId))
        ),
        columns: { id: true, status: true, riderId: true },
      });

      return !!order;
    } catch (error) {
      console.error(`Error checking order availability for ${orderId}:`, error);
      return false;
    }
  }

  /**
   * Finds available riders for an order and sends them notifications
   * @param orderId The ID of the order
   * @param shopId The ID of the shop (optional)
   * @returns Promise<void>
   */ public async findAndNotifyRiders(
    orderId: string,
    shopId: string | null | undefined
  ): Promise<void> {
    console.log(
      `RiderDispatchService: Starting simple dispatch for order ${orderId} (Epe, Lagos)`
    );

    try {
      const { availableRiders, orderInfo } =
        await this.findAvailableRiders(orderId);
      if (!availableRiders || availableRiders.length === 0) {
        console.log(
          `RiderDispatchService: No available riders found for order ${orderId} - manual assignment required (auto-notification disabled)`
        );
        // DISABLED: Auto-notification removed since switching to manual rider assignment
        // await this.notifyAdminsNoRiders(orderId);
        return;
      }

      console.log(
        `RiderDispatchService: Found ${availableRiders.length} riders for order ${orderId} - notifying all simultaneously`
      );

      await this.sendNotificationsToRiders(
        availableRiders.map((item) => item.rider),
        orderId,
        shopId,
        "New Order Available",
        orderInfo
      );

      await new Promise((resolve) =>
        setTimeout(resolve, this.RIDER_RESPONSE_TIMEOUT_MS)
      );

      const orderStillAvailable = await this.isOrderStillAvailable(orderId);
      if (!orderStillAvailable) {
        console.log(
          `RiderDispatchService: Order ${orderId} was accepted by a rider`
        );
        return;
      }

      console.log(
        `RiderDispatchService: No response after 5 minutes for order ${orderId} - sending SMS fallback`
      );

      if (this.SMS_FALLBACK_ENABLED) {
        await this.sendSMSFallback(availableRiders, orderId, orderInfo);
      }

      await this.notifyAdminsNoResponse(orderId);
    } catch (error) {
      console.error(
        `RiderDispatchService: Error in dispatch for order ${orderId}:`,
        error
      );
    }
  }

  /**
   * Auto-assign the closest available rider to an order
   * @param orderId The ID of the order
   * @returns Promise<{ success: boolean, riderId?: string, message: string, distance?: number }>
   */ public async autoAssignRider(orderId: string): Promise<{
    success: boolean;
    riderId?: string;
    message: string;
    distance?: number;
  }> {
    console.log(
      `RiderDispatchService: Starting auto-assignment for order ${orderId}`
    );

    try {
      const db = createClient(env.DB); // Check if order is already assigned or not READY
      const order = await db.query.orderTable.findFirst({
        where: and(
          eq(orderTable.id, orderId),
          eq(orderTable.status, "READY"),
          not(isNotNull(orderTable.riderId))
        ),
      });

      if (!order) {
        return {
          success: false,
          message: "Order not found, not READY, or already has a rider",
        };
      }

      // Get available riders
      try {
        const { availableRiders } = await this.findAvailableRiders(orderId);

        if (availableRiders.length === 0) {
          return { success: false, message: "No available riders" };
        }

        // Get the closest rider (should be first due to sort)
        const closestRiderWithMetrics = availableRiders[0];
        const closestRider = closestRiderWithMetrics.rider;
        const shortestDistance =
          closestRiderWithMetrics.metrics.pickupDistanceKm; // Assign the closest rider
        const [updatedOrder] = await db
          .update(orderTable)
          .set({
            riderId: closestRider.userId,
            status: "RIDER_ASSIGNED",
            riderAssignedAt: new Date().toISOString(),
          })
          .where(eq(orderTable.id, orderId))
          .returning();

        // Update rider status to BUSY
        await db
          .update(riderTable)
          .set({ availabilityStatus: "BUSY" })
          .where(eq(riderTable.id, closestRider.id));

        console.log(
          `RiderDispatchService: Auto-assigned rider ${closestRider.id} to order ${orderId}`
        ); // Try to notify workflow
        try {
          const workflowInstance = await env.ORDER_WORKFLOW.get(orderId);
          const estimatedPickupMinutes =
            closestRiderWithMetrics.metrics.estimatedPickupMinutes;

          await workflowInstance.sendEvent({
            type: "accept_order",
            payload: {
              orderId,
              riderId: closestRider.userId,
              timestamp: new Date().toISOString(),
              estimatedPickupTime: `${estimatedPickupMinutes} minutes`,
            },
          });
          console.log(
            `RiderDispatchService: Notified workflow about rider assignment for order ${orderId}`
          );
        } catch (workflowError) {
          console.error(
            `RiderDispatchService: Failed to notify workflow about rider assignment:`,
            workflowError
          );
        }
        return {
          success: true,
          riderId: closestRider.userId || undefined,
          message: "Rider auto-assigned successfully",
          distance: shortestDistance,
        };
      } catch (err) {
        console.error(
          `RiderDispatchService: Error finding riders for order ${orderId}:`,
          err
        );
        return { success: false, message: "Error finding riders" };
      }
    } catch (error) {
      console.error("RiderDispatchService: Error in auto-assign:", error);
      return {
        success: false,
        message: "Internal server error during auto-assignment",
      };
    }
  }

  /**
   * Manually assign a specific rider to an order
   * @param orderId The ID of the order
   * @param riderId The ID of the rider to assign
   * @returns Promise<{ success: boolean, message: string }>
   */ public async assignRider(
    orderId: string,
    riderId: string
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const db = createClient(env.DB);

      // Verify order is in READY status
      const order = await db.query.orderTable.findFirst({
        where: and(eq(orderTable.id, orderId), eq(orderTable.status, "READY")),
      });

      if (!order) {
        return {
          success: false,
          message: "Order not found or not in READY status",
        };
      }

      // Verify rider is available
      const rider = await db.query.riderTable.findFirst({
        where: and(
          eq(riderTable.id, riderId),
          eq(riderTable.availabilityStatus, "AVAILABLE")
        ),
      });

      if (!rider) {
        return {
          success: false,
          message: "Rider not found or not available",
        };
      } // Update order with rider assignment
      await db
        .update(orderTable)
        .set({
          riderId: rider.userId,
          status: "RIDER_ASSIGNED",
          riderAssignedAt: new Date().toISOString(),
        })
        .where(eq(orderTable.id, orderId));

      // Update rider status to BUSY
      await db
        .update(riderTable)
        .set({ availabilityStatus: "BUSY" })
        .where(eq(riderTable.id, riderId));

      console.log(
        `RiderDispatchService: Assigned rider ${riderId} to order ${orderId}`
      ); // Try to notify workflow
      try {
        const workflowInstance = await env.ORDER_WORKFLOW.get(orderId);
        await workflowInstance.sendEvent({
          type: "accept_order",
          payload: {
            orderId,
            riderId: rider.userId,
            timestamp: new Date().toISOString(),
            estimatedPickupTime: "15 minutes", // This would ideally be calculated
          },
        });
      } catch (workflowError) {
        console.error(
          "RiderDispatchService: Failed to notify workflow about rider assignment:",
          workflowError
        );
      }

      return {
        success: true,
        message: "Rider assigned successfully",
      };
    } catch (error) {
      console.error("RiderDispatchService: Error assigning rider:", error);
      return {
        success: false,
        message: "Internal server error during rider assignment",
      };
    }
  } /**
   * Sends notifications to selected riders
   * @param riders Array of riders to notify
   * @param orderId The order ID
   * @param shopId The shop ID
   * @param offerType The type of offer (e.g., "Tier 1 Offer", "Tier 2 Offer")
   * @param orderInfo The order information containing location coordinates
   * @returns Promise<void>
   */
  private async sendNotificationsToRiders(
    riders: RiderForNotification[],
    orderId: string,
    shopId: string | null | undefined,
    offerType: string,
    orderInfo: OrderInfo
  ): Promise<void> {
    const pushNotificationService = new PushNotificationService();
    const db = createClient(env.DB);
    const orderData = await db.query.orderTable.findFirst({
      where: eq(orderTable.id, orderId),
      columns: {
        id: true,
        total: true,
        deliveryFee: true,
        customerId: true,
        createdAt: true,
        addressName: true,
      },
    });

    const orderItems = await db.query.orderItemTable.findMany({
      where: eq(orderItemTable.orderId, orderId),
      columns: {
        id: true,
        quantity: true,
      },
    });

    if (!orderData) {
      console.error(`❌ Order ${orderId} not found when sending notifications`);
      return;
    }
    const itemCount = orderItems.reduce(
      (sum: number, item: any) => sum + item.quantity,
      0
    );
    const orderValue = (orderData.total || 0) - (orderData.deliveryFee || 0);
    const shopData = await db.query.shopTable.findFirst({
      where: eq(shopTable.id, orderInfo.shopId),
      columns: {
        name: true,
        address: true,
        addressName: true,
        latitude: true,
        longitude: true,
      },
    });

    const shopAddress =
      shopData?.addressName ||
      shopData?.address ||
      shopData?.name ||
      "Shop Location";
    const deliveryAddress = orderData.addressName || "Delivery Location";

    for (const rider of riders) {
      try {
        let estimatedDistance = 5;
        let estimatedDuration = 25;

        if (
          rider.latitude &&
          rider.longitude &&
          orderInfo.shopLocation.latitude &&
          orderInfo.shopLocation.longitude
        ) {
          const pickupDistance = calculateDistance(
            rider.latitude,
            rider.longitude,
            orderInfo.shopLocation.latitude as number,
            orderInfo.shopLocation.longitude as number
          );

          let deliveryDistance = 0;
          if (
            orderInfo.deliveryLocation.latitude &&
            orderInfo.deliveryLocation.longitude
          ) {
            deliveryDistance = calculateDistance(
              orderInfo.shopLocation.latitude as number,
              orderInfo.shopLocation.longitude as number,
              orderInfo.deliveryLocation.latitude as number,
              orderInfo.deliveryLocation.longitude as number
            );
          }

          estimatedDistance = Math.round(pickupDistance + deliveryDistance);
          estimatedDuration = Math.round(
            (estimatedDistance / this.AVG_SPEED_KM_H) * 60
          );
        }

        if (rider.userId) {
          await pushNotificationService.sendNotificationToUser(rider.userId, {
            title: "🚴‍♂️ New Delivery Opportunity!",
            body: "New order available for pickup. Tap to accept and start earning!",
            data: {
              type: "new_order",
              orderId: orderId,
              action: "accept_order",
              link: `/rider/orders/${orderId}/accept`,
            },
          });

          console.log(
            `✅ Push notification sent to rider ${rider.id} for order ${orderId}`
          );
        }
        const orderForDispatch = {
          id: orderId,
          shopId: shopId || "",
          pickupLocation: {
            lat: orderInfo.shopLocation.latitude || 0,
            lng: orderInfo.shopLocation.longitude || 0,
            address: shopAddress,
          },
          deliveryLocation: {
            lat: orderInfo.deliveryLocation.latitude || 0,
            lng: orderInfo.deliveryLocation.longitude || 0,
            address: deliveryAddress,
          },
          orderValue: orderValue,
          deliveryFee: this.calculateRiderEarnings(
            orderInfo.shopLocation.latitude || 0,
            orderInfo.shopLocation.longitude || 0,
            orderInfo.deliveryLocation.latitude || 0,
            orderInfo.deliveryLocation.longitude || 0
          ),
          estimatedDistance: estimatedDistance,
          estimatedDuration: estimatedDuration,
          itemCount: itemCount,
          createdAt: orderData.createdAt,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          offerType: offerType,
          title: "🚴‍♂️ New Delivery Opportunity!",
          body: "New order available for pickup. Tap to accept and start earning!",
        };

        try {
          const id = env.RIDER_DISPATCH.idFromName("global-rider-dispatch");
          const stub = env.RIDER_DISPATCH.get(id);

          const response = await stub.fetch(
            new Request(`http://rider-dispatch/dispatch-order`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                order: orderForDispatch,
                targetRiders: [rider.id],
              }),
            })
          );

          if (response.ok) {
            const result = (await response.json()) as any;
            if (result.success && result.notifiedRiders > 0) {
              console.log(
                `✅ Real-time message sent to rider ${rider.id} for order ${orderId}`
              );
            } else {
              console.log(
                `⚠️ Rider ${rider.id} not connected to real-time system for order ${orderId}`
              );
            }
          } else {
            console.log(
              `⚠️ Failed to send real-time message to rider ${rider.id} for order ${orderId}`
            );
          }
        } catch (realtimeError) {
          console.log(
            `⚠️ Failed to send real-time notification to rider ${rider.id}:`,
            realtimeError
          );
        }
      } catch (error) {
        console.error(
          `❌ Failed to send notification to rider ${rider.id} for order ${orderId}:`,
          error
        );
      }
    }
  }

  /**
   * Notify riders that an order is no longer available
   * @param riders Array of riders to notify
   * @param orderId The order ID that was taken
   * @returns Promise<void>
   */
  public async notifyRidersOrderTaken(
    riders: RiderForNotification[],
    orderId: string
  ): Promise<void> {
    const db = createClient(env.DB);
    for (const rider of riders) {
      try {
        const pushNotificationService = new PushNotificationService();
        if (!rider.userId) {
          console.warn(
            `❌ Skipping rider ${rider.id} - no userId available for order-taken notification`
          );
          continue;
        }
        await pushNotificationService.sendNotificationToUser(rider.userId, {
          title: "Order No Longer Available",
          body: `The delivery opportunity for order #${orderId.slice(-6)} has been taken by another rider.`,
          data: {
            type: "order_taken",
            orderId: orderId,
            action: "view_available_orders",
            link: `/rider/orders/available`,
          },
          ttlSeconds: 600,
        });

        console.log(`✅ Order-taken notification sent to rider ${rider.id}`);
      } catch (error) {
        console.error(
          `❌ Failed to send order-taken notification to rider ${rider.id}:`,
          error
        );
      }
    }
  }
  /**
   * Enhanced dispatch method that uses the tiered system for fair rider distribution
   */
  public async dispatchOrderWithRealTime(
    orderId: string,
    env: any
  ): Promise<{
    success: boolean;
    notifiedRiders: number;
    dispatchMethod: "realtime" | "push_notification";
  }> {
    try {
      console.log(
        `🚀 [DISPATCH] Starting tiered dispatch for order ${orderId}`
      );

      // Use the tiered system directly instead of real-time "fastest wins"
      await this.findAndNotifyRiders(orderId, null);

      return {
        success: true,
        notifiedRiders: 1, // At minimum, tier 1 rider gets notified
        dispatchMethod: "push_notification",
      };
    } catch (error) {
      console.error(
        `❌ [DISPATCH] Failed to dispatch order ${orderId}:`,
        error
      );
      return {
        success: false,
        notifiedRiders: 0,
        dispatchMethod: "push_notification",
      };
    }
  }

  /**
   * Dispatch order via Durable Objects real-time system
   */ private async dispatchViaRealTime(
    env: any,
    order: any,
    targetRiders: string[]
  ): Promise<{ success: boolean; notifiedRiders: number }> {
    try {
      console.log(
        `🔥 [REALTIME-DISPATCH] Starting dispatch for order ${order.id} to ${targetRiders.length} riders:`,
        targetRiders
      );
      console.log(`🔥 [REALTIME-DISPATCH] Environment check:`, {
        hasRiderDispatch: !!env.RIDER_DISPATCH,
        hasIdFromName: !!env.RIDER_DISPATCH?.idFromName,
      });

      // Get the global rider dispatch Durable Object
      const id = env.RIDER_DISPATCH.idFromName("global-rider-dispatch");
      console.log(
        `🔥 [REALTIME-DISPATCH] Got Durable Object ID:`,
        id.toString()
      );

      const stub = env.RIDER_DISPATCH.get(id);
      console.log(`🔥 [REALTIME-DISPATCH] Got Durable Object stub`);

      const requestBody = {
        order,
        targetRiders,
      };
      console.log(
        `🔥 [REALTIME-DISPATCH] Sending request body:`,
        JSON.stringify(requestBody, null, 2)
      );
      const response = await stub.fetch(
        new Request(`http://rider-dispatch/dispatch-order`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        })
      );

      console.log(`🔥 [REALTIME-DISPATCH] Response status:`, response.status);
      console.log(`🔥 [REALTIME-DISPATCH] Response ok:`, response.ok);

      const result = (await response.json()) as any;
      console.log(`🔄 [REALTIME-DISPATCH] Result:`, result);

      return {
        success: result.success || false,
        notifiedRiders: result.notifiedRiders || 0,
      };
    } catch (error) {
      console.error(`❌ [REALTIME-DISPATCH] Error:`, error);
      throw error;
    }
  }

  /**
   * Get WebSocket connection URL for a rider
   */ public getWebSocketUrl(
    riderId: string,
    lat: number,
    lng: number,
    env: any
  ): string {
    // Convert HTTP/HTTPS to WS/WSS based on env.BASE_URL
    const baseUrl = env.BASE_URL?.startsWith("https://")
      ? env.BASE_URL.replace("https://", "wss://")
      : env.BASE_URL?.replace("http://", "ws://");

    const params = new URLSearchParams({
      riderId,
      lat: lat.toString(),
      lng: lng.toString(),
    });

    return `${baseUrl}/api/rider/ws?${params}`;
  }
  /**
   * Update rider status in the real-time system
   */
  public async updateRiderRealTimeStatus(
    env: any,
    riderId: string,
    update: {
      location?: { lat: number; lng: number };
      isAvailable?: boolean;
    }
  ): Promise<boolean> {
    try {
      const id = env.RIDER_DISPATCH.idFromName("global-rider-dispatch");
      const stub = env.RIDER_DISPATCH.get(id);

      let updateType = "status_update";
      if (update.location) {
        updateType = "location_update";
      }
      const response = await stub.fetch(
        new Request(`http://rider-dispatch/rider-status`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            riderId,
            type: updateType,
            data: update,
          }),
        })
      );

      const result = (await response.json()) as any;
      return result.success || false;
    } catch (error) {
      console.error(`❌ [REALTIME-STATUS] Error updating rider status:`, error);
      return false;
    }
  }

  private async notifyAdminsNoRiders(orderId: string): Promise<void> {
    try {
      const db = createClient(env.DB);
      const adminUsers = await db
        .select({ id: userTable.id, phoneNumber: userTable.phoneNumber })
        .from(userTable)
        .where(eq(userTable.role, "admin"));

      for (const admin of adminUsers) {
        const pushNotificationService = new PushNotificationService();
        await pushNotificationService.sendNotificationToUser(admin.id, {
          title: "🚨 No Riders Available",
          body: `Order #${orderId.slice(-6)} in Epe - No riders found. Manual assignment needed.`,
          data: {
            type: "no_riders_alert",
            category: "admin",
            urgency: "high",
            orderId: orderId,
            action: "view_order",
            link: `/superadmin/orders/${orderId}`,
            sound: "admin_alert.mp3",
          },
        });

        if (admin.phoneNumber) {
          await this.sendSMS(
            admin.phoneNumber,
            `Azumi Alert: Order #${orderId.slice(-6)} in Epe - No riders available. Check admin panel.`
          );
        }
      }
      console.log(`✅ Notified admins about no riders for order ${orderId}`);
    } catch (error) {
      console.error(`❌ Failed to notify admins about no riders:`, error);
    }
  }

  private async notifyAdminsNoResponse(orderId: string): Promise<void> {
    try {
      const db = createClient(env.DB);
      const adminUsers = await db
        .select({ id: userTable.id, phoneNumber: userTable.phoneNumber })
        .from(userTable)
        .where(eq(userTable.role, "admin"));

      for (const admin of adminUsers) {
        const pushNotificationService = new PushNotificationService();
        await pushNotificationService.sendNotificationToUser(admin.id, {
          title: "⏰ Riders Not Responding",
          body: `Order #${orderId.slice(-6)} - No rider response after 5 minutes. Check order status.`,
          data: {
            type: "no_response_alert",
            category: "admin",
            urgency: "high",
            orderId: orderId,
            action: "view_order",
            link: `/superadmin/orders/${orderId}`,
            sound: "admin_alert.mp3",
          },
        });
      }
      console.log(`✅ Notified admins about no response for order ${orderId}`);
    } catch (error) {
      console.error(`❌ Failed to notify admins about no response:`, error);
    }
  }

  private async sendSMSFallback(
    riders: RiderMetricInfo[],
    orderId: string,
    orderInfo: OrderInfo
  ): Promise<void> {
    const db = createClient(env.DB);

    for (const riderInfo of riders) {
      try {
        if (!riderInfo.rider.userId) continue;

        const user = await db.query.userTable.findFirst({
          where: eq(userTable.id, riderInfo.rider.userId),
          columns: { phoneNumber: true },
        });

        if (user?.phoneNumber) {
          const earnings = this.calculateRiderEarnings(
            orderInfo.shopLocation.latitude || 0,
            orderInfo.shopLocation.longitude || 0,
            orderInfo.deliveryLocation.latitude || 0,
            orderInfo.deliveryLocation.longitude || 0
          );

          await this.sendSMS(
            user.phoneNumber,
            `Azumi: New delivery order #${orderId.slice(-6)}. Earn ₦${earnings}. Check your app to accept. Reply STOP to opt out.`
          );

          console.log(`✅ SMS fallback sent to rider ${riderInfo.rider.id}`);
        }
      } catch (error) {
        console.error(
          `❌ Failed to send SMS to rider ${riderInfo.rider.id}:`,
          error
        );
      }
    }
  }

  private async sendSMS(phoneNumber: string, message: string): Promise<void> {
    try {
      const url = `${env.SENDCHAMP_LIVE_URL}/sms/send`;
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.SENDCHAMP_API_KEY}`,
      };
      const body = {
        to: phoneNumber.startsWith("0")
          ? `234${phoneNumber.slice(1)}`
          : phoneNumber,
        sender_name: "Azumi",
        message: message,
        route: "dnd",
      };

      const result = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      if (result.ok) {
        console.log(`✅ SMS sent successfully to ${phoneNumber}`);
      } else {
        console.log(`⚠️ SMS failed to ${phoneNumber}: ${result.statusText}`);
      }
    } catch (error) {
      console.error(`❌ SMS error to ${phoneNumber}:`, error);
    }
  }
}
