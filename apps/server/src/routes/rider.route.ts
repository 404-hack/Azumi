import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { Context, CloudflareBindings } from "../lib/types"; // Added CloudflareBindings
import { riderTable } from "../lib/db/schema/rider.schema";
import { orderTable } from "../lib/db/schema/order.schema"; // Added orderTable
import { factory } from "../lib/factory";
import { eq, and, inArray } from "drizzle-orm";
import { z } from "zod";
import { env } from "cloudflare:workers"; // Added env

import riderAuthMiddleware from "../middlewares/riderAuth";
import {
  riderApplicationSchema, // Keep for backward compatibility
  createRiderSchema,
  updateRiderStatusSchema,
  updateLocationSchema,
} from "../lib/validation/rider.validation";

const riderRoute = factory
  .createApp()
  .use(riderAuthMiddleware)
  .post("/apply", zValidator("json", riderApplicationSchema), async (c) => {
    try {
      const db = c.get("db");
      const data = c.req.valid("json");
      const userId = c.get("userId");

      // Check if user already has a rider profile
      const existingRider = await db.query.riderTable.findFirst({
        where: eq(riderTable.id, userId),
      });

      if (existingRider) {
        return c.json({ error: "You are already registered as a rider" }, 400);
      }

      const rider = await db
        .insert(riderTable)
        .values({
          userId: userId, // Use the authenticated user's ID
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email, // Prefer user's email from auth
          address: data.address,
          longitude: data.longitude,
          latitude: data.latitude,
          vehicleType: data.vehicleType,
          vehicleLicense: data.vehicleLicense,
          isVerified: false,
        })
        .returning()
        .get();

      return c.json(
        { message: "Application submitted successfully", data: rider },
        201
      );
    } catch (error) {
      console.error("Error submitting application:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  })

  .get("/profile/:id", async (c) => {
    try {
      const db = c.get("db");
      const { id } = c.req.param();

      const rider = await db.query.riderTable.findFirst({
        where: eq(riderTable.id, id),
      });

      if (!rider) {
        return c.json({ error: "Rider not found" }, 404);
      }

      return c.json({ data: rider });
    } catch (error) {
      console.error("Error fetching rider:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  })
  .patch("/status", zValidator("json", updateRiderStatusSchema), async (c) => {
    try {
      const db = c.get("db");
      const userId = c.get("userId");
      const { status, latitude, longitude } = c.req.valid("json");

      const updatedRider = await db
        .update(riderTable)
        .set({
          availabilityStatus: status,
          longitude,
          latitude,
        })
        .where(eq(riderTable.id, userId))
        .returning()
        .get();

      return c.json({ data: updatedRider });
    } catch (error) {
      console.error("Error updating status:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  })
  .patch("/location", zValidator("json", updateLocationSchema), async (c) => {
    try {
      const db = c.get("db");
      const userId = c.get("userId");
      const { latitude, longitude } = c.req.valid("json");

      const updatedRider = await db
        .update(riderTable)
        .set({ latitude, longitude })
        .where(eq(riderTable.id, userId))
        .returning()
        .get();

      return c.json({ data: updatedRider });
    } catch (error) {
      console.error("Error updating location:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  })

  // WORKFLOW: Rider order management endpoints

  // Get active orders assigned to rider
  .get("/orders", async (c) => {
    try {
      const db = c.get("db");
      const userId = c.get("userId");

      // Get assigned orders for this rider
      const orders = await db.query.orderTable.findMany({
        where: (order) =>
          and(
            eq(order.riderId, userId),
            inArray(order.status, ["RIDER_ASSIGNED", "IN_TRANSIT"])
          ),
        with: {
          shop: {
            columns: {
              id: true,
              name: true,
              address: true,
              latitude: true,
              longitude: true,
              contactPhone: true,
            },
          },
        },
      });

      return c.json({ data: orders });
    } catch (error) {
      console.error("Error fetching rider orders:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  })

  // Accept or reject order assignment
  .post(
    "/orders/:orderId/accept", // Changed route to /accept and param to :orderId
    // zValidator("json", z.object({ accept: z.boolean() })), // No body needed for accept
    async (c: Context) => {
      try {
        const { orderId } = c.req.param();
        // const { accept } = c.req.valid("json"); // No longer needed
        const db = c.get("db");
        const userId = c.get("userId"); // This is the ID of the accepting rider
        const honoEnv = c.env as CloudflareBindings; // Renamed to honoEnv to avoid conflict with imported env

        // Atomically update the order to assign the rider and change status
        // This ensures only the first rider to accept gets the order.
        const result = await db
          .update(orderTable)
          .set({
            riderId: userId,
            status: "RIDER_ASSIGNED", // New status
            // Optionally set pickedUpAt: null if you want to clear it on re-assignment
          })
          .where(
            and(
              eq(orderTable.id, orderId),
              eq(orderTable.status, "READY") // Crucial: only assign if READY
              // eq(orderTable.riderId, null) // Ensure no rider is currently assigned - already handled by READY status
            )
          )
          .returning({
            id: orderTable.id,
            status: orderTable.status,
          })
          .get(); // Use .get() if you expect one row or null

        if (!result) {
          // This means the order was either not found, not in READY status,
          // or already assigned to another rider in a concurrent request.
          return c.json(
            {
              success: false,
              message:
                "Order not available for assignment. It might have been taken by another rider or is no longer in READY status.",
            },
            409 // Conflict
          );
        }

        console.log(
          `Rider ${userId} accepted and assigned to order ${orderId}`
        ); // WORKFLOW: Notify workflow that rider has been assigned
        try {
          const workflowInstance = await honoEnv.ORDER_WORKFLOW.get(result.id); // Use order ID as workflow instance ID
          if (workflowInstance) {
            await workflowInstance.sendEvent({
              type: "rider_assigned",
              payload: {
                orderId: result.id,
                riderId: userId,
                status: result.status, // Should be RIDER_ASSIGNED
                timestamp: new Date().toISOString(),
              },
            });
            console.log(
              `Sent rider_assigned event to workflow for order: ${result.id}`
            );
          } else {
            console.warn(
              `Workflow instance ${result.id} not found for order ${result.id} after rider assignment.`
            );
          }
        } catch (workflowError) {
          console.error(
            "Failed to notify workflow about rider assignment:",
            workflowError
          );
          // Even if workflow notification fails, the rider is assigned. Consider retry or logging.
        }

        // TODO: Notify other (e.g., 4) riders that this order is now taken.
        // This would involve looking up which riders were initially offered the order
        // (perhaps from a temporary cache or a related DB table if you store offers)
        // and sending them a push notification or WebSocket message.
        console.log(
          `RIDER_NOTIFICATION: Would notify other offered riders that order ${orderId} is now taken.`
        );

        return c.json({
          success: true,
          message: "Order accepted and assigned to you.",
          data: { orderId: result.id, status: result.status },
        });
      } catch (error) {
        console.error("Error processing rider order acceptance:", error);
        return c.json({ error: "Internal server error" }, 500);
      }
    }
  )

  // Mark order as picked up
  .post("/orders/:id/pickup", async (c: Context) => {
    try {
      const { id } = c.req.param();
      const db = c.get("db");
      const userId = c.get("userId");
      const honoEnv = c.env as CloudflareBindings; // Renamed to honoEnv

      // Verify this order is assigned to this rider
      const order = await db.query.orderTable.findFirst({
        where: and(
          eq(orderTable.id, id),
          eq(orderTable.riderId, userId),
          eq(orderTable.status, "RIDER_ASSIGNED") // Rider can only pickup if RIDER_ASSIGNED
        ),
      });

      if (!order) {
        return c.json(
          {
            error:
              "Order not found, not assigned to you, or not in RIDER_ASSIGNED status.",
          },
          404
        );
      }

      // Update order status to IN_TRANSIT
      const updatedOrder = await db
        .update(orderTable)
        .set({
          status: "IN_TRANSIT",
          pickedUpAt: new Date().toISOString(),
        })
        .where(eq(orderTable.id, id))
        .returning({
          id: orderTable.id,
          status: orderTable.status,
        })
        .get();

      console.log(`Rider ${userId} picked up order ${id}`);

      // WORKFLOW: Notify workflow about pickup
      if (updatedOrder) {
        try {
          const workflowInstance = await honoEnv.ORDER_WORKFLOW.get(id); // Use order ID as workflow instance ID
          if (workflowInstance) {
            await workflowInstance.sendEvent({
              type: "order_picked_up", // Event type for pickup
              payload: {
                orderId: id,
                riderId: userId,
                status: updatedOrder.status, // Should be IN_TRANSIT
                timestamp: new Date().toISOString(),
              },
            });
            console.log(
              `Sent order_picked_up event to workflow for order: ${id}`
            );
          } else {
            console.warn(
              `Workflow instance ${id} not found for order ${id} during pickup.`
            );
          }
        } catch (workflowError) {
          console.error(
            "Failed to notify workflow about order pickup:",
            workflowError
          );
        }
      }

      return c.json({ success: true, data: updatedOrder });
    } catch (error) {
      console.error("Error marking order as picked up:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  })
  // Confirm delivery with code
  .post(
    "/orders/:id/deliver",
    zValidator("json", z.object({ confirmationCode: z.number() })),
    async (c: Context) => {
      try {
        const { id } = c.req.param();
        const { confirmationCode } = c.req.valid("json");
        const db = c.get("db");
        const userId = c.get("userId");
        const honoEnv = c.env as CloudflareBindings; // Renamed to honoEnv

        // Verify order, rider, status, and confirmation code
        const order = await db.query.orderTable.findFirst({
          where: and(
            eq(orderTable.id, id),
            eq(orderTable.riderId, userId),
            eq(orderTable.status, "IN_TRANSIT"),
            eq(orderTable.riderConfirmationCode, confirmationCode)
          ),
        });

        if (!order) {
          // Try to find the order without checking the code to give a more specific error
          const orderWithoutCodeCheck = await db.query.orderTable.findFirst({
            where: and(
              eq(orderTable.id, id),
              eq(orderTable.riderId, userId),
              eq(orderTable.status, "IN_TRANSIT")
            ),
            columns: { riderConfirmationCode: true },
          });

          if (orderWithoutCodeCheck) {
            return c.json({ error: "Invalid confirmation code" }, 400);
          } else {
            return c.json(
              {
                error:
                  "Order not found, not assigned to you, or not in IN_TRANSIT status.",
              },
              404
            );
          }
        }

        // Update order status to DELIVERED
        const updatedOrder = await db
          .update(orderTable)
          .set({
            status: "DELIVERED",
            deliveredAt: new Date().toISOString(),
          })
          .where(eq(orderTable.id, id))
          .returning({
            id: orderTable.id,
            status: orderTable.status,
          })
          .get();

        console.log(`Rider ${userId} delivered order ${id}`);

        // WORKFLOW: Notify workflow about delivery
        if (updatedOrder) {
          try {
            const workflowInstance = await honoEnv.ORDER_WORKFLOW.get(id); // Use order ID as workflow instance ID
            if (workflowInstance) {
              await workflowInstance.sendEvent({
                type: "order_delivered", // Event type for delivery
                payload: {
                  orderId: id,
                  riderId: userId,
                  status: updatedOrder.status, // Should be DELIVERED
                  timestamp: new Date().toISOString(),
                },
              });
              console.log(
                `Sent order_delivered event to workflow for order: ${id}`
              );
            } else {
              console.warn(
                `Workflow instance ${id} not found for order ${id} during delivery.`
              );
            }
          } catch (workflowError) {
            console.error(
              "Failed to notify workflow about order delivery:",
              workflowError
            );
          }
        }

        return c.json({ success: true, data: updatedOrder });
      } catch (error) {
        console.error("Error confirming delivery:", error);
        return c.json({ error: "Internal server error" }, 500);
      }
    }
  );

export default riderRoute;
