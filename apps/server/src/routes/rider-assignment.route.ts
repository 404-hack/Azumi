import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { Context } from "../lib/types";
import { factory } from "../lib/factory";
import { and, eq, inArray, isNotNull, or, gt, lt } from "drizzle-orm";
import { orderTable } from "../lib/db/schema/order.schema";
import { riderTable } from "../lib/db/schema/rider.schema";
import { calculateDistance } from "../lib/utils/geo";
import { RiderDispatchService } from "../services/riderDispatch.service";

/**
 * This route is responsible for the rider assignment system
 * It contains endpoints for:
 * - Finding available riders for orders
 * - Assigning riders to orders
 * - Managing rider availability and assignments
 */
const riderAssignmentRoute = factory
  .createApp()
  // Admin middleware would be applied here

  // Find available riders for an order
  .get("/find-riders/:orderId", async (c) => {
    try {
      const { orderId } = c.req.param();
      const db = c.get("db");

      // Get the order with shop details
      const order = await db.query.orderTable.findFirst({
        where: eq(orderTable.id, orderId),
        columns: {
          id: true,
          shopId: true,
          latitude: true, // Delivery location
          longitude: true, // Delivery location
        },
        with: {
          shop: {
            columns: {
              latitude: true, // Shop location
              longitude: true, // Shop location
            },
          },
        },
      });

      if (!order) {
        return c.json({ error: "Order not found" }, 404);
      }

      if (!order.shop) {
        return c.json({ error: "Shop information not available" }, 404);
      }

      // Find available riders within radius of the shop
      // In a real implementation, this would use a more sophisticated geo-query
      // For now, we'll get all available riders and filter by distance
      const availableRiders = await db.query.riderTable.findMany({
        where: eq(riderTable.availabilityStatus, "AVAILABLE"),
        columns: {
          id: true,
          userId: true,
          firstName: true,
          lastName: true,
          latitude: true,
          longitude: true,
          vehicleType: true,
        },
      });

      // Filter riders by distance and calculate delivery metrics
      const MAX_PICKUP_DISTANCE_KM = 5; // Maximum distance in km for pickup

      const nearbyRiders = availableRiders
        .map((rider) => {
          // Calculate distance from rider to shop
          const pickupDistanceKm = calculateDistance(
            rider.latitude || 0,
            rider.longitude || 0,
            order.shop.latitude || 0,
            order.shop.longitude || 0
          );

          // Calculate distance from shop to delivery location
          const deliveryDistanceKm = calculateDistance(
            order.shop.latitude || 0,
            order.shop.longitude || 0,
            order.latitude || 0,
            order.longitude || 0
          );

          // Calculate estimated time based on distance and average speed
          const AVG_SPEED_KM_H = 20; // Average rider speed in km/h
          const estimatedPickupMinutes = Math.round(
            (pickupDistanceKm / AVG_SPEED_KM_H) * 60
          );
          const estimatedDeliveryMinutes = Math.round(
            (deliveryDistanceKm / AVG_SPEED_KM_H) * 60
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
          (item) => item.metrics.pickupDistanceKm <= MAX_PICKUP_DISTANCE_KM
        )
        .sort((a, b) => a.metrics.totalDistanceKm - b.metrics.totalDistanceKm);

      return c.json({
        data: {
          order: {
            id: order.id,
            shopLocation: {
              latitude: order.shop.latitude,
              longitude: order.shop.longitude,
            },
            deliveryLocation: {
              latitude: order.latitude,
              longitude: order.longitude,
            },
          },
          availableRiders: nearbyRiders,
        },
      });
    } catch (error) {
      console.error("Error finding available riders:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  })

  // Assign rider to order
  .post(
    "/assign-rider",
    zValidator(
      "json",
      z.object({
        orderId: z.string(),
        riderId: z.string(),
      })
    ),
    async (c) => {
      try {
        const { orderId, riderId } = c.req.valid("json");
        const db = c.get("db");

        // Verify order is in READY status
        const order = await db.query.orderTable.findFirst({
          where: and(
            eq(orderTable.id, orderId),
            eq(orderTable.status, "READY")
          ),
        });

        if (!order) {
          return c.json(
            { error: "Order not found or not in READY status" },
            404
          );
        }

        // Verify rider is available
        const rider = await db.query.riderTable.findFirst({
          where: and(
            eq(riderTable.id, riderId),
            eq(riderTable.availabilityStatus, "AVAILABLE")
          ),
        });

        if (!rider) {
          return c.json({ error: "Rider not found or not available" }, 404);
        }

        // Update order with rider assignment
        const updatedOrder = await db
          .update(orderTable)
          .set({ riderId: rider.userId })
          .where(eq(orderTable.id, orderId))
          .returning()
          .get();

        // Update rider status to BUSY
        await db
          .update(riderTable)
          .set({ availabilityStatus: "BUSY" })
          .where(eq(riderTable.id, riderId));

        console.log(`Assigned rider ${riderId} to order ${orderId}`);

        // WORKFLOW: Notify workflow about rider assignment
        try {
          const workflowInstance = await env.ORDER_WORKFLOW.get(orderId);
          await workflowInstance.resume({
            name: "rider_assigned",
            data: {
              orderId,
              riderId: rider.userId,
              timestamp: new Date().toISOString(),
              estimatedPickupTime: "15 minutes", // This would be calculated based on distance/timing
            },
          });
        } catch (workflowError) {
          console.error(
            "Failed to notify workflow about rider assignment:",
            workflowError
          );
        }

        return c.json({
          success: true,
          message: "Rider assigned successfully",
          data: updatedOrder,
        });
      } catch (error) {
        console.error("Error assigning rider:", error);
        return c.json({ error: "Internal server error" }, 500);
      }
    }
  )

  // Auto-assign rider system (would be triggered by a cron job or order READY event)
  .post("/auto-assign/:orderId", async (c) => {
    try {
      const { orderId } = c.req.param();
      const db = c.get("db");

      console.log(`Starting auto-assignment for order ${orderId}`);

      // Check if order is already assigned or not READY
      const order = await db.query.orderTable.findFirst({
        where: and(
          eq(orderTable.id, orderId),
          eq(orderTable.status, "READY"),
          isNotNull(orderTable.riderId).not()
        ),
        with: {
          shop: {
            columns: {
              latitude: true,
              longitude: true,
            },
          },
        },
      });

      if (!order) {
        return c.json(
          { error: "Order not found, not READY, or already has a rider" },
          404
        );
      }

      // Find available riders within reasonable distance
      const MAX_DISTANCE_KM = 5;
      const availableRiders = await db.query.riderTable.findMany({
        where: eq(riderTable.availabilityStatus, "AVAILABLE"),
      });

      if (availableRiders.length === 0) {
        console.log(`No available riders for order ${orderId}`);
        return c.json({ success: false, message: "No available riders" });
      }

      // Calculate distances and find closest rider
      let closestRider = null;
      let shortestDistance = Number.MAX_VALUE;

      for (const rider of availableRiders) {
        if (rider.latitude && rider.longitude) {
          const distance = calculateDistance(
            rider.latitude,
            rider.longitude,
            order.shop.latitude || 0,
            order.shop.longitude || 0
          );

          if (distance < shortestDistance && distance <= MAX_DISTANCE_KM) {
            shortestDistance = distance;
            closestRider = rider;
          }
        }
      }

      if (!closestRider) {
        console.log(
          `No riders within ${MAX_DISTANCE_KM}km for order ${orderId}`
        );
        return c.json({ success: false, message: "No riders within range" });
      }

      // Assign the closest rider
      const updatedOrder = await db
        .update(orderTable)
        .set({ riderId: closestRider.userId })
        .where(eq(orderTable.id, orderId))
        .returning()
        .get();

      // Update rider status
      await db
        .update(riderTable)
        .set({ availabilityStatus: "BUSY" })
        .where(eq(riderTable.id, closestRider.id));

      console.log(`Auto-assigned rider ${closestRider.id} to order ${orderId}`);

      // WORKFLOW: Notify workflow about rider assignment
      try {
        const workflowInstance = await env.ORDER_WORKFLOW.get(orderId);
        const estimatedPickupMinutes = Math.round((shortestDistance / 20) * 60); // Based on 20km/h avg speed

        await workflowInstance.resume({
          name: "rider_assigned",
          data: {
            orderId,
            riderId: closestRider.userId,
            timestamp: new Date().toISOString(),
            estimatedPickupTime: `${estimatedPickupMinutes} minutes`,
          },
        });
      } catch (workflowError) {
        console.error(
          "Failed to notify workflow about auto rider assignment:",
          workflowError
        );
      }

      return c.json({
        success: true,
        message: "Rider auto-assigned successfully",
        data: {
          order: updatedOrder,
          rider: closestRider,
          distance: `${shortestDistance.toFixed(2)} km`,
        },
      });
    } catch (error) {
      console.error("Error in auto-assign:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  })

  // Find and notify riders for an order
  .post("/notify-riders/:orderId", async (c) => {
    try {
      const { orderId } = c.req.param();
      const db = c.get("db");

      // Get the order to check if it's in READY state
      const order = await db.query.orderTable.findFirst({
        where: eq(orderTable.id, orderId),
        columns: {
          id: true,
          shopId: true,
          status: true,
          riderId: true,
        },
      });

      if (!order) {
        return c.json({ error: "Order not found" }, 404);
      }

      if (order.status !== "READY") {
        return c.json(
          {
            error: "Order must be in READY status to notify riders",
            currentStatus: order.status,
          },
          400
        );
      }

      if (order.riderId) {
        return c.json(
          {
            error: "Order already has an assigned rider",
            riderId: order.riderId,
          },
          400
        );
      }

      // Use the RiderDispatchService to find and notify riders
      const riderDispatch = new RiderDispatchService(c);

      // Execute in background to prevent blocking the response
      c.executionCtx.waitUntil(
        riderDispatch.findAndNotifyRiders(orderId, order.shopId)
      );

      return c.json({
        success: true,
        message: "Rider notification process initiated",
        data: {
          orderId,
          shopId: order.shopId,
        },
      });
    } catch (error) {
      console.error("Error in notify-riders:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  });

export default riderAssignmentRoute;

// Note: This file assumes a geo utility function
// This could be implemented like:
/*
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c;
}
*/
