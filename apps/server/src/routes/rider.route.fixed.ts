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
import { calculateDistance } from "../lib/utils/geo";

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

  // Order management endpoints
  .get("/orders", async (c) => {
    try {
      const db = c.get("db");
      const userId = c.get("userId");

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
              phoneNumber: true,
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

  // Get specific order details
  .get(
    "/orders/:id",
    zValidator("param", z.object({ id: z.string() })),
    async (c) => {
      try {
        const { id } = c.req.valid("param");
        const db = c.get("db");
        const userId = c.get("userId");

        const order = await db.query.orderTable.findFirst({
          where: and(eq(orderTable.id, id), eq(orderTable.riderId, userId)),
          with: {
            customer: {
              columns: {
                id: true,
                name: true,
                phoneNumber: true,
              },
            },
            shop: {
              columns: {
                id: true,
                name: true,
                address: true,
                latitude: true,
                longitude: true,
                phoneNumber: true,
              },
            },
            items: {
              with: {
                menuItem: {
                  columns: {
                    id: true,
                    name: true,
                    price: true,
                  },
                },
              },
            },
          },
        });

        if (!order) {
          return c.json(
            { error: "Order not found or not assigned to you" },
            404
          );
        }

        const orderDetails = {
          id: order.id,
          code: order.code,
          status: order.status,
          total: order.total,
          subtotal: order.subtotal,
          deliveryFee: order.deliveryFee,
          riderConfirmationCode: order.riderConfirmationCode,
          shop: {
            id: order.shop?.id || "",
            name: order.shop?.name || "",
            phone: order.shop?.phoneNumber || "",
            address: order.shop?.address || "",
            latitude: order.shop?.latitude || 0,
            longitude: order.shop?.longitude || 0,
          },
          customer: {
            id: order.customer?.id || "",
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
              total: item.totalPrice,
              specialInstructions: item.specialInstructions,
            })) || [],
          deliveryNotes: order.deliveryNotes,
          createdAt: order.createdAt,
        };

        return c.json({
          success: true,
          data: orderDetails,
        });
      } catch (error) {
        console.error("Error fetching order details:", error);
        return c.json(
          {
            success: false,
            message: "Failed to fetch order details",
          },
          500
        );
      }
    }
  )

  // Get current active delivery
  .get("/orders/current", async (c) => {
    try {
      const db = c.get("db");
      const userId = c.get("userId");

      const currentOrder = await db.query.orderTable.findFirst({
        where: and(
          eq(orderTable.riderId, userId),
          inArray(orderTable.status, ["RIDER_ASSIGNED", "IN_TRANSIT"])
        ),
        with: {
          customer: {
            columns: {
              id: true,
              name: true,
              phoneNumber: true,
            },
          },
          shop: {
            columns: {
              id: true,
              name: true,
              address: true,
              latitude: true,
              longitude: true,
              phoneNumber: true,
            },
          },
          items: true,
        },
        orderBy: desc(orderTable.createdAt),
      });

      if (!currentOrder) {
        return c.json({ data: null });
      }

      const orderDetails = {
        id: currentOrder.id,
        code: currentOrder.code,
        status: currentOrder.status,
        total: currentOrder.total,
        subtotal: currentOrder.subtotal,
        deliveryFee: currentOrder.deliveryFee,
        riderConfirmationCode: currentOrder.riderConfirmationCode,
        shop: {
          id: currentOrder.shop?.id || "",
          name: currentOrder.shop?.name || "",
          phone: currentOrder.shop?.phoneNumber || "",
          address: currentOrder.shop?.address || "",
          latitude: currentOrder.shop?.latitude || 0,
          longitude: currentOrder.shop?.longitude || 0,
        },
        customer: {
          id: currentOrder.customer?.id || "",
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
            total: item.totalPrice,
          })) || [],
        deliveryNotes: currentOrder.deliveryNotes,
        createdAt: currentOrder.createdAt,
      };

      return c.json({
        success: true,
        data: orderDetails,
      });
    } catch (error) {
      console.error("Error fetching current delivery:", error);
      return c.json(
        {
          success: false,
          message: "Failed to fetch current delivery",
        },
        500
      );
    }
  })

  // Get order history
  .get("/orders/history", async (c) => {
    try {
      const db = c.get("db");
      const userId = c.get("userId");
      const limit = parseInt(c.req.query("limit") || "20");

      const orderHistory = await db.query.orderTable.findMany({
        where: and(
          eq(orderTable.riderId, userId),
          eq(orderTable.status, "DELIVERED")
        ),
        with: {
          customer: {
            columns: {
              id: true,
              name: true,
              phoneNumber: true,
            },
          },
          shop: {
            columns: {
              id: true,
              name: true,
              address: true,
              phoneNumber: true,
            },
          },
        },
        orderBy: desc(orderTable.deliveredAt),
        limit,
      });

      const orders = orderHistory.map((order) => ({
        id: order.id,
        code: order.code,
        status: order.status,
        total: order.total,
        deliveryFee: order.deliveryFee,
        createdAt: order.createdAt,
        deliveredAt: order.deliveredAt,
        shop: {
          id: order.shop?.id || "",
          name: order.shop?.name || "",
          phone: order.shop?.phoneNumber || "",
          address: order.shop?.address || "",
        },
        customer: {
          id: order.customer?.id || "",
          name: order.customer?.name || "",
          phone: order.customer?.phoneNumber || "",
          address: order.addressName || "",
        },
      }));

      return c.json({
        success: true,
        data: { orders },
      });
    } catch (error) {
      console.error("Error fetching order history:", error);
      return c.json(
        {
          success: false,
          message: "Failed to fetch order history",
        },
        500
      );
    }
  })

  // Accept order endpoint
  .post("/orders/:orderId/accept", async (c) => {
    try {
      const db = c.get("db");
      const rider = c.get("rider");
      const userId = c.get("userId");
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

      if (order.riderId) {
        return c.json(
          { error: "Order already assigned to another rider" },
          409
        );
      }

      if (order.status !== "READY") {
        return c.json({ error: "Order is not ready for pickup" }, 400);
      }

      await db
        .update(orderTable)
        .set({
          riderId: userId,
          status: "RIDER_ASSIGNED",
          acceptedAt: new Date().toISOString(),
        })
        .where(eq(orderTable.id, orderId));

      return c.json({
        success: true,
        message: "Order accepted successfully",
      });
    } catch (error) {
      console.error("Error accepting order:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  })

  // Mark order as picked up
  .post("/orders/:id/pickup", async (c) => {
    try {
      const db = c.get("db");
      const userId = c.get("userId");
      const { id } = c.req.param();

      const order = await db.query.orderTable.findFirst({
        where: and(eq(orderTable.id, id), eq(orderTable.riderId, userId)),
      });

      if (!order) {
        return c.json({ error: "Order not found or not assigned to you" }, 404);
      }

      if (order.status !== "RIDER_ASSIGNED") {
        return c.json({ error: "Order is not ready for pickup" }, 400);
      }

      await db
        .update(orderTable)
        .set({
          status: "IN_TRANSIT",
          pickedUpAt: new Date().toISOString(),
        })
        .where(eq(orderTable.id, id));

      return c.json({
        success: true,
        message: "Order marked as picked up",
      });
    } catch (error) {
      console.error("Error marking order as picked up:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  })

  // Mark order as delivered
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
        const userId = c.get("userId");
        const { id } = c.req.param();
        const { confirmationCode } = c.req.valid("json");

        const order = await db.query.orderTable.findFirst({
          where: and(eq(orderTable.id, id), eq(orderTable.riderId, userId)),
        });

        if (!order) {
          return c.json(
            { error: "Order not found or not assigned to you" },
            404
          );
        }

        if (order.status !== "IN_TRANSIT") {
          return c.json({ error: "Order is not ready for delivery" }, 400);
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

        return c.json({
          success: true,
          message: "Order marked as delivered",
        });
      } catch (error) {
        console.error("Error marking order as delivered:", error);
        return c.json({ error: "Internal server error" }, 500);
      }
    }
  )

  // Payment methods
  .get("/banks", async (c) => {
    try {
      if (!env.PAYSTACK_SECRET_KEY) {
        return c.json(
          {
            success: false,
            message: "Payment service not configured",
          },
          500
        );
      }

      const response = await fetch(
        "https://api.paystack.co/bank?country=nigeria",
        {
          headers: {
            Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        return c.json(
          {
            success: false,
            message: "Failed to fetch bank list",
          },
          response.status
        );
      }

      const data: any = await response.json();

      if (data.status) {
        const banks = data.data
          .filter((bank: any) => bank.active)
          .map((bank: any) => ({
            id: bank.id,
            name: bank.name,
            code: bank.code,
          }));

        return c.json({ success: true, data: banks });
      } else {
        return c.json(
          {
            success: false,
            message: "Failed to process bank list",
          },
          400
        );
      }
    } catch (error) {
      console.error("Error fetching banks:", error);
      return c.json(
        {
          success: false,
          message: "Internal server error",
        },
        500
      );
    }
  })

  .post(
    "/verify-account",
    zValidator("json", riderVerifyAccountSchema),
    async (c) => {
      try {
        const { accountNumber, bankCode } = c.req.valid("json");

        if (!env.PAYSTACK_SECRET_KEY) {
          return c.json(
            {
              success: false,
              message: "Payment service not configured",
            },
            500
          );
        }

        const response = await fetch(
          `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
              "Content-Type": "application/json",
            },
          }
        );

        const data: any = await response.json();

        if (data.status) {
          return c.json({
            success: true,
            data: {
              accountName: data.data.account_name,
            },
          });
        } else {
          return c.json(
            {
              success: false,
              message: data.message || "Could not verify account",
            },
            400
          );
        }
      } catch (error) {
        console.error("Error verifying account:", error);
        return c.json(
          {
            success: false,
            message: "Internal server error",
          },
          500
        );
      }
    }
  )

  .post(
    "/payment-method",
    zValidator("json", createRiderPaymentMethodSchema),
    async (c) => {
      try {
        const db = c.get("db");
        const rider = c.get("rider");
        const data = c.req.valid("json");

        if (!rider) {
          return c.json({ error: "Rider not found" }, 404);
        }

        const existingPaymentMethod =
          await db.query.riderPaymentMethodTable.findFirst({
            where: eq(riderPaymentMethodTable.riderId, rider.id),
          });

        if (existingPaymentMethod) {
          return c.json(
            {
              error:
                "Rider already has a payment method. You can edit it instead.",
            },
            409
          );
        }

        if (!env.PAYSTACK_SECRET_KEY) {
          return c.json({ error: "Payment service not configured" }, 500);
        }

        let paystackRecipientCode;
        if (
          data.type === "BANK_TRANSFER" &&
          data.accountNumber &&
          data.bankCode
        ) {
          const response = await fetch(
            "https://api.paystack.co/transferrecipient",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                type: "nuban",
                name: data.accountName,
                account_number: data.accountNumber,
                bank_code: data.bankCode,
                currency: "NGN",
              }),
            }
          );

          const paystackData: any = await response.json();
          if (!paystackData.status || !paystackData.data?.recipient_code) {
            return c.json(
              {
                error: "Failed to create payment recipient",
                details: paystackData.message,
              },
              400
            );
          }

          paystackRecipientCode = paystackData.data.recipient_code;
        }

        const newPaymentMethod = await db
          .insert(riderPaymentMethodTable)
          .values({
            riderId: rider.id,
            type: data.type,
            accountNumber: data.accountNumber,
            accountName: data.accountName,
            bankName: data.bankName,
            bankCode: data.bankCode,
            paystackRecipientCode,
          })
          .returning()
          .get();

        return c.json(
          {
            message: "Payment method added successfully",
            data: newPaymentMethod,
          },
          201
        );
      } catch (error) {
        console.error("Error adding payment method:", error);
        return c.json({ error: "Internal server error" }, 500);
      }
    }
  )

  .get("/payment-method", async (c) => {
    try {
      const db = c.get("db");
      const rider = c.get("rider");

      if (!rider) {
        return c.json({ error: "Rider not found" }, 404);
      }

      const paymentMethod = await db.query.riderPaymentMethodTable.findFirst({
        where: eq(riderPaymentMethodTable.riderId, rider.id),
      });

      return c.json({
        success: true,
        data: paymentMethod,
      });
    } catch (error) {
      console.error("Error fetching payment method:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  })

  .put(
    "/payment-method",
    zValidator("json", updateRiderPaymentMethodSchema),
    async (c) => {
      try {
        const db = c.get("db");
        const rider = c.get("rider");
        const data = c.req.valid("json");

        if (!rider) {
          return c.json({ error: "Rider not found" }, 404);
        }

        const existingMethod = await db.query.riderPaymentMethodTable.findFirst(
          {
            where: eq(riderPaymentMethodTable.riderId, rider.id),
          }
        );

        if (!existingMethod) {
          return c.json({ error: "Payment method not found" }, 404);
        }

        const updatedMethod = await db
          .update(riderPaymentMethodTable)
          .set(data)
          .where(eq(riderPaymentMethodTable.riderId, rider.id))
          .returning()
          .get();

        return c.json({
          message: "Payment method updated successfully",
          data: updatedMethod,
        });
      } catch (error) {
        console.error("Error updating payment method:", error);
        return c.json({ error: "Internal server error" }, 500);
      }
    }
  )

  .delete("/payment-method", async (c) => {
    try {
      const db = c.get("db");
      const rider = c.get("rider");

      if (!rider) {
        return c.json({ error: "Rider not found" }, 404);
      }

      const existingMethod = await db.query.riderPaymentMethodTable.findFirst({
        where: eq(riderPaymentMethodTable.riderId, rider.id),
      });

      if (!existingMethod) {
        return c.json({ error: "Payment method not found" }, 404);
      }

      await db
        .delete(riderPaymentMethodTable)
        .where(eq(riderPaymentMethodTable.riderId, rider.id));

      return c.json({
        success: true,
        message: "Payment method deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting payment method:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  })

  .post("/request-verification", async (c) => {
    try {
      const db = c.get("db");
      const userId = c.get("userId");
      const rider = c.get("rider");

      if (!rider) {
        return c.json({ error: "Rider not found" }, 404);
      }

      const todoService = new RiderTodoService();
      const todoStatus = await todoService.getComputedTodos(userId, db);

      if (!todoStatus) {
        return c.json(
          {
            success: false,
            message: "Rider not found",
          },
          404
        );
      }

      const { todo } = todoStatus;
      const allTasksComplete =
        todo.personalInformationComplete &&
        todo.vehicleInformationComplete &&
        todo.paymentInformationComplete;

      if (!allTasksComplete) {
        return c.json(
          {
            success: false,
            message:
              "Please complete all required information before requesting verification.",
            data: todo,
          },
          400
        );
      }

      if (rider.applicationStatus === "APPROVED") {
        return c.json({
          success: true,
          message: "You are already approved as a rider.",
        });
      }

      if (rider.applicationStatus === "PENDING") {
        return c.json({
          success: true,
          message: "Your verification request is already pending review.",
        });
      }

      await db
        .update(riderTable)
        .set({ applicationStatus: "PENDING" })
        .where(eq(riderTable.id, rider.id));

      return c.json({
        success: true,
        message:
          "Verification request submitted successfully. Your application is now pending review.",
        data: {
          applicationStatus: "PENDING",
        },
      });
    } catch (error) {
      console.error("Error requesting verification:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  })

  // Dispatch endpoints
  .get(
    "/dispatch/connect",
    zValidator(
      "query",
      z.object({
        lat: z.string().transform((val) => parseFloat(val)),
        lng: z.string().transform((val) => parseFloat(val)),
      })
    ),
    async (c) => {
      const rider = c.get("rider");
      const { lat, lng } = c.req.valid("query");

      try {
        if (!rider || rider.applicationStatus !== "APPROVED") {
          return c.json({ error: "Rider not found or not approved" }, 404);
        }

        const riderDispatchService = new RiderDispatchService();
        const wsUrl = riderDispatchService.getWebSocketUrl(
          rider.id,
          lat,
          lng,
          c.env
        );

        return c.json({
          success: true,
          wsUrl,
          riderId: rider.id,
          message:
            "Use this WebSocket URL to connect to the real-time dispatch system",
        });
      } catch (error) {
        console.error("Error getting WebSocket connection info:", error);
        return c.json({ error: "Failed to get connection info" }, 500);
      }
    }
  )

  .get("/dispatch/orders", async (c) => {
    const db = c.get("db");
    const rider = c.get("rider");

    try {
      if (!rider) {
        return c.json({ error: "Rider not found" }, 404);
      }

      const availableOrders = await db
        .select({
          id: orderTable.id,
          shopId: orderTable.shopId,
          latitude: orderTable.latitude,
          longitude: orderTable.longitude,
          total: orderTable.total,
          deliveryFee: orderTable.deliveryFee,
          createdAt: orderTable.createdAt,
        })
        .from(orderTable)
        .where(and(eq(orderTable.status, "READY"), isNull(orderTable.riderId)))
        .orderBy(desc(orderTable.createdAt))
        .limit(20);

      const ordersWithDistance = availableOrders
        .map((order) => {
          const distance = calculateDistance(
            rider.currentLat || rider.latitude || 0,
            rider.currentLng || rider.longitude || 0,
            order.latitude || 0,
            order.longitude || 0
          );

          return {
            ...order,
            estimatedDistance: distance,
            estimatedDuration: Math.max(15, Math.round((distance / 25) * 60)),
          };
        })
        .filter((order) => order.estimatedDistance <= 10);

      return c.json({
        success: true,
        orders: ordersWithDistance,
        count: ordersWithDistance.length,
      });
    } catch (error) {
      console.error("Error fetching available orders:", error);
      return c.json({ error: "Failed to fetch available orders" }, 500);
    }
  });

export default riderRoute;
