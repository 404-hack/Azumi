import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { Context } from "../lib/types";
import {
  riderTable,
  riderPaymentMethodTable,
} from "../lib/db/schema/rider.schema";
import { orderTable } from "../lib/db/schema/order.schema";
import { factory } from "../lib/factory";
import { eq, and, inArray, desc } from "drizzle-orm";
import { z } from "zod";
import { env } from "cloudflare:workers";
import { PushNotificationService } from "../services/push-notification.service";

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
        const honoEnv = env;

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
        } // Notify other riders that this order is now taken
        try {
          const riderDispatch = new RiderDispatchService();
          // We don't have a direct way to get the previously notified riders
          // So we'll find nearby riders and notify them (excluding the assigned rider)
          // TODO: may have to remove finding nearby riders and notifying them that a order has been assgned
          const { availableRiders } =
            await riderDispatch.findAvailableRiders(orderId);
          const otherRiders = availableRiders
            .map((r) => r.rider)
            .filter((rider) => rider.userId !== userId);

          if (otherRiders.length > 0) {
            c.executionCtx.waitUntil(
              riderDispatch.notifyRidersOrderTaken(otherRiders, orderId)
            );
            console.log(
              `✅ Notified ${otherRiders.length} other riders that order ${orderId} is taken`
            );
          }
        } catch (notificationError) {
          console.error(
            `Failed to notify other riders about order ${orderId} being taken:`,
            notificationError
          );
        }

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
      const honoEnv = env;

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
          const workflowInstance = await honoEnv.ORDER_WORKFLOW.get(id);
          if (workflowInstance) {
            await workflowInstance.sendEvent({
              type: "order_picked_up",
              payload: {
                orderId: id,
                riderId: userId,
                status: updatedOrder.status,
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
        } // Notify vendor about pickup
        try {
          const pushNotificationService = new PushNotificationService();

          const orderInfo = await db.query.orderTable.findFirst({
            where: eq(orderTable.id, id),
            columns: { shopId: true },
          });

          if (orderInfo?.shopId) {
            c.executionCtx.waitUntil(
              pushNotificationService.sendNotificationToShop(orderInfo.shopId, {
                title: "Order Picked Up! 📦",
                body: `Order #${id.slice(-6)} has been picked up by the rider and is on its way to the customer`,
                data: {
                  type: "order_picked_up",
                  orderId: id,
                  riderId: userId,
                  action: "view_order",
                  link: `/vendor/orders/${id}`,
                },
              })
            );
            console.log(
              `✅ Pickup notification sent to vendor for order: ${id}`
            );
          }
        } catch (vendorNotificationError) {
          console.error(
            `Failed to send pickup notification to vendor for order ${id}:`,
            vendorNotificationError
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
        const honoEnv = c.env;

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
            const workflowInstance = await honoEnv.ORDER_WORKFLOW.get(id);
            if (workflowInstance) {
              await workflowInstance.sendEvent({
                type: "order_delivered",
                payload: {
                  orderId: id,
                  riderId: userId,
                  status: updatedOrder.status,
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
          } // Notify vendor about successful delivery
          try {
            const pushNotificationService = new PushNotificationService();

            const orderInfo = await db.query.orderTable.findFirst({
              where: eq(orderTable.id, id),
              columns: { shopId: true },
            });

            if (orderInfo?.shopId) {
              c.executionCtx.waitUntil(
                pushNotificationService.sendNotificationToShop(
                  orderInfo.shopId,
                  {
                    title: "Order Delivered Successfully! ✅",
                    body: `Order #${id.slice(-6)} has been delivered to the customer. Well done!`,
                    data: {
                      type: "order_delivered",
                      orderId: id,
                      riderId: userId,
                      action: "view_order",
                      link: `/vendor/orders/${id}`,
                    },
                  }
                )
              );
              console.log(
                `✅ Delivery confirmation notification sent to vendor for order: ${id}`
              );
            }
          } catch (vendorNotificationError) {
            console.error(
              `Failed to send delivery notification to vendor for order ${id}:`,
              vendorNotificationError
            );
          }
        }

        return c.json({ success: true, data: updatedOrder });
      } catch (error) {
        console.error("Error confirming delivery:", error);
        return c.json({ error: "Internal server error" }, 500);
      }
    }
  )

  // Get computed todos for the rider
  .get("/todos", async (c) => {
    try {
      const db = c.get("db");
      const userId = c.get("userId");

      const todoService = new RiderTodoService();
      const todoStatus = await todoService.getComputedTodos(userId, db);

      if (!todoStatus) {
        return c.json({ error: "Rider not found" }, 404);
      }

      return c.json({ data: todoStatus });
    } catch (error) {
      console.error("Error fetching todos:", error);
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
  });

export default riderRoute;
