import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { Context } from "../lib/types";
import {
  riderTable,
  riderPaymentMethodTable,
} from "../lib/db/schema/rider.schema";
import { orderTable } from "../lib/db/schema/order.schema";
import { factory } from "../lib/factory";
import { eq, and, inArray, desc, isNull } from "drizzle-orm";
import { z } from "zod";
import { env } from "cloudflare:workers";
import { PushNotificationService } from "../services/push-notification.service";
import { calculateDistance } from "../lib/utils/geo";

import riderAuthMiddleware from "../middlewares/riderAuth";
import { RiderTodoService } from "../services/riderTodo.service";
import {
  riderApplicationSchema,
  updateRiderStatusSchema,
  updateLocationSchema,
  updateRiderProfileSchema,
  riderVerifyAccountSchema,
  createRiderPaymentMethodSchema,
  updateRiderPaymentMethodSchema,
} from "../lib/validation/rider.validation";
import { RiderDispatchService } from "../services/riderDispatch.service";

const riderRoute = factory
  .createApp()
  .use(riderAuthMiddleware)

  .post("/apply", zValidator("json", riderApplicationSchema), async (c) => {
    try {
      const db = c.get("db");
      const data = c.req.valid("json");
      const userId = c.get("userId");

      const existingRider = await db.query.riderTable.findFirst({
        where: eq(riderTable.userId, userId),
      });

      if (existingRider) {
        return c.json({ error: "You are already registered as a rider" }, 409);
      }

      const rider = await db
        .insert(riderTable)
        .values({
          userId: userId,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          address: data.address,
          longitude: data.longitude,
          latitude: data.latitude,
          vehicleType: data.vehicleType,
          vehicleLicense: data.vehicleLicense,
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

  .get("/profile", async (c) => {
    try {
      const rider = c.get("rider");

      if (!rider) {
        return c.json({ error: "Rider not found" }, 404);
      }

      return c.json({ data: rider });
    } catch (error) {
      console.error("Error fetching rider profile:", error);
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
        .where(eq(riderTable.userId, userId))
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
        .where(eq(riderTable.userId, userId))
        .returning()
        .get();

      return c.json({ data: updatedRider });
    } catch (error) {
      console.error("Error updating location:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  })

  .patch(
    "/profile",
    zValidator("json", updateRiderProfileSchema),
    async (c) => {
      try {
        const db = c.get("db");
        const userId = c.get("userId");
        const data = c.req.valid("json");

        const updatedRider = await db
          .update(riderTable)
          .set(data)
          .where(eq(riderTable.userId, userId))
          .returning()
          .get();

        return c.json({
          message: "Profile updated successfully",
          data: updatedRider,
        });
      } catch (error) {
        console.error("Error updating profile:", error);
        return c.json({ error: "Internal server error" }, 500);
      }
    }
  )

  // ===== NEW MISSING ENDPOINTS =====

  .get("/orders", async (c) => {
    try {
      const db = c.get("db");
      const rider = c.get("rider");

      if (!rider) {
        return c.json({ error: "Rider not found" }, 404);
      }

      const orders = await db.query.orderTable.findMany({
        where: and(eq(orderTable.status, "READY"), isNull(orderTable.riderId)),
        with: {
          customer: true,
          shop: true,
          items: true,
        },
        orderBy: [desc(orderTable.createdAt)],
      });

      const formattedOrders = orders.map((order) => ({
        id: order.id,
        status: order.status,
        totalAmount: order.totalAmount,
        createdAt: order.createdAt,
        shop: {
          id: order.shop?.id || "",
          name: order.shop?.name || "",
          phone: order.shop?.phoneNumber || "",
          address: order.shop?.address || "",
          latitude: order.shop?.latitude || 0,
          longitude: order.shop?.longitude || 0,
        },
        customer: {
          name: order.customer?.name || "",
          phone: order.customer?.phoneNumber || "",
          address: order.addressName || "",
        },
        items:
          order.items?.map((item) => ({
            id: item.id,
            name: item.menuItemName,
            quantity: item.quantity,
            price: item.unitPrice,
          })) || [],
        deliveryNotes: order.deliveryNotes,
        riderConfirmationCode: order.riderConfirmationCode,
      }));

      return c.json({ data: formattedOrders });
    } catch (error) {
      console.error("Error fetching orders:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  })

  .get("/orders/:id", async (c) => {
    try {
      const db = c.get("db");
      const rider = c.get("rider");
      const { id } = c.req.param();

      if (!rider) {
        return c.json({ error: "Rider not found" }, 404);
      }

      const order = await db.query.orderTable.findFirst({
        where: eq(orderTable.id, id),
        with: {
          customer: true,
          shop: true,
          items: true,
        },
      });

      if (!order) {
        return c.json({ error: "Order not found" }, 404);
      }

      const formattedOrder = {
        id: order.id,
        status: order.status,
        totalAmount: order.totalAmount,
        createdAt: order.createdAt,
        shop: {
          id: order.shop?.id || "",
          name: order.shop?.name || "",
          phone: order.shop?.phoneNumber || "",
          address: order.shop?.address || "",
          latitude: order.shop?.latitude || 0,
          longitude: order.shop?.longitude || 0,
        },
        customer: {
          name: order.customer?.name || "",
          phone: order.customer?.phoneNumber || "",
          address: order.addressName || "",
        },
        items:
          order.items?.map((item) => ({
            id: item.id,
            name: item.menuItemName,
            quantity: item.quantity,
            price: item.unitPrice,
          })) || [],
        deliveryNotes: order.deliveryNotes,
        riderConfirmationCode: order.riderConfirmationCode,
      };

      return c.json({ data: formattedOrder });
    } catch (error) {
      console.error("Error fetching order details:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  })

  .post("/orders/:orderId/accept", async (c) => {
    try {
      const db = c.get("db");
      const rider = c.get("rider");
      const { orderId } = c.req.param();

      if (!rider) {
        return c.json({ error: "Rider not found" }, 404);
      }

      const order = await db.query.orderTable.findFirst({
        where: eq(orderTable.id, orderId),
      });

      if (!order) {
        return c.json({ error: "Order not found" }, 404);
      }

      if (order.status !== "READY") {
        return c.json({ error: "Order is not available for pickup" }, 400);
      }

      if (order.riderId) {
        return c.json(
          { error: "Order already assigned to another rider" },
          400
        );
      }

      const confirmationCode = Math.floor(1000 + Math.random() * 9000);

      await db
        .update(orderTable)
        .set({
          riderId: rider.userId,
          status: "RIDER_ASSIGNED",
          riderConfirmationCode: confirmationCode,
        })
        .where(eq(orderTable.id, orderId));

      return c.json({
        message: "Order accepted successfully",
        data: { orderId, confirmationCode },
      });
    } catch (error) {
      console.error("Error accepting order:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  })

  .get("/orders/current", async (c) => {
    try {
      const db = c.get("db");
      const rider = c.get("rider");

      if (!rider) {
        return c.json({ error: "Rider not found" }, 404);
      }

      const currentOrder = await db.query.orderTable.findFirst({
        where: and(
          eq(orderTable.riderId, rider.userId),
          inArray(orderTable.status, ["RIDER_ASSIGNED", "IN_TRANSIT"])
        ),
        with: {
          customer: true,
          shop: true,
          items: true,
        },
      });

      if (!currentOrder) {
        return c.json({ data: null });
      }

      const formattedOrder = {
        id: currentOrder.id,
        status: currentOrder.status,
        totalAmount: currentOrder.totalAmount,
        createdAt: currentOrder.createdAt,
        shop: {
          id: currentOrder.shop?.id || "",
          name: currentOrder.shop?.name || "",
          phone: currentOrder.shop?.phoneNumber || "",
          address: currentOrder.shop?.address || "",
          latitude: currentOrder.shop?.latitude || 0,
          longitude: currentOrder.shop?.longitude || 0,
        },
        customer: {
          name: currentOrder.customer?.name || "",
          phone: currentOrder.customer?.phoneNumber || "",
          address: currentOrder.addressName || "",
        },
        items:
          currentOrder.items?.map((item) => ({
            id: item.id,
            name: item.menuItemName,
            quantity: item.quantity,
            price: item.unitPrice,
          })) || [],
        deliveryNotes: currentOrder.deliveryNotes,
        riderConfirmationCode: currentOrder.riderConfirmationCode,
      };

      return c.json({ data: formattedOrder });
    } catch (error) {
      console.error("Error fetching current delivery:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  })

  .get("/orders/history", async (c) => {
    try {
      const db = c.get("db");
      const rider = c.get("rider");

      if (!rider) {
        return c.json({ error: "Rider not found" }, 404);
      }

      const orders = await db.query.orderTable.findMany({
        where: and(
          eq(orderTable.riderId, rider.userId),
          inArray(orderTable.status, ["COMPLETED", "DELIVERED"])
        ),
        with: {
          customer: true,
          shop: true,
        },
        orderBy: [desc(orderTable.completedAt)],
      });

      const formattedOrders = orders.map((order) => ({
        id: order.id,
        status: order.status,
        totalAmount: order.totalAmount,
        createdAt: order.createdAt,
        completedAt: order.completedAt,
        shop: {
          id: order.shop?.id || "",
          name: order.shop?.name || "",
          phone: order.shop?.phoneNumber || "",
          address: order.shop?.address || "",
        },
        customer: {
          name: order.customer?.name || "",
          phone: order.customer?.phoneNumber || "",
          address: order.addressName || "",
        },
      }));

      return c.json({ data: formattedOrders });
    } catch (error) {
      console.error("Error fetching order history:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  })

  .post("/orders/:id/pickup", async (c) => {
    try {
      const db = c.get("db");
      const rider = c.get("rider");
      const { id } = c.req.param();

      if (!rider) {
        return c.json({ error: "Rider not found" }, 404);
      }

      const order = await db.query.orderTable.findFirst({
        where: eq(orderTable.id, id),
      });

      if (!order) {
        return c.json({ error: "Order not found" }, 404);
      }

      if (order.riderId !== rider.userId) {
        return c.json({ error: "Order not assigned to you" }, 403);
      }

      if (order.status !== "RIDER_ASSIGNED") {
        return c.json({ error: "Order not ready for pickup" }, 400);
      }

      await db
        .update(orderTable)
        .set({
          status: "IN_TRANSIT",
          pickedUpAt: new Date().toISOString(),
        })
        .where(eq(orderTable.id, id));

      return c.json({ message: "Order picked up successfully" });
    } catch (error) {
      console.error("Error marking order as picked up:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  })

  .post(
    "/orders/:id/deliver",
    zValidator(
      "json",
      z.object({
        confirmationCode: z.number().optional(),
      })
    ),
    async (c) => {
      try {
        const db = c.get("db");
        const rider = c.get("rider");
        const { id } = c.req.param();
        const { confirmationCode } = c.req.valid("json");

        if (!rider) {
          return c.json({ error: "Rider not found" }, 404);
        }

        const order = await db.query.orderTable.findFirst({
          where: eq(orderTable.id, id),
        });

        if (!order) {
          return c.json({ error: "Order not found" }, 404);
        }

        if (order.riderId !== rider.userId) {
          return c.json({ error: "Order not assigned to you" }, 403);
        }

        if (order.status !== "IN_TRANSIT") {
          return c.json({ error: "Order not in transit" }, 400);
        }

        if (
          confirmationCode &&
          order.riderConfirmationCode !== confirmationCode
        ) {
          return c.json({ error: "Invalid confirmation code" }, 400);
        }

        await db
          .update(orderTable)
          .set({
            status: "DELIVERED",
            deliveredAt: new Date().toISOString(),
          })
          .where(eq(orderTable.id, id));

        return c.json({ message: "Order delivered successfully" });
      } catch (error) {
        console.error("Error marking order as delivered:", error);
        return c.json({ error: "Internal server error" }, 500);
      }
    }
  );

export default riderRoute;
