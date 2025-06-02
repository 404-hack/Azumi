import { Context } from "../lib/types";
import { and, eq, isNotNull, not, gte, lte } from "drizzle-orm";
import { orderTable, orderItemTable } from "../lib/db/schema/order.schema";
import { riderTable } from "../lib/db/schema/rider.schema";
import { shopTable } from "../lib/db/schema/shop.schema";
import { calculateDistance } from "../lib/utils/geo";
import { createClient } from "../lib/db";
import { env } from "cloudflare:workers";
import { PushNotificationService } from "./push-notification.service";

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
  private MAX_PICKUP_DISTANCE_KM = 5; // Maximum distance in km for pickup
  private AVG_SPEED_KM_H = 20; // Average rider speed in km/h
  private PRIMARY_RIDER_TIMEOUT_MS = 45 * 1000; // 45 seconds for the first rider (backend buffer)
  private SECONDARY_RIDER_TIMEOUT_MS = 60 * 1000; // 60 seconds for secondary batch
  private SECONDARY_BATCH_SIZE = 3; // Notify next 2-4 (using 3 as an example)

  constructor(private c?: Context) {
    // Context is now optional since we're using direct env access
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
   */
  public async findAndNotifyRiders(
    orderId: string,
    shopId: string | null | undefined
  ): Promise<void> {
    console.log(
      `RiderDispatchService: Initiating tiered rider search and notification for order ${orderId}.`
    );

    try {
      const { availableRiders, orderInfo } =
        await this.findAvailableRiders(orderId);

      if (!availableRiders || availableRiders.length === 0) {
        console.log(
          `RiderDispatchService: No available riders found for order ${orderId}.`
        );
        // TODO: Implement further escalation logic if no riders are found at all (e.g., alert admin, widen search)
        return;
      }

      console.log(
        `RiderDispatchService: Found ${availableRiders.length} potential riders for order ${orderId}.`
      ); // Tier 1: Notify the single best rider
      const primaryRiderInfo = availableRiders[0];
      if (primaryRiderInfo) {
        console.log(
          `RiderDispatchService: Tier 1 - Notifying primary rider ${primaryRiderInfo.rider.id} for order ${orderId}. Waiting ${this.PRIMARY_RIDER_TIMEOUT_MS / 1000}s...`
        );
        await this.sendNotificationsToRiders(
          [primaryRiderInfo.rider],
          orderId,
          shopId,
          "Tier 1 Offer"
        );

        // Wait for primary rider timeout
        await new Promise((resolve) =>
          setTimeout(resolve, this.PRIMARY_RIDER_TIMEOUT_MS)
        );

        // Check if order was accepted during the timeout
        const orderStillNeedsAssignment =
          await this.isOrderStillAvailable(orderId);

        if (!orderStillNeedsAssignment) {
          console.log(
            `RiderDispatchService: Order ${orderId} was accepted by primary rider ${primaryRiderInfo.rider.id}.`
          );
          return; // Stop the process
        }
        console.log(
          `RiderDispatchService: Tier 1 - Primary rider ${primaryRiderInfo.rider.id} did not accept order ${orderId} within ${this.PRIMARY_RIDER_TIMEOUT_MS / 1000}s timeframe.`
        );
      } else {
        console.log(
          `RiderDispatchService: No primary rider found for order ${orderId}, though availableRiders list was not empty. This shouldn't happen.`
        );
        return;
      }

      // Tier 2: Notify a small batch of the next best riders
      const secondaryRiders = availableRiders.slice(
        1,
        1 + this.SECONDARY_BATCH_SIZE
      );

      if (secondaryRiders.length > 0) {
        console.log(
          `RiderDispatchService: Tier 2 - Notifying secondary batch of ${secondaryRiders.length} riders for order ${orderId}. Waiting ${this.SECONDARY_RIDER_TIMEOUT_MS / 1000}s...`
        );
        await this.sendNotificationsToRiders(
          secondaryRiders.map((item) => item.rider),
          orderId,
          shopId,
          "Tier 2 Offer"
        );

        // Wait for secondary batch timeout
        await new Promise((resolve) =>
          setTimeout(resolve, this.SECONDARY_RIDER_TIMEOUT_MS)
        );

        // Check if order was accepted during the timeout
        const orderStillNeedsAssignmentTier2 =
          await this.isOrderStillAvailable(orderId);

        if (!orderStillNeedsAssignmentTier2) {
          console.log(
            `RiderDispatchService: Order ${orderId} was accepted by one of the secondary riders.`
          );
          return; // Stop the process
        }
        console.log(
          `RiderDispatchService: Tier 2 - No riders from secondary batch accepted order ${orderId} within ${this.SECONDARY_RIDER_TIMEOUT_MS / 1000}s timeframe.`
        );
      } else {
        console.log(
          `RiderDispatchService: Tier 2 - No more riders available for secondary batch for order ${orderId}.`
        );
      } // Tier 3: Final escalation stage
      console.log(
        `RiderDispatchService: Tier 3 - Reached final escalation stage for order ${orderId}. No riders accepted after all attempts.`
      );

      // TODO: Implement tier 3 escalation logic later
      console.log(
        `RiderDispatchService: Tier 3 - Order ${orderId} escalation handling to be implemented.`
      );
    } catch (error) {
      console.error(
        `RiderDispatchService: Exception during tiered rider search/notification for order ${orderId}:`,
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
          closestRiderWithMetrics.metrics.pickupDistanceKm;

        // Assign the closest rider
        const updatedOrder = await db
          .update(orderTable)
          .set({
            riderId: closestRider.userId,
            status: "RIDER_ASSIGNED",
          })
          .where(eq(orderTable.id, orderId))
          .returning()
          .get();

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
            type: "rider_assigned",
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
      }

      // Update order with rider assignment
      await db
        .update(orderTable)
        .set({
          riderId: rider.userId,
          status: "RIDER_ASSIGNED",
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
          type: "rider_assigned",
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
  }
  /**
   * Sends notifications to selected riders
   * @param riders Array of riders to notify
   * @param orderId The order ID
   * @param shopId The shop ID
   * @param offerType The type of offer (e.g., "Tier 1 Offer", "Tier 2 Offer")
   * @returns Promise<void>
   */
  private async sendNotificationsToRiders(
    riders: RiderForNotification[],
    orderId: string,
    shopId: string | null | undefined,
    offerType: string
  ): Promise<void> {
    const db = createClient(env.DB);

    for (const rider of riders) {
      console.log(
        `RiderDispatchService: [${offerType}] Sending notification to rider ${rider.id} (${rider.firstName} ${rider.lastName}) for order ${orderId}. Shop: ${shopId || "N/A"}.`
      );
      try {
        const pushNotificationService = new PushNotificationService();
        if (!rider.userId) {
          console.warn(`❌ Skipping rider ${rider.id} - no userId available`);
          continue;
        }
        await pushNotificationService.sendNotificationToUser(rider.userId, {
          title: "🚴‍♂️ New Delivery Opportunity!",
          body: `New order available for pickup. Tap to accept and start earning!`,
          data: {
            type: "delivery_opportunity",
            orderId: orderId,
            shopId: shopId || "",
            offerType: offerType.toLowerCase().replace(/\s+/g, "_"),
            action: "accept_delivery",
            link: `/rider/orders/${orderId}/accept`,
          },
        });

        console.log(
          `✅ Push notification sent to rider ${rider.id} for order ${orderId}`
        );
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
   * Enhanced dispatch method that uses Durable Objects for real-time notifications
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
        `🚀 [DISPATCH] Starting real-time dispatch for order ${orderId}`
      );
      console.log(
        `🔍 [DISPATCH] Finding available riders for order ${orderId}`
      );
      const { orderInfo, availableRiders } =
        await this.findAvailableRiders(orderId);
      console.log(
        `🔍 [DISPATCH] Found ${availableRiders.length} available riders`
      );

      if (availableRiders.length === 0) {
        console.log(
          `⚠️ [DISPATCH] No available riders found for order ${orderId}`
        );
        return {
          success: false,
          notifiedRiders: 0,
          dispatchMethod: "realtime",
        };
      }
      console.log(`🔍 [DISPATCH] Getting order details for dispatch...`);
      // Get order details for dispatch
      const db = createClient(env.DB);
      const order = await db.query.orderTable.findFirst({
        where: eq(orderTable.id, orderId),
      });
      console.log(`🔍 [DISPATCH] Order query completed`);

      if (!order) {
        throw new Error(`Order ${orderId} not found for dispatch`);
      }
      console.log(`🔍 [DISPATCH] Getting order items separately...`);
      // Get order items separately
      const orderItems = await db.query.orderItemTable.findMany({
        where: eq(orderItemTable.orderId, orderId),
      });
      console.log(`🔍 [DISPATCH] Order items query completed`);

      console.log(`🔍 [DISPATCH] Getting shop details separately...`);
      // Get shop details separately
      const shop = await db.query.shopTable.findFirst({
        where: eq(shopTable.id, order.shopId),
        columns: {
          name: true,
          address: true,
          latitude: true,
          longitude: true,
        },
      });
      console.log(`🔍 [DISPATCH] Shop query completed`);

      if (!shop) {
        throw new Error(`Shop not found for order ${orderId}`);
      }

      // Prepare order data for real-time dispatch
      const dispatchOrder = {
        id: orderId,
        shopId: order.shopId,
        pickupLocation: {
          lat: orderInfo.shopLocation.latitude || 0,
          lng: orderInfo.shopLocation.longitude || 0,
          address: shop.address || "Shop location",
        },
        deliveryLocation: {
          lat: orderInfo.deliveryLocation.latitude || 0,
          lng: orderInfo.deliveryLocation.longitude || 0,
          address: order.addressName || "Delivery location",
        },
        orderValue: order.total,
        deliveryFee: order.deliveryFee,
        itemCount: orderItems?.length || 0,
        estimatedDistance: availableRiders[0]?.metrics.totalDistanceKm || 0,
        estimatedDuration:
          availableRiders[0]?.metrics.estimatedTotalMinutes || 30,
      };

      // Try real-time dispatch via Durable Objects first
      try {
        const riderIds = availableRiders.map((r) => r.rider.id);
        const realTimeResult = await this.dispatchViaRealTime(
          env,
          dispatchOrder,
          riderIds
        );

        if (realTimeResult.success && realTimeResult.notifiedRiders > 0) {
          console.log(
            `✅ [DISPATCH] Real-time dispatch successful: ${realTimeResult.notifiedRiders} riders notified`
          );
          return {
            success: true,
            notifiedRiders: realTimeResult.notifiedRiders,
            dispatchMethod: "realtime",
          };
        }
      } catch (realTimeError) {
        console.error(
          `❌ [DISPATCH] Real-time dispatch failed:`,
          realTimeError
        );
      } // Fallback to push notifications
      console.log(
        `🔄 [DISPATCH] Falling back to push notifications for order ${orderId}`
      );
      await this.findAndNotifyRiders(orderId, order.shopId);

      return {
        success: true,
        notifiedRiders: 0,
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
        dispatchMethod: "realtime",
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
        new Request("https://rider-dispatch/dispatch-order", {
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
   */
  public getWebSocketUrl(
    riderId: string,
    lat: number,
    lng: number,
    env: any
  ): string {
    // In development, use localhost. In production, use the actual domain
    const baseUrl = env.CLIENT_URL?.includes("localhost")
      ? "ws://localhost:8787"
      : "wss://your-domain.com";

    const params = new URLSearchParams({
      riderId,
      lat: lat.toString(),
      lng: lng.toString(),
    });

    return `${baseUrl}/rider/ws?${params}`;
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
        new Request("https://rider-dispatch/rider-status", {
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
}
