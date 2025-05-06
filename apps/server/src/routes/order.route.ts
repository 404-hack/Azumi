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
          riderConfirmationCode, // Save the generated number
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

      return c.json({ data: { accessCode } });
    } catch (error) {
      console.error("Error creating order:", error);
      if (error instanceof z.ZodError) {
        return c.json({ error: "Invalid input", details: error.errors }, 400);
      }
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
        const { status, reason } = c.req.valid("json");
        const db = c.get("db");
        const user = c.get("user");

        if (!user) {
          return c.json({ error: "Unauthorized" }, 401);
        }

        // Get the current order
        const existingOrder = await db.query.orderTable.findFirst({
          where: eq(orderTable.id, id),
        });

        if (!existingOrder) {
          return c.json({ error: "Order not found" }, 404);
        }

        // Check permissions
        const session = c.get("session");
        // Corrected: Use shopId from existingOrder
        const isVendor = session?.activeOrganizationId === existingOrder.shopId;
        const isRider = user.id === existingOrder.riderId; // Assuming riderId is stored

        // Allow customer to cancel PENDING orders
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
        } else if (status === "CANCELLED" && !isCustomer && !isVendor) {
          // Allow vendors to cancel at other stages (adjust logic as needed)
          return c.json(
            {
              error:
                "Only the customer (for pending orders) or vendor can cancel",
            },
            403
          );
        }

        // Certain status changes require specific roles (excluding cancellation handled above)
        if (status !== "CANCELLED") {
          if (
            ["CONFIRMED", "PREPARING", "READY"].includes(status) &&
            !isVendor
          ) {
            return c.json(
              { error: "Only vendors can update to this status" },
              403
            );
          }

          if (["IN_TRANSIT", "DELIVERED"].includes(status) && !isRider) {
            // If no rider assigned yet, maybe vendor marks as ready for pickup? Adjust logic.
            // For now, strictly enforce rider role for these statuses.
            return c.json(
              { error: "Only assigned riders can update to this status" },
              403
            );
          }
        }

        // Prepare update data
        const updateData: Partial<typeof orderTable.$inferInsert> = { status };

        // Add timestamps based on status
        const nowISO = new Date().toISOString();
        switch (status) {
          case "CONFIRMED":
            updateData.acceptedAt = nowISO;
            break;
          case "PREPARING":
            updateData.preparedAt = nowISO;
            break;
          // Add READY status handling if needed
          // case "READY":
          //   updateData.readyAt = nowISO;
          //   break;
          case "IN_TRANSIT":
            updateData.pickedUpAt = nowISO;
            break;
          case "DELIVERED":
            updateData.deliveredAt = nowISO;
            // Potentially update payment status if cash on delivery, etc.
            break;
          case "CANCELLED":
            updateData.canceledAt = nowISO;
            updateData.cancelReason = reason;
            // Handle potential refunds or payment voiding here or via webhook
            break;
        }

        // Update the order
        const updatedOrder = await db
          .update(orderTable)
          .set(updateData)
          .where(eq(orderTable.id, id))
          .returning()
          .get();

        // TODO: Add logic to notify relevant parties (customer, vendor, rider) about the status change

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
  );

export default orderRoute;
