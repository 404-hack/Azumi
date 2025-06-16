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
  isShopCurrentlyOpen,
} from "../lib/utils/shop.utils";
import { calculateDistance } from "../lib/utils/geo";
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
        whereConditions.push(eq(orderTable.status, status as any));
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
          shop: {
            columns: {
              id: true,
              name: true,
              address: true,
              coverImage: true,
              latitude: true,
              longitude: true,
            },
          },
        },
        orderBy: [desc(orderTable.createdAt)],
      });

      return c.json({
        data: orders,
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
      // paymentTransactionId
      const order = await db.query.orderTable.findFirst({
        where: eq(orderTable.id, id), // Query by paymentTransactionId
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

      console.log("[ORDER_ROUTE] Starting order creation process:", {
        userId: user?.id,
        cartId: data.cartId,
        timestamp: new Date().toISOString(),
      });

      if (!user) {
        console.log("[ORDER_ROUTE] Unauthorized: No user found");
        return c.json({ error: "Unauthorized" }, 401);
      }

      if (!data.cartId) {
        console.log("[ORDER_ROUTE] Bad request: No cart ID provided");
        return c.json({ error: "Cart ID is required" }, 400);
      }

      console.log(
        "[ORDER_ROUTE] Fetching cart details for cart ID:",
        data.cartId
      );

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
              status: true,
              name: true,
              minimumOrderAmount: true,
            },
            with: {
              operatingHours: true,
            },
          },
        },
      });

      if (!cart) {
        console.log("[ORDER_ROUTE] Cart not found for ID:", data.cartId);
        return c.json({ error: "Cart not found" }, 404);
      }

      console.log("[ORDER_ROUTE] Cart found:", {
        cartId: cart.id,
        customerId: cart.customerId,
        shopId: cart.shopId,
        status: cart.status,
        itemsCount: cart.items?.length || 0,
      });

      if (cart.customerId !== user.id) {
        console.log(
          "[ORDER_ROUTE] Permission denied: Cart belongs to different user:",
          {
            cartCustomerId: cart.customerId,
            currentUserId: user.id,
          }
        );
        return c.json(
          { error: "You don't have permission to access this cart" },
          403
        );
      }

      if (cart.status !== "ACTIVE") {
        console.log("[ORDER_ROUTE] Cart not active:", {
          cartId: cart.id,
          status: cart.status,
        });
        return c.json({ error: "This cart has already been processed" }, 400);
      }

      if (!cart.items || cart.items.length === 0) {
        console.log("[ORDER_ROUTE] Cart is empty:", cart.id);
        return c.json({ error: "Cart is empty" }, 400);
      }

      if (!cart.shop) {
        console.error("[ORDER_ROUTE] Cart missing shop data:", cart.id);
        return c.json({ error: "Shop data not found for this cart" }, 500);
      }

      console.log("[ORDER_ROUTE] Starting shop validation:", {
        shopId: cart.shop.id,
        shopName: cart.shop.name,
        active: cart.shop.active,
        status: cart.shop.status,
      });

      // --- Pre-Order Validation ---

      // 1. Check if Shop is Active
      if (!cart.shop.active) {
        console.log("[ORDER_ROUTE] Shop inactive:", {
          shopId: cart.shop.id,
          shopName: cart.shop.name,
        });
        return c.json(
          {
            error: `Sorry, the shop "${cart.shop.name}" is currently inactive and cannot accept orders. Please try again later.`,
          },
          400
        );
      }

      // 2. Check if Shop is Approved
      if (cart.shop.status !== "APPROVED") {
        console.log("[ORDER_ROUTE] Shop not approved:", {
          shopId: cart.shop.id,
          shopName: cart.shop.name,
          status: cart.shop.status,
        });
        return c.json(
          {
            error: `Sorry, the shop "${cart.shop.name}" is not approved to accept orders. Please try again later.`,
          },
          400
        );
      }

      // 3. Check if Shop is Open
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

      console.log("[ORDER_ROUTE] Checking shop operating hours:", {
        shopId: cart.shop.id,
        currentDay: currentDayString,
        currentTime: `${currentHour}:${currentMinute}`,
        operatingHoursCount: cart.shop.operatingHours?.length || 0,
      });

      const isOpen = isShopCurrentlyOpen(
        cart.shop.operatingHours,
        currentDayString,
        currentTimeMinutes
      );

      if (!isOpen) {
        console.log("[ORDER_ROUTE] Shop closed:", {
          shopId: cart.shop.id,
          shopName: cart.shop.name,
          currentDay: currentDayString,
          currentTime: `${currentHour}:${currentMinute}`,
        });
        return c.json(
          {
            error: `Sorry, the shop "${cart.shop.name}" is currently closed and cannot accept orders. Please check their opening hours.`,
          },
          400
        );
      }

      console.log("[ORDER_ROUTE] Shop is open, checking item availability");

      // 4. Check Item and Option Availability (In Stock)
      for (const item of cart.items) {
        if (!item.menuItem) {
          console.log(
            "[ORDER_ROUTE] Menu item missing for cart item:",
            item.id
          );
          return c.json(
            {
              error: `Oops! We couldn't find the details for an item in your cart. Please try removing and re-adding it.`,
            },
            400
          );
        }
        if (!item.menuItem.inStock) {
          console.log("[ORDER_ROUTE] Menu item out of stock:", {
            itemId: item.menuItem.id,
            itemName: item.menuItem.name,
          });
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
              console.log(
                "[ORDER_ROUTE] Option details missing for cart option:",
                cartOption.id
              );
              return c.json(
                {
                  error: `Oops! We couldn't find the details for an option selected with "${item.menuItem.name}". Please try removing and re-adding the item.`,
                },
                400
              );
            }
            if (!cartOption.option.inStock) {
              console.log("[ORDER_ROUTE] Option out of stock:", {
                optionId: cartOption.option.id,
                optionName: cartOption.option.name,
                itemName: item.menuItem.name,
              });
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

      console.log("[ORDER_ROUTE] All items available, calculating totals");

      // --- End Pre-Order Validation ---

      // --- Backend Calculation (already implemented) ---
      const subtotal = cart.items.reduce(
        (sum, item) => sum + Number(item.totalPrice || 0),
        0
      );

      console.log("[ORDER_ROUTE] Calculated subtotal:", subtotal);

      // 5. Check Minimum Order Amount
      const minimumOrderAmount = cart.shop?.minimumOrderAmount || 0;

      if (subtotal < minimumOrderAmount) {
        console.log("[ORDER_ROUTE] Order below minimum amount:", {
          subtotal,
          minimumOrderAmount,
          shopId: cart.shop.id,
          shopName: cart.shop.name,
        });
        return c.json(
          {
            error: `Sorry, the minimum order amount for "${cart.shop.name}" is ₦${minimumOrderAmount.toLocaleString()}. Your current order total is ₦${subtotal.toLocaleString()}. Please add more items to proceed.`,
          },
          400
        );
      }

      console.log("[ORDER_ROUTE] Order meets minimum amount requirement:", {
        subtotal,
        minimumOrderAmount,
        shopName: cart.shop.name,
      });

      let deliveryFee = 0;
      const shopLat = cart.shop?.latitude;
      const shopLng = cart.shop?.longitude;

      if (
        shopLat !== null &&
        shopLng !== null &&
        shopLat !== undefined &&
        shopLng !== undefined
      ) {
        const distance = calculateDistance(
          data.userLatitude,
          data.userLongitude,
          shopLat,
          shopLng
        );
        deliveryFee = calculateDeliveryFee(distance);
        console.log("[ORDER_ROUTE] Calculated delivery fee:", {
          distance,
          deliveryFee,
          shopCoords: { lat: shopLat, lng: shopLng },
          userCoords: { lat: data.userLatitude, lng: data.userLongitude },
        });
      } else {
        console.warn(
          "[ORDER_ROUTE] Shop missing coordinates, using default delivery fee:",
          {
            shopId: cart.shopId,
            shopLat,
            shopLng,
          }
        );
      }

      const serviceFee = Math.min(Math.round(subtotal * 0.1), 1000); // 10% of subtotal, capped at ₦1,000
      const total = subtotal + deliveryFee + serviceFee - data.discount;

      console.log("[ORDER_ROUTE] Final totals:", {
        subtotal,
        deliveryFee,
        serviceFee,
        discount: data.discount,
        total,
      });

      const riderConfirmationCode = Math.floor(1000 + Math.random() * 9000);

      console.log("[ORDER_ROUTE] Creating order in database");

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

      console.log("[ORDER_ROUTE] Order created:", {
        orderId: order.id,
        customerId: order.customerId,
        shopId: order.shopId,
        total: order.total,
        status: order.status,
        paymentStatus: order.paymentStatus,
      });

      console.log("[ORDER_ROUTE] Creating order items");

      // Create order items (only if validations passed)
      const orderItems = await Promise.all(
        cart.items.map(async (item) => {
          // We already validated menuItem and options exist and are in stock above
          const orderItem = await db
            .insert(orderItemTable)
            .values({
              orderId: order.id,
              menuItemId: item.menuItem!.id,
              menuItemName: item.menuItem!.name,
              quantity: item.quantity,
              unitPrice: Number(item.menuItem!.price) || 0,
              totalPrice: Number(item.totalPrice) || 0,
              specialInstructions: item.specialInstructions || null,
            })
            .returning()
            .get();

          console.log("[ORDER_ROUTE] Created order item:", {
            orderItemId: orderItem.id,
            menuItemId: item.menuItem!.id,
            menuItemName: item.menuItem!.name,
            quantity: item.quantity,
            totalPrice: item.totalPrice,
          });

          if (item.options && item.options.length > 0) {
            console.log(
              "[ORDER_ROUTE] Adding options for order item:",
              orderItem.id
            );
            await db.insert(orderItemOptionTable).values(
              item.options.map((cartOption) => ({
                orderItemId: orderItem.id,
                optionId: cartOption.option!.id,
                optionGroupId: cartOption.optionGroupId,
                optionName: cartOption.option!.name,
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

      console.log(
        "[ORDER_ROUTE] Order items created successfully, total items:",
        orderItems.length
      );

      // Get the complete order with items
      const completeOrder = await db.query.orderTable.findFirst({
        where: eq(orderTable.id, order.id),
        with: {
          items: true,
        },
      });

      console.log("[ORDER_ROUTE] Complete order retrieved for payment:", {
        orderId: completeOrder?.id,
        itemsCount: completeOrder?.items?.length || 0,
      });

      // Initialize Paystack payment with backend-calculated total
      const paystackSecretKey = env.PAYSTACK_SECRET_KEY;
      if (!paystackSecretKey) {
        console.error(
          "[ORDER_ROUTE] Missing PAYSTACK_SECRET_KEY environment variable"
        );
        await db.delete(orderTable).where(eq(orderTable.id, order.id));
        return c.json({ error: "Server configuration error" }, 500);
      }

      // Define your frontend base URL (replace with actual URL or env variable)
      const frontendBaseUrl = "http://localhost:5173"; // Example: Use env var in production
      const callbackUrl = `${frontendBaseUrl}/checkout/callback`; // Redirect URL after payment attempt

      const reference = `ORD-${nanoid(10)}`; // Generate unique reference

      console.log("[ORDER_ROUTE] Initializing Paystack payment:", {
        orderId: order.id,
        reference,
        amount: Math.round(total * 100),
        email: user.email,
        callbackUrl,
      });

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
        console.error("[ORDER_ROUTE] Paystack initialization failed:", {
          status: accessCodeRes.status,
          error: errorBody,
          orderId: order.id,
        });
        await db.delete(orderTable).where(eq(orderTable.id, order.id));
        return c.json(
          { error: "Payment initialization failed", details: errorBody },
          500
        );
      }

      const accessCodeData = (await accessCodeRes.json()) as any;
      console.log("🚀 ~ .post ~ accessCodeData:", accessCodeData);
      console.log("[ORDER_ROUTE] Paystack response received:", {
        status: accessCodeData?.status,
        hasAccessCode: !!accessCodeData?.data?.access_code,
        orderId: order.id,
      });

      if (!accessCodeData?.status || !accessCodeData?.data?.access_code) {
        console.error("[ORDER_ROUTE] Invalid Paystack response:", {
          accessCodeData,
          orderId: order.id,
        });
        await db.delete(orderTable).where(eq(orderTable.id, order.id));
        return c.json({ error: "Invalid payment provider response" }, 500);
      }

      console.log("[ORDER_ROUTE] Updating order with payment transaction ID:", {
        orderId: order.id,
        reference,
      });

      await db
        .update(orderTable)
        .set({
          paymentTransactionId: reference, // Store the reference used for initialization
          paymentStatus: "PENDING",
        })
        .where(eq(orderTable.id, order.id));

      const accessCode = accessCodeData?.data?.access_code;

      console.log("[ORDER_ROUTE] Starting order workflow");

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
            items: completeOrder?.items.map((item) => ({
              id: item.id,
              name: item.menuItemName,
              quantity: item.quantity,
              price: item.unitPrice,
            })),
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

        console.log("[ORDER_ROUTE] Order workflow started successfully:", {
          orderId: order.id,
          workflowId: workflowExecution.id,
          paymentTransactionId: reference,
        });
      } catch (workflowError) {
        console.error("[ORDER_ROUTE] Failed to start order workflow:", {
          orderId: order.id,
          error: workflowError,
        });
        // Continue with order creation even if workflow fails
        // The workflow can be manually started later if needed
      }

      console.log("[ORDER_ROUTE] Order creation completed successfully:", {
        orderId: order.id,
        accessCode,
        total: order.total,
      });

      // Return the order information to the client
      return c.json({
        data: { orderId: order.id, paymentInfo: { accessCode } },
      });
    } catch (error) {
      console.error("[ORDER_ROUTE] Error creating order:", error);
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
        const { status, reason: cancelReason } = c.req.valid("json");
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

        if (status === "CANCELLED") {
          // Prioritize vendor/rider permissions - they can cancel at any status
          if (isVendor || isRider) {
            // Vendors and riders can cancel orders at any status
          } else if (isCustomer && existingOrder.status !== "PENDING") {
            // Customers can only cancel pending orders
            return c.json(
              { error: "Customers can only cancel pending orders" },
              403
            );
          } else if (!isCustomer && !isVendor && !isRider) {
            // No permission to cancel
            return c.json(
              {
                error:
                  "Only the customer (for pending orders), vendor, or rider can cancel",
              },
              403
            );
          }
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
          case "READY":
            updateData.preparedAt = nowISO;
            break;
          case "RIDER_ASSIGNED":
            updateData.riderAssignedAt = nowISO;
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
            console.log(`📦 Order ${id} status update: ${status}`);
            if (status === "READY") {
              console.log(
                `🚨 Order ${id} marked as READY, initiating real-time rider dispatch`
              );
              console.log(`🔍 Environment check:`, {
                hasEnv: !!env,
                durableObjectNamespace: !!env?.RIDER_DISPATCH,
              });

              // Use the RiderDispatchService to dispatch with real-time WebSocket notifications
              const riderDispatch = new RiderDispatchService();

              // Execute in background to prevent blocking the response
              c.executionCtx.waitUntil(
                (async () => {
                  try {
                    console.log(
                      `🚀 Starting dispatchOrderWithRealTime for order ${id}`
                    );
                    const dispatchResult =
                      await riderDispatch.dispatchOrderWithRealTime(id, env);

                    console.log(
                      `🔄 [REALTIME-DISPATCH] Result:`,
                      dispatchResult
                    );

                    // Enhanced logging for success/failure analysis
                    if (dispatchResult.success) {
                      console.log(
                        `✅ [REALTIME-DISPATCH] SUCCESS: ${dispatchResult.notifiedRiders} riders notified for order ${id}`
                      );
                      if (dispatchResult.notifiedRiders === 0) {
                        console.log(
                          `⚠️ [REALTIME-DISPATCH] WARNING: No riders were online/available for order ${id}`
                        );
                        console.log(
                          `💡 [REALTIME-DISPATCH] Fallback: Push notifications should still work`
                        );
                      }
                    } else {
                      console.log(
                        `❌ [REALTIME-DISPATCH] FAILED for order ${id}`
                      );
                      console.log(
                        `🔄 [REALTIME-DISPATCH] Attempting fallback dispatch...`
                      );

                      // Fallback to traditional dispatch if real-time fails
                      try {
                        await riderDispatch.findAndNotifyRiders(
                          id,
                          updatedOrder.shopId
                        );
                        console.log(
                          `✅ [FALLBACK-DISPATCH] Traditional dispatch successful for order ${id}`
                        );
                      } catch (fallbackError) {
                        console.error(
                          `❌ [FALLBACK-DISPATCH] Failed for order ${id}:`,
                          fallbackError
                        );
                      }
                    }
                  } catch (error) {
                    console.error(
                      `❌ Failed to dispatch order ${id} via real-time:`,
                      error
                    );
                    console.log(
                      `🔄 Falling back to traditional push notifications`
                    );
                    // Fallback to traditional push notification method
                    await riderDispatch.findAndNotifyRiders(
                      id,
                      updatedOrder.shopId
                    );
                  }
                })()
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
  })

  // Test endpoint: Manually trigger rider dispatch for any order
  .post("/:id/test-dispatch", async (c) => {
    try {
      const { id } = c.req.param();
      const db = c.get("db");
      const env = c.env;

      console.log(
        `🧪 [TEST-DISPATCH] Manual dispatch trigger for order: ${id}`
      );

      const order = await db.query.orderTable.findFirst({
        where: eq(orderTable.id, id),
        columns: { id: true, status: true, shopId: true },
      });

      if (!order) {
        return c.json({ error: "Order not found" }, 404);
      }

      console.log(`🧪 [TEST-DISPATCH] Found order:`, {
        id: order.id,
        status: order.status,
        shopId: order.shopId,
      });

      const riderDispatch = new RiderDispatchService();

      const dispatchResult = await riderDispatch.dispatchOrderWithRealTime(
        id,
        env
      );

      console.log(`🧪 [TEST-DISPATCH] Result:`, dispatchResult);

      return c.json({
        success: true,
        message: `Manual dispatch triggered for order ${id}`,
        result: dispatchResult,
        order: {
          id: order.id,
          status: order.status,
          shopId: order.shopId,
        },
      });
    } catch (error) {
      console.error(`🧪 [TEST-DISPATCH] Error:`, error);
      return c.json(
        {
          error: "Test dispatch failed",
          details: (error as any)?.message || String(error),
        },
        500
      );
    }
  });

export default orderRoute;
