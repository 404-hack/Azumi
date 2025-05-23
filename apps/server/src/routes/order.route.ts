import { factory } from "../lib/factory";
import { zValidator } from "@hono/zod-validator";
import { Context } from "../lib/types";
import {
  orderTable,
  orderItemTable,
  orderItemOptionTable,
  cartTable,
  shopTable,
} from "../lib/db/schema";
import { and, eq, desc, inArray } from "drizzle-orm";
import { z } from "zod";
import { nanoid } from "nanoid";
import { createAuth } from "../lib/auth";
import {
  createOrderSchema,
  updateOrderStatusSchema,
} from "../lib/validation/order.validation";
import { env } from "cloudflare:workers";
import {
  calculateDeliveryFee,
  calculateHaversineDistance,
  isShopCurrentlyOpen,
} from "../lib/utils/shop.utils";
import { DAYS_OF_WEEK } from "../lib/constant";
import { RiderDispatchService } from "../services/riderDispatch.service";

const orderRoute = factory
  .createApp()
  // Get orders with filters
  .get("/", async (c) => {
    try {
      const db = c.get("db");
      const session = c.get("session");
      const user = c.get("user");
      // const auth = await createAuth(db);

      if (!user) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      // Parse query parameters
      const vendorId = c.req.query("vendorId");
      const customerId = c.req.query("customerId");
      const status = c.req.query("status");
      const limit = Number(c.req.query("limit")) || 50;
      const page = Number(c.req.query("page")) || 1;
      const offset = (page - 1) * limit;

      // Base query conditions
      let whereConditions = [];

      // Filter by vendor if specified
      if (vendorId) {
        whereConditions.push(eq(orderTable.shopId, vendorId));
      }

      // Filter by customer if specified
      if (customerId) {
        whereConditions.push(eq(orderTable.customerId, customerId));
      }

      // Filter by status if specified
      if (status) {
        whereConditions.push(eq(orderTable.status, status));
      }

      // If user is a vendor, only show their orders
      if (!session?.activeOrganizationId) {
        // If just a customer, only show their orders
        whereConditions.push(eq(orderTable.customerId, user.id));
      }

      const finalWhereCondition =
        whereConditions.length > 1
          ? and(...whereConditions)
          : whereConditions[0];

      // Get orders with items
      const orders = await db.query.orderTable.findMany({
        where: finalWhereCondition,
        with: {
          items: true,
        },
        orderBy: [desc(orderTable.createdAt)],
        limit,
        offset,
      });

      // Count total orders for pagination
      const countResult = await db
        .select({ count: db.fn.count() })
        .from(orderTable)
        .where(finalWhereCondition);

      const totalCount = Number(countResult[0]?.count || 0);

      return c.json({
        data: orders,
        pagination: {
          total: totalCount,
          page,
          limit,
          pages: Math.ceil(totalCount / limit),
        },
      });
    } catch (error) {
      console.error("Error fetching orders:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  })

  // Get order by ID
  .get("/:id", async (c) => {
    try {
      const { id } = c.req.param(); // This 'id' is expected to be the order.paymentTransactionId
      const db = c.get("db");
      const user = c.get("user");

      if (!user) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const order = await db.query.orderTable.findFirst({
        where: eq(orderTable.paymentTransactionId, id), // Query by paymentTransactionId
        with: {
          items: {
            with: {
              options: {
                with: {
                  optionGroup: true,
                },
              },
            },
          },
          shop: true,
          customer: true,
          rider: true,
        },
      });

      if (!order) {
        return c.json({ error: "Order not found" }, 404);
      }

      // Check permissions
      const session = c.get("session");
      const isVendor = session?.activeOrganizationId === order.shopId;
      const isCustomer = user.id === order.customerId;
      const isRider = user.id === order.riderId;

      if (!isVendor && !isCustomer && !isRider) {
        return c.json(
          { error: "You don't have permission to view this order" },
          403
        );
      }

      return c.json({ data: order });
    } catch (error) {
      console.error("Error fetching order:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  })

  // Create new order
  .post("/create", zValidator("json", createOrderSchema), async (c) => {
    try {
      const data = c.req.valid("json");
      const db = c.get("db");
      const user = c.get("user");

      if (!user) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      if (!data.cartId) {
        return c.json({ error: "Cart ID is required" }, 400);
      }

      // Fetch cart with items, menu item details (including inStock), options (including inStock), and shop details
      const cart = await db.query.cartTable.findFirst({
        where: eq(cartTable.id, data.cartId),
        with: {
          items: {
            with: {
              menuItem: {
                columns: {
                  id: true,
                  name: true,
                  price: true,
                  inStock: true,
                },
              },
              options: {
                with: {
                  option: {
                    columns: {
                      id: true,
                      name: true,
                      inStock: true, // Fetch option inStock status
                    },
                  },
                },
              },
            },
          },
          shop: {
            columns: {
              id: true,
              latitude: true,
              longitude: true,
              active: true,
              name: true,
            },
            with: {
              operatingHours: true,
            },
          },
        },
      });

      if (!cart) {
        return c.json({ error: "Cart not found" }, 404);
      }

      if (cart.customerId !== user.id) {
        return c.json(
          { error: "You don't have permission to access this cart" },
          403
        );
      }

      if (cart.status !== "ACTIVE") {
        return c.json({ error: "This cart has already been processed" }, 400);
      }

      if (!cart.items || cart.items.length === 0) {
        return c.json({ error: "Cart is empty" }, 400);
      }

      if (!cart.shop) {
        console.error(`Cart ${cart.id} is missing shop data.`);
        return c.json({ error: "Shop data not found for this cart" }, 500);
      }

      // --- Pre-Order Validation ---

      // 1. Check if Shop is Active
      if (!cart.shop.active) {
        return c.json(
          {
            error: `Sorry, the shop "${cart.shop.name}" is currently inactive and cannot accept orders. Please try again later.`,
          },
          400
        );
      }

      // 2. Check if Shop is Open
      const now = new Date();
      const currentDay = now.getDay();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTimeMinutes = currentHour * 60 + currentMinute;
      const dayMapping = {
        0: "SUNDAY",
        1: "MONDAY",
        2: "TUESDAY",
        3: "WEDNESDAY",
        4: "THURSDAY",
        5: "FRIDAY",
        6: "SATURDAY",
      };
      const currentDayString =
        dayMapping[currentDay as keyof typeof dayMapping];

      const isOpen = isShopCurrentlyOpen(
        cart.shop.operatingHours,
        currentDayString,
        currentTimeMinutes
      );

      if (!isOpen) {
        return c.json(
          {
            error: `Sorry, the shop "${cart.shop.name}" is currently closed and cannot accept orders. Please check their opening hours.`,
          },
          400
        );
      }

      // 3. Check Item and Option Availability (In Stock)
      for (const item of cart.items) {
        if (!item.menuItem) {
          return c.json(
            {
              error: `Oops! We couldn't find the details for an item in your cart. Please try removing and re-adding it.`,
            },
            400
          );
        }
        if (!item.menuItem.inStock) {
          return c.json(
            {
              error: `Sorry, the item "${item.menuItem.name}" is currently out of stock. Please remove it from your cart to proceed.`,
            },
            400
          );
        }

        // Check options stock
        if (item.options && item.options.length > 0) {
          for (const cartOption of item.options) {
            if (!cartOption.option) {
              return c.json(
                {
                  error: `Oops! We couldn't find the details for an option selected with "${item.menuItem.name}". Please try removing and re-adding the item.`,
                },
                400
              );
            }
            if (!cartOption.option.inStock) {
              return c.json(
                {
                  error: `Sorry, the option "${cartOption.option.name}" for the item "${item.menuItem.name}" is currently out of stock. Please remove or change the selection to proceed.`,
                },
                400
              );
            }
          }
        }
      }

      // --- End Pre-Order Validation ---

      // --- Backend Calculation (already implemented) ---
      const subtotal = cart.items.reduce(
        (sum, item) => sum + Number(item.totalPrice || 0),
        0
      );

      let deliveryFee = 0;
      const shopLat = cart.shop?.latitude;
      const shopLng = cart.shop?.longitude;

      if (
        shopLat !== null &&
        shopLng !== null &&
        shopLat !== undefined &&
        shopLng !== undefined
      ) {
        const distance = calculateHaversineDistance(
          data.userLatitude,
          data.userLongitude,
          shopLat,
          shopLng
        );
        deliveryFee = calculateDeliveryFee(distance);
      } else {
        console.warn(
          `Shop ${cart.shopId} missing coordinates. Using default delivery fee.`
        );
      }

      const serviceFee = 0; // Example fee
      const total = subtotal + deliveryFee + serviceFee - data.discount;

      // orderCode generation and saving is intentionally omitted as per user request

      const riderConfirmationCode = Math.floor(1000 + Math.random() * 9000);

      // Create the order (only if validations passed)
      const order = await db
        .insert(orderTable)
        .values({
          // code: orderCode, // Omitted as per user request
          customerId: user.id,
          shopId: cart.shopId,
          cartId: data.cartId,
          deliveryNotes: data.deliveryNotes,
          vendorNotes: data.vendorNotes,
          contactPhone: data.contactPhone,
          status: "PENDING",
          paymentStatus: "PENDING",
          subtotal,
          deliveryFee,
          serviceFee,
          discount: data.discount,
          total,
          latitude: data.userLatitude,
          longitude: data.userLongitude,
          addressName: data.addressName,
          riderConfirmationCode: riderConfirmationCode, // Save the generated number
        })
        .returning()
        .get();

      // Create order items (only if validations passed)
      const orderItems = await Promise.all(
        cart.items.map(async (item) => {
          // We already validated menuItem and options exist and are in stock above
          const orderItem = await db
            .insert(orderItemTable)
            .values({
              orderId: order.id,
              menuItemId: item.menuItem.id, // Corrected: Use ID from the resolved menuItem object
              menuItemName: item.menuItem.name, // Corrected: Use name from the resolved menuItem object
              quantity: item.quantity,
              unitPrice: Number(item.menuItem.price) || 0,
              totalPrice: Number(item.totalPrice) || 0,
              specialInstructions: item.specialInstructions || null,
            })
            .returning()
            .get();

          if (item.options && item.options.length > 0) {
            await db.insert(orderItemOptionTable).values(
              item.options.map((cartOption) => ({
                // cartOption is a cartItemOption from cart.items.options
                orderItemId: orderItem.id,
                optionId: cartOption.option.id, // Corrected: Use ID from the resolved option object within cartOption
                optionGroupId: cartOption.optionGroupId,
                optionName: cartOption.option.name, // Corrected: Use name from the resolved option object within cartOption
                quantity: cartOption.quantity,
                price: Number(cartOption.price) || 0,
              }))
            );
          }

          return orderItem;
        })
      );

      // Update the cart status to "pending_payment"
      // This is a temporary state while payment is processing
      // The webhook will update this to "converted" on successful payment
      // or revert to "active" if payment fails
      // await db
      //   .update(cartTable)
      //   .set({
      //     status: "PENDING_PAYMENT", // Update cart status to pending payment
      //   })
      //   .where(eq(cartTable.id, data.cartId))
      //   .execute();

      // Get the complete order with items
      const completeOrder = await db.query.orderTable.findFirst({
        where: eq(orderTable.id, order.id),
        with: {
          items: true,
        },
      });

      // Initialize Paystack payment with backend-calculated total
      const paystackSecretKey = env.PAYSTACK_SECRET_KEY;
      if (!paystackSecretKey) {
        console.error("Missing PAYSTACK_SECRET_KEY environment variable");
        // Potentially delete the created order or mark it as failed immediately
        await db.delete(orderTable).where(eq(orderTable.id, order.id));
        return c.json({ error: "Server configuration error" }, 500);
      }

      // Define your frontend base URL (replace with actual URL or env variable)
      const frontendBaseUrl = "http://localhost:5173"; // Example: Use env var in production
      const callbackUrl = `${frontendBaseUrl}/checkout/callback`; // Redirect URL after payment attempt

      const reference = `ORD-${order.id}-${nanoid(6)}`; // Generate unique reference

      const accessCodeRes = await fetch(
        "https://api.paystack.co/transaction/initialize",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${paystackSecretKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: user.email || "customer@example.com", // Ensure user email exists or use a placeholder
            amount: Math.round(total * 100), // Amount in kobo
            callback_url: callbackUrl, // Add the callback URL
            metadata: {
              order_id: order.id,
              cart_id: data.cartId,
              customer_id: user.id,
              custom_fields: [
                // Optional: Add custom fields if needed
                {
                  display_name: "Order Code",
                  variable_name: "order_code",
                  value: order.code,
                },
              ],
            },
            reference: reference, // Use the generated unique reference
          }),
        }
      );

      if (!accessCodeRes.ok) {
        const errorBody = await accessCodeRes.text();
        console.error(
          "Paystack initialization failed:",
          accessCodeRes.status,
          errorBody
        );
        await db.delete(orderTable).where(eq(orderTable.id, order.id));
        return c.json(
          { error: "Payment initialization failed", details: errorBody },
          500
        );
      }

      const accessCodeData = await accessCodeRes.json();
      console.log("🚀 ~ .post ~ accessCodeData:", accessCodeData);

      if (!accessCodeData.status || !accessCodeData.data?.access_code) {
        console.error("Invalid Paystack response:", accessCodeData);
        await db.delete(orderTable).where(eq(orderTable.id, order.id));
        return c.json({ error: "Invalid payment provider response" }, 500);
      }

      await db
        .update(orderTable)
        .set({
          paymentTransactionId: reference, // Store the reference used for initialization
          paymentStatus: "PENDING",
        })
        .where(eq(orderTable.id, order.id));

      const accessCode = accessCodeData.data.access_code;

      // WORKFLOW: Initiate order workflow
      // This is the entry point for the order workflow
      try {
        // Start the workflow with order information
        const workflowExecution = await env.ORDER_WORKFLOW.create({
          params: {
            orderId: order.id, // From the created order
            timestamp: new Date().toISOString(),
            customerEmail: user.email,
            customerId: user.id,
            customerPhone: user.phoneNumber,
            shopId: order.shopId,
            // vendorEmail: cart.shop.email, // Assuming shop schema has email
            paymentTransactionId: reference, // Use the same reference stored in DB
            paymentMethod: order.paymentMethod,
            // items: completeOrder.items.map((item) => ({ // Use completeOrder for items
            //   id: item.id,
            //   name: item.menuItemName,
            //   quantity: item.quantity,
            //   price: item.unitPrice,
            // })),
            deliveryAddress: {
              latitude: order.latitude,
              longitude: order.longitude,
              formattedAddress: order.addressName,
            },
            subtotal: order.subtotal,
            deliveryFee: order.deliveryFee,
            total: order.total,
          },
          id: order.id, // Use the order ID as the workflow instance ID
        });

        console.log(
          `Order workflow started for order: ${order.id} with ID: ${workflowExecution.id}`
        );
      } catch (workflowError) {
        console.error("Failed to start order workflow:", workflowError);
        // Continue with order creation even if workflow fails
        // The workflow can be manually started later if needed
      }

      // Return the order information to the client
      return c.json({
        data: { orderId: order.id, paymentInfo: { accessCode } },
      });
    } catch (error) {
      console.error("Error creating order:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  })

  // Verify payment status using reference
  .get("/verify-payment/:reference", async (c) => {
    try {
      const { reference } = c.req.param();
      const db = c.get("db");
      const user = c.get("user");

      if (!user) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      if (!reference) {
        return c.json({ error: "Payment reference is required" }, 400);
      }

      // Find the order by the payment transaction reference
      const order = await db.query.orderTable.findFirst({
        where: eq(orderTable.paymentTransactionId, reference),
        columns: {
          id: true,
          paymentStatus: true,
          customerId: true,
        },
      });

      if (!order) {
        return c.json({ error: "Order not found for this reference" }, 404);
      }

      // Ensure the user requesting verification is the one who placed the order
      if (order.customerId !== user.id) {
        return c.json(
          { error: "You do not have permission to view this order status" },
          403
        );
      }

      // Return the order ID and its current payment status
      return c.json({
        data: {
          orderId: order.id,
          paymentStatus: order.paymentStatus,
        },
      });
    } catch (error) {
      console.error("Error verifying payment status:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  })

  // Update order status (for vendors/admins)
  .patch(
    "/:id/status",
    zValidator("json", updateOrderStatusSchema),
    async (c) => {
      try {
        const { id } = c.req.param();
        const { status, cancelReason } = c.req.valid("json"); // Include cancelReason
        const db = c.get("db");

        const user = c.get("user"); // Removed duplicate session declaration

        if (!user) {
          return c.json({ error: "Unauthorized" }, 401);
        }

        // Get the current order
        const existingOrder = await db.query.orderTable.findFirst({
          where: eq(orderTable.id, id),
          columns: {
            id: true,
            status: true,
            customerId: true,
            shopId: true,
            riderId: true,
          },
        });

        if (!existingOrder) {
          return c.json({ error: "Order not found" }, 404);
        }

        // Check permissions
        const session = c.get("session"); // Keep this one
        const isVendor = session?.activeOrganizationId === existingOrder.shopId;
        const isRider = user.id === existingOrder.riderId;
        const isCustomer = user.id === existingOrder.customerId;

        if (
          status === "CANCELLED" &&
          isCustomer &&
          existingOrder.status !== "PENDING"
        ) {
          return c.json(
            { error: "Customers can only cancel pending orders" },
            403
          );
        } else if (
          status === "CANCELLED" &&
          !isCustomer &&
          !isVendor &&
          !isRider
        ) {
          // Added !isRider
          return c.json(
            {
              error:
                "Only the customer (for pending orders), vendor, or rider can cancel",
            },
            403
          );
        }

        if (status !== "CANCELLED") {
          if (
            ["CONFIRMED", "READY"].includes(status) && // Removed "PREPARING"
            !isVendor
          ) {
            return c.json(
              { error: "Only vendors can update to this status" },
              403
            );
          }

          if (["IN_TRANSIT", "DELIVERED"].includes(status) && !isRider) {
            return c.json(
              { error: "Only assigned riders can update to this status" },
              403
            );
          }
        }

        const updateData: Partial<typeof orderTable.$inferInsert> = { status };
        const nowISO = new Date().toISOString();

        switch (status) {
          case "CONFIRMED":
            updateData.acceptedAt = nowISO;
            break;
          // "PREPARING" case removed
          case "IN_TRANSIT":
            updateData.pickedUpAt = nowISO;
            break;
          case "DELIVERED":
            updateData.deliveredAt = nowISO;
            break;
          case "CANCELLED":
            updateData.canceledAt = nowISO;
            updateData.cancelReason = cancelReason; // Use validated cancelReason
            break;
        }

        const updatedOrder = await db
          .update(orderTable)
          .set(updateData)
          .where(eq(orderTable.id, id))
          .returning({
            id: orderTable.id,
            status: orderTable.status,
            shopId: orderTable.shopId, // Add shopId for rider notification
          })
          .get();

        try {
          const workflowInstance = await env.ORDER_WORKFLOW.get(id); // Use order ID as workflow instance ID

          if (workflowInstance) {
            let eventType = "";
            let eventPayload: {
              orderId: string;
              status: string;
              timestamp: string;
              [key: string]: any; // Allow other properties
            } = {
              orderId: id,
              status,
              timestamp: new Date().toISOString(),
            };

            switch (status) {
              case "CONFIRMED":
                eventType = "vendor_order_response";
                eventPayload = {
                  ...eventPayload,
                  vendorId: session?.activeOrganizationId,
                  accepted: true,
                };
                break;
              // "PREPARING" case and "order_preparing" event removed
              case "READY":
                eventType = "order_ready";
                break;
              case "CANCELLED":
                eventType = "vendor_order_response";
                eventPayload = {
                  ...eventPayload,
                  accepted: false,
                  reason: cancelReason || "No reason provided",
                  cancelledBy: user.id,
                };
                break;
            }

            if (eventType) {
              await workflowInstance.sendEvent({
                // Changed to sendEvent
                type: eventType,
                payload: eventPayload,
              });
              console.log(
                `Sent ${eventType} event to workflow for order: ${id}`
              );
            }

            // Automatically trigger rider notification when order is marked as READY
            if (status === "READY") {
              console.log(
                `Order ${id} marked as READY, initiating rider notification process`
              );
              // Use the RiderDispatchService to find and notify riders
              const riderDispatch = new RiderDispatchService();

              // Execute in background to prevent blocking the response
              c.executionCtx.waitUntil(
                riderDispatch.findAndNotifyRiders(id, updatedOrder.shopId)
              );
            }
          }
        } catch (workflowError) {
          console.error(
            "Failed to notify workflow about status update:",
            workflowError
          );
        }

        return c.json({ data: updatedOrder });
      } catch (error) {
        console.error("Error updating order status:", error);
        if (error instanceof z.ZodError) {
          return c.json(
            { error: "Invalid input data", details: error.errors },
            400
          );
        }
        return c.json({ error: "Internal server error" }, 500);
      }
    }
  )
  .post("/test", async (c) => {
    const db = c.get("db");

    const workflowInput = {
      orderId: `test-${nanoid(6)}`,
      timestamp: new Date().toISOString(),
      customerEmail: "test@example.com",
      items: [
        { id: "item1", name: "Test Product", quantity: 2 },
        { id: "item2", name: "Another Product", quantity: 1 },
      ],
    };

    try {
      const workflowExecution = await env.ORDER_WORKFLOW.create({
        params: workflowInput,
      });

      console.log(`Workflow started with ID: ${workflowExecution.id}`);

      return c.json({
        success: true,
        message: "Workflow initiated",
        workflowId: workflowExecution.id,
        input: workflowInput,
      });
    } catch (error) {
      console.error("Failed to start workflow:", error);
      return c.json(
        {
          success: false,
          message: "Failed to start workflow",
          error: error instanceof Error ? error.message : String(error),
        },
        500
      );
    }
  });

export default orderRoute;
