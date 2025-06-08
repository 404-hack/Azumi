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
      const userId = c.get("userId"); // Check if user already has a rider profile
      const existingRider = await db.query.riderTable.findFirst({
        where: eq(riderTable.userId, userId),
      });

      if (existingRider) {
        console.log("the error is from an existing rider");
        return c.json({ error: "You are already registered as a rider" }, 409);
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
      const db = c.get("db");
      const userId = c.get("userId");

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
          .set(data) // data directly matches the schema now
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
  .get("/orders/:id", async (c) => {
    try {
      const { id } = c.req.param();
      const db = c.get("db");
      const userId = c.get("userId");

      const order = await db.query.orderTable.findFirst({
        where: and(
          eq(orderTable.id, id),
          eq(orderTable.riderId, userId)
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
          orderItems: {
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
        return c.json({ error: "Order not found or not assigned to you" }, 404);
      }      // Transform to match frontend interface
      const orderDetails = {
        id: order.id,
        orderNumber: order.id.slice(-6),
        status: order.status,
        total: order.total,
        deliveryFee: order.deliveryFee,
        createdAt: order.createdAt,
        riderConfirmationCode: order.riderConfirmationCode,
        pickupLocation: {
          address: order.shop?.address || '',
          latitude: order.shop?.latitude || 0,
          longitude: order.shop?.longitude || 0,
        },
        deliveryLocation: {
          address: order.deliveryAddress || '',
          latitude: order.latitude || 0,
          longitude: order.longitude || 0,
        },
        shop: {
          id: order.shop?.id || '',
          name: order.shop?.name || '',
          phone: order.shop?.phoneNumber || '',
          address: order.shop?.address || '',
        },
        customer: {
          name: order.customerName || '',
          phone: order.customerPhone || '',
        },
        items: order.orderItems?.map(item => ({
          id: item.menuItem?.id || '',
          name: item.menuItem?.name || '',
          quantity: item.quantity,
          price: item.menuItem?.price || 0,
          specialInstructions: item.specialInstructions,
        })) || [],
        estimatedDistance: 0, // Calculate if needed
        estimatedDuration: 0, // Calculate if needed
        specialInstructions: order.specialInstructions,
      };

      return c.json(orderDetails);
    } catch (error) {
      console.error("Error fetching order details:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  })

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
        orderBy: desc(orderTable.createdAt),
      });

      if (!currentOrder) {
        return c.json({ error: "No active delivery found" }, 404);
      }      // Transform to match frontend interface
      const orderDetails = {
        id: currentOrder.id,
        orderNumber: currentOrder.id.slice(-6),
        status: currentOrder.status,
        total: currentOrder.total,
        deliveryFee: currentOrder.deliveryFee,
        createdAt: currentOrder.createdAt,
        riderConfirmationCode: currentOrder.riderConfirmationCode,
        pickupLocation: {
          address: currentOrder.shop?.address || '',
          latitude: currentOrder.shop?.latitude || 0,
          longitude: currentOrder.shop?.longitude || 0,
        },
        deliveryLocation: {
          address: currentOrder.deliveryAddress || '',
          latitude: currentOrder.latitude || 0,
          longitude: currentOrder.longitude || 0,
        },
        shop: {
          id: currentOrder.shop?.id || '',
          name: currentOrder.shop?.name || '',
          phone: currentOrder.shop?.phoneNumber || '',
          address: currentOrder.shop?.address || '',
        },
        customer: {
          name: currentOrder.customerName || '',
          phone: currentOrder.customerPhone || '',
        },
        estimatedDistance: 0,
        estimatedDuration: 0,
        specialInstructions: currentOrder.specialInstructions,
      };

      return c.json(orderDetails);
    } catch (error) {
      console.error("Error fetching current delivery:", error);
      return c.json({ error: "Internal server error" }, 500);
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

      const orders = orderHistory.map(order => ({
        id: order.id,
        orderNumber: order.id.slice(-6),
        status: order.status,
        total: order.total,
        deliveryFee: order.deliveryFee,
        createdAt: order.createdAt,
        deliveredAt: order.deliveredAt,
        shop: {
          id: order.shop?.id || '',
          name: order.shop?.name || '',
          phone: order.shop?.phoneNumber || '',
          address: order.shop?.address || '',
        },
        customer: {
          name: order.customerName || '',
          phone: order.customerPhone || '',
        },
      }));

      return c.json({ orders });
    } catch (error) {
      console.error("Error fetching order history:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  })

  // Get specific order details by ID
  .get("/orders/:id", async (c) => {
    try {
      const { id } = c.req.param();
      const db = c.get("db");
      const userId = c.get("userId");

      const order = await db.query.orderTable.findFirst({
        where: and(
          eq(orderTable.id, id),
          eq(orderTable.riderId, userId)
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
          user: {
            columns: {
              firstName: true,
              lastName: true,
              phoneNumber: true,
            },
          },
          orderItems: {
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
        return c.json({ error: "Order not found or not assigned to you" }, 404);
      }

      // Transform to match frontend interface
      const orderDetails = {
        id: order.id,
        orderNumber: order.id.slice(-6),
        status: order.status,
        total: order.total,
        deliveryFee: order.deliveryFee || 0,
        createdAt: order.createdAt,
        pickupLocation: {
          address: order.shop?.address || '',
          latitude: order.shop?.latitude || 0,
          longitude: order.shop?.longitude || 0,
        },
        deliveryLocation: {
          address: order.address || '',
          latitude: order.latitude || 0,
          longitude: order.longitude || 0,
        },
        shop: {
          id: order.shop?.id || '',
          name: order.shop?.name || '',
          phone: order.shop?.phoneNumber || '',
          address: order.shop?.address || '',
        },
        customer: {
          name: `${order.user?.firstName || ''} ${order.user?.lastName || ''}`.trim(),
          phone: order.user?.phoneNumber || '',
        },
        items: order.orderItems?.map(item => ({
          id: item.menuItem?.id || '',
          name: item.menuItem?.name || '',
          quantity: item.quantity,
          price: item.menuItem?.price || 0,
          specialInstructions: item.specialInstructions,
        })) || [],
        estimatedDistance: 0, // Calculate if needed
        estimatedDuration: 30, // Default 30 minutes
        specialInstructions: order.specialInstructions,
      };

      return c.json({ data: orderDetails });
    } catch (error) {
      console.error("Error fetching order details:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  })

  // Get current active delivery
  .get("/orders/current", async (c) => {
    try {
      const db = c.get("db");
      const userId = c.get("userId");

      const order = await db.query.orderTable.findFirst({
        where: and(
          eq(orderTable.riderId, userId),
          inArray(orderTable.status, ["RIDER_ASSIGNED", "IN_TRANSIT"])
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
          user: {
            columns: {
              firstName: true,
              lastName: true,
              phoneNumber: true,
            },
          },
          orderItems: {
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
        orderBy: desc(orderTable.createdAt),
      });

      if (!order) {
        return c.json({ data: null });
      }

      // Transform to match frontend interface
      const orderDetails = {
        id: order.id,
        orderNumber: order.id.slice(-6),
        status: order.status,
        total: order.total,
        deliveryFee: order.deliveryFee || 0,
        createdAt: order.createdAt,
        pickupLocation: {
          address: order.shop?.address || '',
          latitude: order.shop?.latitude || 0,
          longitude: order.shop?.longitude || 0,
        },
        deliveryLocation: {
          address: order.address || '',
          latitude: order.latitude || 0,
          longitude: order.longitude || 0,
        },
        shop: {
          id: order.shop?.id || '',
          name: order.shop?.name || '',
          phone: order.shop?.phoneNumber || '',
          address: order.shop?.address || '',
        },
        customer: {
          name: `${order.user?.firstName || ''} ${order.user?.lastName || ''}`.trim(),
          phone: order.user?.phoneNumber || '',
        },
        items: order.orderItems?.map(item => ({
          id: item.menuItem?.id || '',
          name: item.menuItem?.name || '',
          quantity: item.quantity,
          price: item.menuItem?.price || 0,
          specialInstructions: item.specialInstructions,
        })) || [],
        estimatedDistance: 0,
        estimatedDuration: 30,
        specialInstructions: order.specialInstructions,
      };

      return c.json({ data: orderDetails });
    } catch (error) {
      console.error("Error fetching current delivery:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  })

  // Get order history
  .get("/orders/history", async (c) => {
    try {
      const db = c.get("db");
      const userId = c.get("userId");
      const limit = parseInt(c.req.query("limit") || "20");

      const orders = await db.query.orderTable.findMany({
        where: and(
          eq(orderTable.riderId, userId),
          eq(orderTable.status, "DELIVERED")
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
          user: {
            columns: {
              firstName: true,
              lastName: true,
              phoneNumber: true,
            },
          },
          orderItems: {
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
        orderBy: desc(orderTable.deliveredAt),
        limit,
      });

      const orderHistory = orders.map(order => ({
        id: order.id,
        orderNumber: order.id.slice(-6),
        status: order.status,
        total: order.total,
        deliveryFee: order.deliveryFee || 0,
        createdAt: order.createdAt,
        deliveredAt: order.deliveredAt,
        pickupLocation: {
          address: order.shop?.address || '',
          latitude: order.shop?.latitude || 0,
          longitude: order.shop?.longitude || 0,
        },
        deliveryLocation: {
          address: order.address || '',
          latitude: order.latitude || 0,
          longitude: order.longitude || 0,
        },
        shop: {
          id: order.shop?.id || '',
          name: order.shop?.name || '',
          phone: order.shop?.phoneNumber || '',
          address: order.shop?.address || '',
        },
        customer: {
          name: `${order.user?.firstName || ''} ${order.user?.lastName || ''}`.trim(),
          phone: order.user?.phoneNumber || '',
        },
        items: order.orderItems?.map(item => ({
          id: item.menuItem?.id || '',
          name: item.menuItem?.name || '',
          quantity: item.quantity,
          price: item.menuItem?.price || 0,
          specialInstructions: item.specialInstructions,
        })) || [],
        estimatedDistance: 0,
        estimatedDuration: 30,
        specialInstructions: order.specialInstructions,
      }));

      return c.json({ data: { orders: orderHistory } });
    } catch (error) {
      console.error("Error fetching order history:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  })

  // ===== PAYMENT & BANKING ROUTES =====

  // Get banks list from Paystack
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
        const errorData = await response.json();
        return c.json(
          {
            success: false,
            message: "Failed to fetch bank list",
            details: errorData.message,
          },
          response.status
        );
      }

      const data = await response.json();

      // Format banks data to match vendor route structure
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

  // Verify bank account
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

        // Call Paystack to verify the account
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

        const data = await response.json();

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

  // Create new payment method
  .post(
    "/payment-method",
    zValidator("json", createRiderPaymentMethodSchema),
    async (c) => {
      try {
        const db = c.get("db");
        const userId = c.get("userId");
        const data = c.req.valid("json");

        // Get the rider's ID from the riders table
        const rider = c.get("rider");

        // Check if rider already has a payment method
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

        // Check if we have the Paystack key before proceeding with recipient creation
        if (!env.PAYSTACK_SECRET_KEY) {
          return c.json({ error: "Payment service not configured" }, 500);
        }

        // Create Paystack recipient for the bank account
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

          const paystackData = await response.json();
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
        } // Insert the payment method into the database
        const newPaymentMethod = await db
          .insert(riderPaymentMethodTable)
          .values({
            riderId: rider.id, // Using the correct rider ID from context
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
      const userId = c.get("userId");
      const rider = c.get("rider");
      const paymentMethod = await db.query.riderPaymentMethodTable.findFirst({
        // Changed to findFirst
        where: eq(riderPaymentMethodTable.riderId, rider.id),
      });

      return c.json({
        success: true,
        data: paymentMethod, // Return single object or null
      });
    } catch (error) {
      console.error("Error fetching payment method:", error); // Updated log message
      return c.json({ error: "Internal server error" }, 500);
    }
  })

  .put(
    "/payment-method", // Changed route to not include :id
    zValidator("json", updateRiderPaymentMethodSchema),
    async (c) => {
      try {
        const db = c.get("db");
        const userId = c.get("userId");
        const rider = c.get("rider");
        const data = c.req.valid("json");

        // Check if payment method exists and belongs to this rider
        const existingMethod = await db.query.riderPaymentMethodTable.findFirst(
          {
            where: eq(riderPaymentMethodTable.riderId, rider.id),
          }
        );

        if (!existingMethod) {
          return c.json({ error: "Payment method not found" }, 404);
        }

        // Update the payment method
        const updatedMethod = await db
          .update(riderPaymentMethodTable)
          .set(data)
          .where(
            eq(riderPaymentMethodTable.riderId, rider.id) // Use riderId to update
          )
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
    // Changed route to not include :id
    try {
      const db = c.get("db");
      const userId = c.get("userId"); // Check if payment method exists and belongs to this rider
      const rider = c.get("rider");
      const existingMethod = await db.query.riderPaymentMethodTable.findFirst({
        where: eq(riderPaymentMethodTable.riderId, rider.id),
      });

      if (!existingMethod) {
        return c.json({ error: "Payment method not found" }, 404);
      }

      await db
        .delete(riderPaymentMethodTable)
        .where(eq(riderPaymentMethodTable.riderId, rider.id)); // Use riderId to delete

      return c.json({
        success: true,
        message: "Payment method deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting payment method:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  })
  // Request verification (move from DRAFT to PENDING)
  .post("/request-verification", async (c) => {
    try {
      const db = c.get("db");
      const userId = c.get("userId");
      const rider = c.get("rider"); // Get the rider from context for consistency

      // Log the rider info to ensure we have correct data
      console.log("Requesting verification for rider:", rider.id);

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

      // We already have the rider object from context, no need to query again
      const riderId = rider.id;

      // For debugging
      console.log("Rider application status:", rider.applicationStatus);

      // Check if rider exists - this is redundant since we have rider from context,
      // but keeping it for safety
      if (!riderId) {
        return c.json(
          {
            success: false,
            message: "Rider not found",
          },
          404
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

      // Update the rider status to PENDING
      console.log("Updating rider status to PENDING for rider:", riderId);

      await db
        .update(riderTable)
        .set({ applicationStatus: "PENDING" })
        .where(eq(riderTable.id, riderId));

      // Get the updated rider to confirm changes were applied
      const updatedRider = await db.query.riderTable.findFirst({
        where: eq(riderTable.id, riderId),
        columns: { applicationStatus: true },
      });

      console.log(
        "Rider status after update:",
        updatedRider?.applicationStatus
      );

      return c.json({
        success: true,
        message:
          "Verification request submitted successfully. Your application is now pending review.",
        data: {
          applicationStatus: updatedRider?.applicationStatus || "PENDING",
        },
      });
    } catch (error) {
      console.error("Error requesting verification:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  })
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
            estimatedDuration: Math.max(15, Math.round((distance / 25) * 60)), // 25km/h average speed
          };
        })
        .filter((order) => order.estimatedDistance <= 10); // Within 10km

      return c.json({
        success: true,
        orders: ordersWithDistance,
        count: ordersWithDistance.length,
      });
    } catch (error) {
      console.error("Error fetching available orders:", error);
      return c.json({ error: "Failed to fetch available orders" }, 500);
    }
  })
  .post(
    "/dispatch/update-location",
    zValidator(
      "json",
      z.object({
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
        syncToDb: z.boolean().optional().default(false),
      })
    ),
    async (c) => {
      const db = c.get("db");
      const rider = c.get("rider");
      const { lat, lng, syncToDb } = c.req.valid("json");

      try {
        const riderDispatchService = new RiderDispatchService();
        await riderDispatchService.updateRiderRealTimeStatus(c.env, rider.id, {
          location: { lat, lng },
        });

        if (syncToDb) {
          await db
            .update(riderTable)
            .set({
              currentLat: lat,
              currentLng: lng,
            })
            .where(eq(riderTable.id, rider.id));
        }

        return c.json({
          success: true,
          message: "Location updated successfully",
          syncedToDb: syncToDb,
        });
      } catch (error) {
        console.error("Error updating rider location:", error);
        return c.json({ error: "Failed to update location" }, 500);
      }
    }
  )
  .post(
    "/dispatch/update-status",
    zValidator(
      "json",
      z.object({
        isAvailable: z.boolean().optional(),
        availabilityStatus: z.enum(["AVAILABLE", "BUSY", "OFFLINE"]).optional(),
      })
    ),
    async (c) => {
      const db = c.get("db");
      const rider = c.get("rider");
      const riderId = rider?.id;

      if (!riderId) {
        return c.json({ error: "Rider not found" }, 404);
      }

      const { isAvailable, availabilityStatus } = c.req.valid("json");

      try {
        const updateData: any = {};

        if (availabilityStatus !== undefined) {
          updateData.availabilityStatus = availabilityStatus;
        } else if (isAvailable !== undefined) {
          updateData.availabilityStatus = isAvailable ? "AVAILABLE" : "OFFLINE";
        }

        if (Object.keys(updateData).length > 0) {
          await db
            .update(riderTable)
            .set(updateData)
            .where(eq(riderTable.id, riderId));
        }

        const updatedRider = await db.query.riderTable.findFirst({
          where: eq(riderTable.id, riderId),
        });

        if (updatedRider) {
          const riderDispatchService = new RiderDispatchService();
          await riderDispatchService.updateRiderRealTimeStatus(c.env, riderId, {
            isAvailable: updatedRider.availabilityStatus === "AVAILABLE",
          });
        }

        return c.json({
          success: true,
          message: "Status updated successfully",
          availabilityStatus: updateData.availabilityStatus,
        });
      } catch (error) {
        console.error("Error updating rider status:", error);
        return c.json({ error: "Failed to update status" }, 500);
      }
    }
  )
  .post("/dispatch/accept-order/:orderId", async (c) => {
    const db = c.get("db");
    const rider = c.get("rider");
    const riderId = rider?.id;
    const userId = rider?.userId;
    const orderId = c.req.param("orderId");

    if (!riderId || !userId) {
      return c.json({ error: "Rider not found" }, 404);
    }

    try {
      const order = await db.query.orderTable.findFirst({
        where: and(
          eq(orderTable.id, orderId),
          eq(orderTable.status, "READY"),
          isNull(orderTable.riderId)
        ),
      });

      if (!order) {
        return c.json({ error: "Order not available for pickup" }, 404);
      }
      await db
        .update(orderTable)
        .set({
          riderId: userId,
          status: "RIDER_ASSIGNED",
        })
        .where(eq(orderTable.id, orderId));

      await db
        .update(riderTable)
        .set({
          currentOrderId: orderId,
        })
        .where(eq(riderTable.id, riderId));

      // Update dispatch service
      const riderDispatchService = new RiderDispatchService();
      await riderDispatchService.updateRiderRealTimeStatus(c.env, riderId, {
        isAvailable: false,
      });

      return c.json({
        success: true,
        message: "Order accepted successfully",
        orderId,
      });
    } catch (error) {
      console.error("Error accepting order:", error);
      return c.json({ error: "Failed to accept order" }, 500);
    }
  })
  .get("/ws", async (c) => {
    // WebSocket endpoint - this will be handled by the Durable Object
    const rider = c.get("rider");
    const riderId = rider?.id;
    const lat = parseFloat(c.req.query("lat") || "0");
    const lng = parseFloat(c.req.query("lng") || "0");

    if (!riderId) {
      return new Response("Missing riderId", { status: 400 });
    }

    // Check if this is a WebSocket upgrade request
    const upgradeHeader = c.req.header("upgrade");
    if (upgradeHeader !== "websocket") {
      return new Response("Expected WebSocket upgrade", { status: 426 });
    }

    // Forward to Durable Object with all original headers preserved
    const id = (c.env as any).RIDER_DISPATCH.idFromName(
      "global-rider-dispatch"
    );
    const stub = (c.env as any).RIDER_DISPATCH.get(id);

    const url = new URL(c.req.url);
    url.pathname = "/connect";
    url.searchParams.set("riderId", riderId);
    url.searchParams.set("lat", lat.toString());
    url.searchParams.set("lng", lng.toString());

    // Create a new request with all the original headers (including WebSocket headers)
    const request = new Request(url.toString(), {
      method: c.req.method,
      headers: c.req.raw.headers,
    });

    return stub.fetch(request);
  });
export default riderRoute;
