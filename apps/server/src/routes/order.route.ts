import { factory } from "../lib/factory";
import { zValidator } from "@hono/zod-validator";
import { Context } from "../lib/types";
import {
  orderTable,
  orderItemTable,
  orderItemOptionTable,
  cartTable,
} from "../lib/db/schema";
import { and, eq, desc, inArray } from "drizzle-orm";
import { z } from "zod";
import { nanoid } from "nanoid";
import { createAuth } from "../lib/auth";
// Remove Node.js crypto import
// import crypto from 'node:crypto';
import {
  createOrderSchema,
  updateOrderStatusSchema,
} from "../lib/validation/order.validation";

const orderRoute = factory
  .createApp()
  // Get orders with filters
  .get("/", async (c) => {
    try {
      const db = c.get("db");
      const session = c.get("session");
      const user = c.get("user");
      const auth = await createAuth(db);

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
      const { id } = c.req.param();
      const db = c.get("db");
      const user = c.get("user");

      if (!user) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const order = await db.query.orderTable.findFirst({
        where: eq(orderTable.id, id),
        with: {
          items: true,
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

      // Retrieve cart data if cartId is provided
      if (!data.cartId) {
        return c.json({ error: "Cart ID is required" }, 400);
      }

      const cart = await db.query.cartTable.findFirst({
        where: eq(cartTable.id, data.cartId),
        with: {
          items: {
            with: {
              menuItem: true,
              options: {
                with: {
                  option: true,
                },
              },
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

      // Calculate the total on the server side using cart data
      const subtotal = cart.items.reduce(
        (sum, item) => sum + item.totalPrice,
        0
      );

      const total =
        subtotal + data.deliveryFee + data.serviceFee - data.discount;

      // Generate a unique order code
      const orderCode = `ORD-${nanoid(8).toUpperCase()}`;

      // Create the order
      const order = await db
        .insert(orderTable)
        .values({
          code: orderCode,
          customerId: user.id,
          shopId: cart.shopId, // Using cart's shopId instead of client-sent data
          cartId: data.cartId, // Store cart ID in the order
          deliveryAddressId: data.deliveryAddressId,
          deliveryNotes: data.deliveryNotes,
          vendorNotes: data.vendorNotes,
          contactPhone: data.contactPhone,
          status: "PENDING",
          paymentStatus: "PENDING",
          subtotal,
          deliveryFee: data.deliveryFee,
          serviceFee: data.serviceFee,
          discount: data.discount,
          total,
        })
        .returning()
        .get();

      // Create order items from cart items and get their IDs
      const orderItems = await Promise.all(
        cart.items.map(async (item) => {
          const orderItem = await db
            .insert(orderItemTable)
            .values({
              orderId: order.id,
              menuItemId: item.menuItemId,
              menuItemName: item.menuItem?.name || `Item (${item.menuItemId})`,
              quantity: item.quantity,
              unitPrice: item.menuItem?.price || 0,
              totalPrice: item.totalPrice,
              specialInstructions: item.specialInstructions || null,
            })
            .returning()
            .get();

          // If there are options, save them to the orderItemOptionTable
          if (item.options && item.options.length > 0) {
            await db.insert(orderItemOptionTable).values(
              item.options.map((option) => ({
                orderItemId: orderItem.id,
                optionId: option.optionId,
                optionGroupId: option.optionGroupId,
                // Fix the TypeScript error by directly accessing name or using a fallback
                optionName:
                  option.option?.name || `Option (${option.optionId})`,

                quantity: option.quantity,
                price: option.price,
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
      await db
        .update(cartTable)
        .set({
          status: "PENDING_PAYMENT", // Update cart status to pending payment
        })
        .where(eq(cartTable.id, data.cartId))
        .execute();

      // Get the complete order with items
      const completeOrder = await db.query.orderTable.findFirst({
        where: eq(orderTable.id, order.id),
        with: {
          items: true,
        },
      });
      // });
      const accessCodeRes = await fetch(
        "https://api.paystack.co/transaction/initialize",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${c.env.PAYSTACK_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: user.email,
            amount: total * 100, // Amount in kobo
            callback_url: "https://your-callback-url.com",
          }),
        }
      );
      const accessCodeData = await accessCodeRes.json();
      console.log("🚀 ~ .post ~ accessCodeData:", accessCodeData);
      // update the order with the payment transaction ID
      await db
        .update(orderTable)
        .set({
          paymentTransactionId: accessCodeData.data.reference,
          paymentMethod: "CARD",
          paymentStatus: "PENDING",
        })
        .where(eq(orderTable.id, order.id));
      // Return the access code for payment
      const accessCode = accessCodeData.data.access_code;

      return c.json({ data: { accessCode } });
    } catch (error) {
      console.error("Error creating order:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  })

  // Update order status
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
        const isVendor =
          session?.activeOrganizationId === existingOrder.vendorId;
        const isRider = user.id === existingOrder.riderId;

        // Certain status changes require specific roles
        if (["CONFIRMED", "PREPARING", "READY"].includes(status) && !isVendor) {
          return c.json(
            { error: "Only vendors can update to this status" },
            403
          );
        }

        if (["IN_TRANSIT", "DELIVERED"].includes(status) && !isRider) {
          return c.json(
            { error: "Only riders can update to this status" },
            403
          );
        }

        // Prepare update data
        const updateData: Record<string, any> = { status };

        // Add timestamps based on status
        switch (status) {
          case "CONFIRMED":
            updateData.acceptedAt = new Date().toISOString();
            break;
          case "PREPARING":
            updateData.preparedAt = new Date().toISOString();
            break;
          case "IN_TRANSIT":
            updateData.pickedUpAt = new Date().toISOString();
            break;
          case "DELIVERED":
            updateData.deliveredAt = new Date().toISOString();
            break;
          case "CANCELLED":
            updateData.canceledAt = new Date().toISOString();
            updateData.cancelReason = reason;
            break;
        }

        // Update the order
        const updatedOrder = await db
          .update(orderTable)
          .set(updateData)
          .where(eq(orderTable.id, id))
          .returning()
          .get();

        return c.json({ data: updatedOrder });
      } catch (error) {
        console.error("Error updating order status:", error);
        return c.json({ error: "Internal server error" }, 500);
      }
    }
  );

export default orderRoute;
