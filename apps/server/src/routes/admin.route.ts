import { factory } from "../lib/factory";
import { shopTable, member } from "../lib/db/schema";
import {
  eq,
  like,
  and,
  or,
  not as dbNot,
  sql,
  inArray,
  desc,
  gte,
  lte,
} from "drizzle-orm";
import adminAuthMiddleware from "../middlewares/adminAuth";
import {
  SHOP_STATUS,
  RIDER_APPLICATION_STATUS,
  RIDER_AVAILABILITY_STATUS,
  ORDER_STATUS,
} from "../lib/constant";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { userTable } from "../lib/db/schema/auth.schema";
import { riderTable } from "../lib/db/schema/rider.schema";
import { orderTable } from "../lib/db/schema/order.schema";
import {
  promotions,
  promotionProducts,
  promotionShops,
} from "../lib/db/schema/promotion.schema";
import {
  createPromotionSchema,
  updatePromotionSchema,
} from "../lib/validation/index";
import { nanoid } from "nanoid";
import { PushNotificationService } from "../services/push-notification.service";
import { calculateDistance } from "../lib/utils/geo";
import { env } from "cloudflare:workers";

// Helper function to calculate time ago
function getTimeAgo(date: Date | string | null): string {
  if (!date) return "unknown";
  const now = new Date();
  const orderDate = new Date(date);
  const diffInMinutes = Math.floor(
    (now.getTime() - orderDate.getTime()) / (1000 * 60)
  );

  if (diffInMinutes < 1) return "just now";
  if (diffInMinutes < 60)
    return `${diffInMinutes} min${diffInMinutes > 1 ? "s" : ""} ago`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24)
    return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;

  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
}

const adminRoute = factory
  .createApp()
  .use("*", adminAuthMiddleware)

  // Dashboard statistics endpoint
  .get("/dashboard/stats", async (c) => {
    try {
      const db = c.get("db");

      // Get current date ranges
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Get total orders count
      const [totalOrdersResult] = await db
        .select({ count: sql`COUNT(*)`.mapWith(Number) })
        .from(orderTable);

      const totalOrders = totalOrdersResult?.count || 0;

      // Get total revenue (sum of all completed orders)
      const [totalRevenueResult] = await db
        .select({
          revenue:
            sql`COALESCE(SUM(CASE WHEN ${orderTable.status} IN ('COMPLETED', 'DELIVERED') THEN ${orderTable.total} ELSE 0 END), 0)`.mapWith(
              Number
            ),
        })
        .from(orderTable);

      const totalRevenue = totalRevenueResult?.revenue || 0;

      // Get total vendors count
      const [totalVendorsResult] = await db
        .select({ count: sql`COUNT(*)`.mapWith(Number) })
        .from(shopTable)
        .where(eq(shopTable.status, "APPROVED"));

      const totalVendors = totalVendorsResult?.count || 0;

      // Get total riders count
      const [totalRidersResult] = await db
        .select({ count: sql`COUNT(*)`.mapWith(Number) })
        .from(riderTable)
        .where(
          and(
            eq(riderTable.applicationStatus, "APPROVED"),
            eq(riderTable.active, true)
          )
        );

      const totalRiders = totalRidersResult?.count || 0;

      // Get total customers count
      const [totalCustomersResult] = await db
        .select({ count: sql`COUNT(*)`.mapWith(Number) })
        .from(userTable)
        .where(eq(userTable.role, "user"));

      const totalCustomers = totalCustomersResult?.count || 0; // Get active deliveries count (orders in progress)
      const [activeDeliveriesResult] = await db
        .select({ count: sql`COUNT(*)`.mapWith(Number) })
        .from(orderTable)
        .where(
          sql`${orderTable.status} IN ('CONFIRMED', 'PREPARING', 'READY', 'RIDER_ASSIGNED', 'PICKED_UP')`
        );

      const activeDeliveries = activeDeliveriesResult?.count || 0;

      // Calculate average delivery time for completed orders
      const completedOrdersWithTimes = await db
        .select({
          createdAt: orderTable.createdAt,
          deliveredAt: orderTable.deliveredAt,
        })
        .from(orderTable)
        .where(
          and(
            sql`${orderTable.status} IN ('COMPLETED', 'DELIVERED')`,
            sql`${orderTable.deliveredAt} IS NOT NULL`
          )
        )
        .limit(100); // Last 100 orders for performance

      let averageDeliveryTime = 0;
      if (completedOrdersWithTimes.length > 0) {
        const totalTime = completedOrdersWithTimes.reduce((sum, order) => {
          if (order.createdAt && order.deliveredAt) {
            const created = new Date(order.createdAt);
            const delivered = new Date(order.deliveredAt);
            const timeDiff = delivered.getTime() - created.getTime();
            return sum + (timeDiff > 0 ? timeDiff : 0);
          }
          return sum;
        }, 0);
        averageDeliveryTime = Math.round(
          totalTime / completedOrdersWithTimes.length / (1000 * 60)
        ); // Convert to minutes
      }

      // Platform commission (hardcoded for now, can be made configurable)
      const platformCommission = 15; // 15% commission

      return c.json({
        success: true,
        data: {
          totalOrders,
          totalRevenue,
          totalVendors,
          totalRiders,
          totalCustomers,
          activeDeliveries,
          averageDeliveryTime,
          platformCommission,
        },
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      return c.json({ error: "Failed to fetch dashboard statistics" }, 500);
    }
  })

  // Get all vendors
  .get(
    "/vendors",
    zValidator(
      "query",
      z.object({
        search: z.string().optional(),
        status: z.enum(SHOP_STATUS).optional(),
        isVerified: z.string().optional(),
      })
    ),
    async (c) => {
      try {
        const db = c.get("db");
        const { search, status, isVerified } = c.req.valid("query");

        const whereConditions = [];

        if (search) {
          whereConditions.push(
            or(
              like(shopTable.name, `%${search}%`),
              like(shopTable.email, `%${search}%`),
              like(shopTable.phoneNumber, `%${search}%`)
            )
          );
        }

        if (status) {
          whereConditions.push(eq(shopTable.status, status));
        }
        if (isVerified !== undefined) {
          whereConditions.push(eq(shopTable.isVerified, isVerified === "true"));
        } // Get vendors with their current owners
        const vendors = await db.query.shopTable.findMany({
          where:
            whereConditions.length > 0 ? and(...whereConditions) : undefined,
          with: {
            members: {
              where: eq(member.role, "owner"),
              with: {
                user: {
                  columns: {
                    id: true,
                    name: true,
                    email: true,
                    phoneNumber: true,
                    image: true,
                  },
                },
              },
            },
          },
        });

        const vendorsWithOwners = vendors.map((vendor) => ({
          ...vendor,
          owner: vendor.members[0]?.user || null,
          members: undefined, // Remove members array from response
        }));

        return c.json({
          success: true,
          data: vendorsWithOwners,
        });
      } catch (error) {
        console.error("Error fetching vendors:", error);
        return c.json(
          {
            success: false,
            message: "Failed to fetch vendors",
          },
          500
        );
      }
    }
  )

  // Get a specific vendor's profile
  .get("/vendors/:id", async (c) => {
    try {
      const db = c.get("db");
      const { id } = c.req.param();

      const vendor = await db.query.shopTable.findFirst({
        where: eq(shopTable.id, id),
        with: {
          members: {
            where: eq(member.role, "owner"),
            with: {
              user: true,
            },
          },
          operatingHours: true,
          paymentMethods: true,
        },
      });

      if (!vendor) {
        return c.json({ error: "Vendor not found" }, 404);
      }

      // Format response
      const vendorProfile = {
        ...vendor,
        owner: vendor.members[0]?.user || null,
        members: undefined, // Remove members array from response
      };

      return c.json({
        success: true,
        data: vendorProfile,
      });
    } catch (error) {
      console.error("Error fetching vendor profile:", error);
      return c.json({ error: "Failed to fetch vendor profile" }, 500);
    }
  })

  // Update vendor status
  .patch(
    "/vendors/:id/status",
    zValidator(
      "json",
      z.object({
        status: z.enum(SHOP_STATUS),
        active: z.boolean().optional(),
      })
    ),
    async (c) => {
      try {
        const db = c.get("db");
        const { id } = c.req.param();
        const { status, active } = c.req.valid("json");

        // Check if vendor exists
        const vendor = await db.query.shopTable.findFirst({
          where: eq(shopTable.id, id),
        });

        if (!vendor) {
          return c.json({ error: "Vendor not found" }, 404);
        }

        // Update vendor status
        const updatedVendor = await db
          .update(shopTable)
          .set({
            status,
            active: active !== undefined ? active : status === "APPROVED",
          })
          .where(eq(shopTable.id, id));

        return c.json({
          success: true,
          data: updatedVendor,
        });
      } catch (error) {
        console.error("Error updating vendor status:", error);
        return c.json({ error: "Failed to update vendor status" }, 500);
      }
    }
  )

  // Delete vendor
  .delete("/vendors/:id", async (c) => {
    try {
      const db = c.get("db");
      const { id } = c.req.param();

      // Check if vendor exists
      const vendor = await db.query.shopTable.findFirst({
        where: eq(shopTable.id, id),
      });

      if (!vendor) {
        return c.json({ error: "Vendor not found" }, 404);
      }

      // Delete vendor (this will cascade to all related tables)
      await db.delete(shopTable).where(eq(shopTable.id, id));

      return c.json({
        success: true,
        message: "Vendor deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting vendor:", error);
      return c.json({ error: "Failed to delete vendor" }, 500);
    }
  })

  // RIDER ROUTES

  // Get all riders with filtering
  .get(
    "/riders",
    zValidator(
      "query",
      z.object({
        search: z.string().optional(),
        applicationStatus: z.enum(RIDER_APPLICATION_STATUS).optional(),
        isVerified: z.string().optional(),
        availabilityStatus: z.enum(RIDER_AVAILABILITY_STATUS).optional(),
        active: z.string().optional(),
      })
    ),
    async (c) => {
      try {
        const db = c.get("db");
        const {
          search,
          applicationStatus,
          isVerified,
          availabilityStatus,
          active,
        } = c.req.valid("query");

        const whereConditions = [];

        if (search) {
          whereConditions.push(
            or(
              like(riderTable.firstName, `%${search}%`),
              like(riderTable.lastName, `%${search}%`),
              like(riderTable.email, `%${search}%`)
            )
          );
        }
        if (applicationStatus) {
          whereConditions.push(
            eq(riderTable.applicationStatus, applicationStatus)
          );
        }
        if (isVerified !== undefined) {
          // Map isVerified boolean to applicationStatus
          const targetStatus = isVerified === "true" ? "APPROVED" : "DRAFT";
          whereConditions.push(eq(riderTable.applicationStatus, targetStatus));
        }

        if (availabilityStatus) {
          whereConditions.push(
            eq(riderTable.availabilityStatus, availabilityStatus)
          );
        }

        if (active !== undefined) {
          whereConditions.push(eq(riderTable.active, active === "true"));
        }

        // Get riders with their user accounts
        const riders = await db.query.riderTable.findMany({
          where:
            whereConditions.length > 0 ? and(...whereConditions) : undefined,
          with: {
            user: {
              columns: {
                id: true,
                name: true,
                email: true,
                phoneNumber: true,
                image: true,
              },
            },
          },
        });

        return c.json({
          success: true,
          data: riders,
        });
      } catch (error) {
        console.error("Error fetching riders:", error);
        return c.json(
          {
            success: false,
            message: "Failed to fetch riders",
          },
          500
        );
      }
    }
  )

  // Get a specific rider's details
  .get("/riders/:id", async (c) => {
    try {
      const db = c.get("db");
      const { id } = c.req.param();
      const rider = await db.query.riderTable.findFirst({
        where: eq(riderTable.id, id),
        with: {
          user: true,
          paymentMethod: true,
        },
      });

      if (!rider) {
        return c.json({ error: "Rider not found" }, 404);
      }

      return c.json({
        success: true,
        data: rider,
      });
    } catch (error) {
      console.error("Error fetching rider details:", error);
      return c.json({ error: "Failed to fetch rider details" }, 500);
    }
  })

  // Update rider status (verification, application status, availability)
  .patch(
    "/riders/:id/status",
    zValidator(
      "json",
      z.object({
        applicationStatus: z.enum(RIDER_APPLICATION_STATUS).optional(),
        isVerified: z.boolean().optional(),
        active: z.boolean().optional(),
        availabilityStatus: z.enum(RIDER_AVAILABILITY_STATUS).optional(),
      })
    ),
    async (c) => {
      try {
        const db = c.get("db");
        const { id } = c.req.param();
        const updates = c.req.valid("json");

        // Check if rider exists
        const rider = await db.query.riderTable.findFirst({
          where: eq(riderTable.id, id),
        });

        if (!rider) {
          return c.json({ error: "Rider not found" }, 404);
        }

        // Update rider status
        const [updatedRider] = await db
          .update(riderTable)
          .set(updates)
          .where(eq(riderTable.id, id))
          .returning();

        return c.json({
          success: true,
          data: updatedRider,
        });
      } catch (error) {
        console.error("Error updating rider status:", error);
        return c.json({ error: "Failed to update rider status" }, 500);
      }
    }
  )
  // Delete rider
  .delete("/riders/:id", async (c) => {
    try {
      const db = c.get("db");
      const { id } = c.req.param();

      // Check if rider exists
      const rider = await db.query.riderTable.findFirst({
        where: eq(riderTable.id, id),
      });

      if (!rider) {
        return c.json({ error: "Rider not found" }, 404);
      }

      // Delete rider
      await db.delete(riderTable).where(eq(riderTable.id, id));

      return c.json({
        success: true,
        message: "Rider deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting rider:", error);
      return c.json({ error: "Failed to delete rider" }, 500);
    }
  })

  // ORDER ROUTES
  // Get all orders with admin-level filtering
  .get(
    "/orders",
    zValidator(
      "query",
      z.object({
        search: z.string().optional(),
        status: z.enum(ORDER_STATUS).optional(),
        paymentStatus: z
          .enum([
            "PENDING",
            "COMPLETED",
            "FAILED",
            "REFUNDED",
            "DISPUTED",
            "REVERSED",
          ])
          .optional(),
        shopId: z.string().optional(),
        customerId: z.string().optional(),
        riderId: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        page: z.string().optional(),
        limit: z.string().optional(),
      })
    ),
    async (c) => {
      try {
        const db = c.get("db");
        const {
          search,
          status,
          paymentStatus,
          shopId,
          customerId,
          riderId,
          startDate,
          endDate,
          page,
          limit,
        } = c.req.valid("query");

        // Pagination
        const pageNum = parseInt(page || "1");
        const limitNum = parseInt(limit || "20");
        const offset = (pageNum - 1) * limitNum;

        const whereConditions = [];

        // Search across order fields
        if (search) {
          whereConditions.push(
            or(
              like(orderTable.id, `%${search}%`),
              like(orderTable.code, `%${search}%`),
              like(orderTable.addressName, `%${search}%`)
            )
          );
        }

        // Filter by status
        if (status) {
          whereConditions.push(eq(orderTable.status, status));
        }

        // Filter by payment status
        if (paymentStatus) {
          whereConditions.push(eq(orderTable.paymentStatus, paymentStatus));
        }

        // Filter by shop
        if (shopId) {
          whereConditions.push(eq(orderTable.shopId, shopId));
        }

        // Filter by customer
        if (customerId) {
          whereConditions.push(eq(orderTable.customerId, customerId));
        }

        // Filter by rider
        if (riderId) {
          whereConditions.push(eq(orderTable.riderId, riderId));
        }

        // Filter by date range
        if (startDate) {
          whereConditions.push(gte(orderTable.createdAt, new Date(startDate)));
        }

        if (endDate) {
          whereConditions.push(lte(orderTable.createdAt, new Date(endDate)));
        }

        const finalWhereCondition =
          whereConditions.length > 0 ? and(...whereConditions) : undefined; // Get orders with all related data
        const orders = await db.query.orderTable.findMany({
          where: finalWhereCondition,
          with: {
            items: {
              with: {
                menuItem: {
                  columns: {
                    id: true,
                    name: true,
                    imageUrl: true,
                    price: true,
                  },
                },
                options: {
                  with: {
                    optionGroup: true,
                  },
                },
              },
            },
            shop: {
              columns: {
                id: true,
                name: true,
                email: true,
                phoneNumber: true,
                address: true,
                latitude: true,
                longitude: true,
              },
            },
            customer: {
              columns: {
                id: true,
                name: true,
                email: true,
                phoneNumber: true,
              },
            },
            rider: {
              columns: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                availabilityStatus: true,
                rating: true,
              },
              with: {
                user: {
                  columns: {
                    phoneNumber: true,
                  },
                },
              },
            },
          },
          orderBy: [desc(orderTable.createdAt)],
          limit: limitNum,
          offset: offset,
        });

        // Get total count for pagination
        const totalCountResult = await db
          .select({ count: sql`count(*)` })
          .from(orderTable)
          .where(finalWhereCondition);

        const totalCount = Number(totalCountResult[0]?.count || 0);

        return c.json({
          success: true,
          data: orders,
          pagination: {
            total: totalCount,
            page: pageNum,
            limit: limitNum,
            pages: Math.ceil(totalCount / limitNum),
          },
        });
      } catch (error) {
        console.error("Error fetching orders:", error);
        return c.json(
          {
            success: false,
            message: "Failed to fetch orders",
          },
          500
        );
      }
    }
  )

  // Get specific order details with full information
  .get("/orders/:id", async (c) => {
    try {
      const db = c.get("db");
      const { id } = c.req.param();
      const order = await db.query.orderTable.findFirst({
        where: eq(orderTable.id, id),
        with: {
          items: {
            with: {
              menuItem: {
                columns: {
                  id: true,
                  name: true,
                  imageUrl: true,
                  price: true,
                },
              },
              options: {
                with: {
                  optionGroup: true,
                },
              },
            },
          },
          shop: {
            with: {
              operatingHours: true,
              paymentMethods: true,
            },
            columns: {
              location: false,
            },
          },
          customer: true,
          rider: {
            with: {
              user: true,
              paymentMethod: true,
            },
          },
        },
      });

      if (!order) {
        return c.json({ error: "Order not found" }, 404);
      }

      return c.json({
        success: true,
        data: order,
      });
    } catch (error) {
      console.error("Error fetching order:", error);
      return c.json({ error: "Failed to fetch order" }, 500);
    }
  })
  // Enhanced admin order status management with full workflow integration
  .patch(
    "/orders/:id/status",
    zValidator(
      "json",
      z.object({
        status: z.enum(ORDER_STATUS),
        paymentStatus: z
          .enum(["PENDING", "PAID", "FAILED", "REFUNDED"])
          .optional(),
        adminNotes: z.string().optional(),
        cancelReason: z.string().optional(),
      })
    ),
    async (c) => {
      try {
        const db = c.get("db");
        const { id } = c.req.param();
        const { status, paymentStatus, adminNotes, cancelReason } =
          c.req.valid("json");
        const user = c.get("user");
        const env = c.env as any;

        // Check if order exists
        const order = await db.query.orderTable.findFirst({
          where: eq(orderTable.id, id),
          with: {
            shop: {
              columns: {
                id: true,
                name: true,
              },
            },
          },
        });

        if (!order) {
          return c.json({ error: "Order not found" }, 404);
        }

        // Validate status transitions
        const validTransitions: Record<string, string[]> = {
          PAYMENT_CONFIRMED: ["CONFIRMED", "CANCELLED"],
          CONFIRMED: ["READY", "CANCELLED"],
          READY: ["RIDER_ASSIGNED", "CANCELLED"],
          RIDER_ASSIGNED: ["IN_TRANSIT", "CANCELLED"],
          IN_TRANSIT: ["DELIVERED"],
          DELIVERED: ["COMPLETED"],
        };

        if (
          validTransitions[order.status] &&
          !validTransitions[order.status].includes(status)
        ) {
          return c.json(
            {
              error: `Invalid status transition from ${order.status} to ${status}`,
              validTransitions: validTransitions[order.status],
            },
            400
          );
        }

        // Prepare update data with proper timestamps
        const nowISO = new Date().toISOString();
        const updateData: any = {
          status,
          updatedAt: new Date(),
        };

        // Set specific timestamps based on status
        switch (status) {
          case "CONFIRMED":
            updateData.acceptedAt = nowISO;
            break;
          case "READY":
            updateData.readyAt = nowISO;
            break;
          case "CANCELLED":
            updateData.canceledAt = nowISO;
            updateData.cancelReason =
              cancelReason || adminNotes || "Admin cancelled order";
            break;
        }

        if (paymentStatus) {
          updateData.paymentStatus = paymentStatus;
        }

        if (adminNotes) {
          updateData.vendorNotes = adminNotes;
        }

        // Update order in database
        const updatedOrder = await db
          .update(orderTable)
          .set(updateData)
          .where(eq(orderTable.id, id));

        // Enhanced workflow integration - matches vendor functionality exactly
        try {
          const workflowInstance = await env.ORDER_WORKFLOW.get(id);

          if (workflowInstance) {
            let eventType = "";
            let eventPayload: {
              orderId: string;
              status: string;
              timestamp: string;
              [key: string]: any;
            } = {
              orderId: id,
              status,
              timestamp: nowISO,
            };

            switch (status) {
              case "CONFIRMED":
                eventType = "vendor_order_response";
                eventPayload = {
                  ...eventPayload,
                  vendorId: order.shopId,
                  accepted: true,
                  adminOverride: true,
                  adminId: user?.id || "unknown",
                  adminEmail: user?.email || "unknown",
                };
                break;
              case "READY":
                eventType = "order_ready";
                eventPayload = {
                  ...eventPayload,
                  adminOverride: true,
                  adminId: user?.id || "unknown",
                  adminEmail: user?.email || "unknown",
                };
                break;
              case "CANCELLED":
                eventType = "vendor_order_response";
                eventPayload = {
                  ...eventPayload,
                  vendorId: order.shopId,
                  accepted: false,
                  reason: cancelReason || adminNotes || "Admin cancelled order",
                  cancelledBy: user?.id || "unknown",
                  adminOverride: true,
                  adminId: user?.id || "unknown",
                  adminEmail: user?.email || "unknown",
                };
                break;
            }

            if (eventType) {
              await workflowInstance.sendEvent({
                type: eventType,
                payload: eventPayload,
              });
              console.log(
                `✅ [ADMIN-STATUS] Sent ${eventType} event to workflow for order ${id} by admin ${user?.email}`
              );
            }
          } else {
            console.warn(
              `⚠️ [ADMIN-STATUS] Workflow instance not found for order ${id}`
            );
          }
        } catch (workflowError) {
          console.error(
            `⚠️ [ADMIN-STATUS] Failed to notify workflow about admin status change for order ${id}:`,
            workflowError
          );
          // Continue execution - don't fail the status update if workflow notification fails
        }

        // Log admin action for audit trail
        console.log(
          `✅ [ADMIN-STATUS] Admin ${user?.email} (${user?.id}) updated order ${id} status from ${order.status} to ${status}${
            order.shop?.name ? ` for shop "${order.shop.name}"` : ""
          }`
        );

        // Send notifications to relevant parties
        try {
          const { PushNotificationService } = await import(
            "../services/push-notification.service"
          );
          const pushNotificationService = new PushNotificationService();

          // Notify shop about admin status override
          if (
            order.shopId &&
            ["CONFIRMED", "READY", "CANCELLED"].includes(status)
          ) {
            const shopNotification = {
              title: `🛡️ Admin Status Update`,
              body: `Order #${id.slice(-6)} status updated to ${status} by admin${
                adminNotes ? `: ${adminNotes}` : ""
              }`,
              data: {
                type: "admin_status_override",
                orderId: id,
                newStatus: status,
                adminId: user?.id || "unknown",
                adminEmail: user?.email || "unknown",
                action: "view_order",
                link: `/vendor/orders/${id}`,
                category: "vendor",
                urgency: status === "CANCELLED" ? "high" : "medium",
              },
            };

            c.executionCtx.waitUntil(
              pushNotificationService.sendNotificationToShop(
                order.shopId,
                shopNotification
              )
            );
          }
        } catch (notificationError) {
          console.error(
            `⚠️ [ADMIN-STATUS] Failed to send notifications for order ${id}:`,
            notificationError
          );
        }

        return c.json({
          success: true,
          data: updatedOrder,
          message: `Order status updated to ${status} successfully`,
          adminAction: {
            adminId: user?.id,
            adminEmail: user?.email,
            timestamp: nowISO,
            previousStatus: order.status,
            newStatus: status,
            notes: adminNotes,
          },
        });
      } catch (error) {
        console.error(`❌ [ADMIN-STATUS] Error updating order status:`, error);
        return c.json({ error: "Failed to update order status" }, 500);
      }
    }
  )

  // Get available riders for manual assignment
  .get("/orders/:id/available-riders", async (c) => {
    try {
      const db = c.get("db");
      const { id } = c.req.param();

      // Check if order exists and is in correct status
      const order = await db.query.orderTable.findFirst({
        where: eq(orderTable.id, id),
        with: {
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
      });

      if (!order) {
        return c.json({ error: "Order not found" }, 404);
      }
      if (!order.shop) {
        return c.json({ error: "Shop information not available" }, 404);
      }

      const shopLat = order.shop.latitude;
      const shopLng = order.shop.longitude;

      if (!shopLat || !shopLng) {
        return c.json({ error: "Shop location not available" }, 404);
      }

      // Find ALL active riders - no distance or availability filtering
      const allActiveRiders = await db.query.riderTable.findMany({
        where: and(
          eq(riderTable.active, true),
          eq(riderTable.applicationStatus, "APPROVED")
        ),
        columns: {
          id: true,
          userId: true,
          firstName: true,
          lastName: true,
          latitude: true,
          longitude: true,
          vehicleType: true,
          rating: true,
          availabilityStatus: true,
        },
      });

      // Calculate distances for all riders (for sorting purposes only)
      const ridersWithMetrics = allActiveRiders
        .map((rider) => {
          const pickupDistanceKm = calculateDistance(
            rider.latitude || 0,
            rider.longitude || 0,
            shopLat,
            shopLng
          );

          const deliveryDistanceKm = calculateDistance(
            shopLat,
            shopLng,
            order.latitude || 0,
            order.longitude || 0
          );

          const estimatedPickupMinutes = Math.round(
            (pickupDistanceKm / 15) * 60
          ); // 15 km/h average speed
          const estimatedDeliveryMinutes = Math.round(
            (deliveryDistanceKm / 15) * 60
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
        .sort((a, b) => {
          // Sort by distance (closest first) then by rating (highest first)
          const distanceDiff =
            a.metrics.totalDistanceKm - b.metrics.totalDistanceKm;
          if (distanceDiff !== 0) return distanceDiff;
          return (b.rider.rating || 0) - (a.rider.rating || 0);
        });

      // Format the response for admin UI
      const formattedRiders = ridersWithMetrics.map((riderInfo) => ({
        id: riderInfo.rider.id,
        name: `${riderInfo.rider.firstName || ""} ${riderInfo.rider.lastName || ""}`.trim(),
        email: riderInfo.rider.userId,
        vehicleType: riderInfo.rider.vehicleType,
        rating: riderInfo.rider.rating || 0,
        availabilityStatus: riderInfo.rider.availabilityStatus,
        distanceFromPickup: riderInfo.metrics.pickupDistanceKm,
        estimatedArrival: riderInfo.metrics.estimatedPickupMinutes,
        totalDistance: riderInfo.metrics.totalDistanceKm,
        estimatedDeliveryTime: riderInfo.metrics.estimatedDeliveryMinutes,
      }));

      return c.json({
        success: true,
        data: {
          order: {
            id: order.id,
            status: order.status,
            pickupLocation: {
              latitude: order.shop.latitude,
              longitude: order.shop.longitude,
            },
            deliveryLocation: {
              latitude: order.latitude,
              longitude: order.longitude,
            },
          },
          availableRiders: formattedRiders,
        },
      });
    } catch (error) {
      console.error("Error fetching available riders:", error);
      return c.json({ error: "Failed to fetch available riders" }, 500);
    }
  })

  // Manually assign rider to order
  .post(
    "/orders/:id/assign-rider",
    zValidator(
      "json",
      z.object({
        riderId: z.string(),
        adminNotes: z.string().optional(),
      })
    ),
    async (c) => {
      try {
        const db = c.get("db");
        const { id } = c.req.param();
        const { riderId, adminNotes } = c.req.valid("json");
        const user = c.get("user");
        const env = c.env as any;

        // Check if order exists and is assignable
        const order = await db.query.orderTable.findFirst({
          where: eq(orderTable.id, id),
        });

        if (!order) {
          return c.json({ error: "Order not found" }, 404);
        }
        if (order.status !== "READY") {
          return c.json(
            { error: "Order must be in READY status to assign rider" },
            400
          );
        } // Verify rider exists and is approved (no availability check needed)
        const rider = await db.query.riderTable.findFirst({
          where: and(
            eq(riderTable.id, riderId),
            eq(riderTable.active, true),
            eq(riderTable.applicationStatus, "APPROVED")
          ),
        });

        if (!rider) {
          return c.json({ error: "Rider not found or not approved" }, 400);
        } // Update order with rider assignment (no rider status change needed)
        await db.update(orderTable).set({
          riderId: rider.userId,
          status: "RIDER_ASSIGNED",
          riderAssignedAt: new Date().toISOString(),
          updatedAt: new Date(),
        });

        // Add admin notes if provided
        if (adminNotes) {
          await db.update(orderTable).set({
            vendorNotes: adminNotes,
            updatedAt: new Date(),
          });
        } // Notify workflow about the assignment
        try {
          const workflowInstance = await env.ORDER_WORKFLOW.get(id);
          await workflowInstance.sendEvent({
            type: "admin_rider_assigned",
            payload: {
              orderId: id,
              riderId: rider.userId,
              adminId: user?.id || "unknown",
              timestamp: new Date().toISOString(),
              riderName:
                `${rider.firstName || ""} ${rider.lastName || ""}`.trim(),
            },
          });
          console.log(
            `✅ Notified workflow about admin rider assignment for order ${id}`
          );
        } catch (workflowError) {
          console.error(
            `⚠️ Failed to notify workflow about admin rider assignment:`,
            workflowError
          );
        }

        console.log(
          `Admin ${user?.email} manually assigned rider ${riderId} to order ${id}`
        );
        return c.json({
          success: true,
          message: "Rider assigned successfully",
          data: {
            orderId: id,
            riderId: rider.userId,
            riderName:
              `${rider.firstName || ""} ${rider.lastName || ""}`.trim(),
          },
        });
      } catch (error) {
        console.error("Error assigning rider:", error);
        return c.json({ error: "Failed to assign rider" }, 500);
      }
    }
  )

  // Auto-assign closest available rider
  .post("/orders/:id/auto-assign-rider", async (c) => {
    try {
      const db = c.get("db");
      const { id } = c.req.param();
      const user = c.get("user");
      const env = c.env as any;

      // Check if order exists
      const order = await db.query.orderTable.findFirst({
        where: eq(orderTable.id, id),
      });

      if (!order) {
        return c.json({ error: "Order not found" }, 404);
      }
      if (order.status !== "READY") {
        return c.json(
          { error: "Order must be in READY status to assign rider" },
          400
        );
      }

      // Get order details including shop location
      const orderWithShop = await db.query.orderTable.findFirst({
        where: eq(orderTable.id, id),
        with: {
          shop: {
            columns: {
              latitude: true,
              longitude: true,
            },
          },
        },
      });
      if (!orderWithShop?.shop?.latitude || !orderWithShop?.shop?.longitude) {
        return c.json({ error: "Shop location not available" }, 400);
      }

      const shopLat = orderWithShop.shop.latitude;
      const shopLng = orderWithShop.shop.longitude;

      // Find ALL active approved riders - no filtering
      const allActiveRiders = await db.query.riderTable.findMany({
        where: and(
          eq(riderTable.active, true),
          eq(riderTable.applicationStatus, "APPROVED")
        ),
        columns: {
          id: true,
          userId: true,
          firstName: true,
          lastName: true,
          latitude: true,
          longitude: true,
          vehicleType: true,
          rating: true,
        },
      });

      if (allActiveRiders.length === 0) {
        return c.json({ error: "No active riders found" }, 400);
      }

      // Calculate distances and find the closest rider
      const ridersWithDistance = allActiveRiders
        .map((rider) => {
          const pickupDistanceKm = calculateDistance(
            rider.latitude || 0,
            rider.longitude || 0,
            shopLat,
            shopLng
          );

          const deliveryDistanceKm = calculateDistance(
            shopLat,
            shopLng,
            orderWithShop.latitude || 0,
            orderWithShop.longitude || 0
          );

          return {
            rider,
            pickupDistanceKm,
            deliveryDistanceKm,
            totalDistanceKm: pickupDistanceKm + deliveryDistanceKm,
          };
        })
        .sort((a, b) => {
          // Sort by total distance (closest first) then by rating (highest first)
          const distanceDiff = a.totalDistanceKm - b.totalDistanceKm;
          if (distanceDiff !== 0) return distanceDiff;
          return (b.rider.rating || 0) - (a.rider.rating || 0);
        });

      const closestRider = ridersWithDistance[0].rider;
      const shortestDistance = ridersWithDistance[0].pickupDistanceKm; // Assign the closest rider (no rider status change needed)
      await db.update(orderTable).set({
        riderId: closestRider.userId,
        status: "RIDER_ASSIGNED",
        riderAssignedAt: new Date().toISOString(),
        updatedAt: new Date(),
      });
      // Notify workflow about the assignment
      try {
        const workflowInstance = await env.ORDER_WORKFLOW.get(id);
        await workflowInstance.sendEvent({
          type: "admin_rider_assigned",
          payload: {
            orderId: id,
            riderId: closestRider.userId,
            adminId: user?.id || "unknown",
            timestamp: new Date().toISOString(),
            riderName:
              `${closestRider.firstName || ""} ${closestRider.lastName || ""}`.trim(),
          },
        });
        console.log(
          `✅ Notified workflow about admin auto-assignment for order ${id}`
        );
      } catch (workflowError) {
        console.error(
          `⚠️ Failed to notify workflow about admin auto-assignment:`,
          workflowError
        );
      }

      console.log(`Admin ${user?.email} auto-assigned rider to order ${id}`);

      return c.json({
        success: true,
        message: "Rider auto-assigned successfully",
        data: {
          orderId: id,
          riderId: closestRider.userId,
          riderName:
            `${closestRider.firstName || ""} ${closestRider.lastName || ""}`.trim(),
          distance: shortestDistance,
        },
      });
    } catch (error) {
      console.error("Error auto-assigning rider:", error);
      return c.json({ error: "Failed to auto-assign rider" }, 500);
    }
  })

  // PROMOTION ROUTES// List all promotions (admin)
  .get("/promotions", async (c) => {
    try {
      const db = c.get("db");

      // Pagination parameters
      const limit = Number(c.req.query("limit")) || 20;
      const page = Number(c.req.query("page")) || 1;
      const offset = (page - 1) * limit;
      const shopId = c.req.query("shopId");

      let whereCondition;
      if (shopId) {
        // For filtering by specific shop, we need to join with promotionShops
        const promotionIdsForShop = await db
          .select({ promotionId: promotionShops.promotionId })
          .from(promotionShops)
          .where(eq(promotionShops.shopId, shopId));

        const promotionIds = promotionIdsForShop.map((p) => p.promotionId);
        if (promotionIds.length > 0) {
          whereCondition = inArray(promotions.id, promotionIds);
        } else {
          whereCondition = sql`1 = 0`; // No promotions found for this shop
        }
      }

      // Get promotions
      const allPromotions = await db.query.promotions.findMany({
        where: whereCondition,
        orderBy: (promotions, { desc }) => [desc(promotions.createdAt)],
        limit,
        offset,
        with: {
          creator: {
            columns: {
              id: true,
              name: true,
              email: true,
            },
          },
          shops: {
            with: {
              shop: {
                columns: {
                  id: true,
                  name: true,
                  email: true,
                  phoneNumber: true,
                },
              },
            },
          },
        },
      });

      // Get total count for pagination
      const countResult = await db
        .select({ count: sql`count(*)` })
        .from(promotions)
        .where(whereCondition || undefined);

      const totalCount = Number(countResult[0]?.count || 0);

      return c.json({
        success: true,
        data: allPromotions,
        pagination: {
          total: totalCount,
          page,
          limit,
          pages: Math.ceil(totalCount / limit),
        },
      });
    } catch (error) {
      console.error("Error fetching promotions:", error);
      return c.json(
        {
          success: false,
          message: "Failed to fetch promotions",
        },
        500
      );
    }
  })
  // Get a specific promotion by ID
  .get("/promotions/:id", async (c) => {
    try {
      const db = c.get("db");
      const { id } = c.req.param();

      // Get the promotion
      const promotion = await db.query.promotions.findFirst({
        where: eq(promotions.id, id),
        with: {
          products: true,
          creator: {
            columns: {
              id: true,
              name: true,
              email: true,
            },
          },
          shops: {
            with: {
              shop: {
                columns: {
                  id: true,
                  name: true,
                  email: true,
                  phoneNumber: true,
                },
              },
            },
          },
        },
      });

      if (!promotion) {
        return c.json(
          {
            success: false,
            message: "Promotion not found",
          },
          404
        );
      }

      return c.json({
        success: true,
        data: promotion,
      });
    } catch (error) {
      console.error("Error fetching promotion:", error);
      return c.json(
        {
          success: false,
          message: "Failed to fetch promotion",
        },
        500
      );
    }
  })
  // Create a new promotion (admin can assign to multiple shops)
  .post("/promotions", zValidator("json", createPromotionSchema), async (c) => {
    try {
      const data = c.req.valid("json");
      const db = c.get("db");
      const user = c.get("user");

      if (!user) {
        return c.json(
          {
            success: false,
            message: "Unauthorized",
          },
          401
        );
      }

      // Check if code is already in use (globally unique)
      const existingPromotion = await db.query.promotions.findFirst({
        where: eq(promotions.code, data.code),
      });

      if (existingPromotion) {
        return c.json(
          {
            success: false,
            message: "This coupon code is already in use",
          },
          400
        );
      }

      // Extract fields for processing
      const { productIds, shopIds, ...promotionData } = data;

      // Create the promotion
      const promotionId = nanoid();
      const now = new Date();

      const newPromotion = await db
        .insert(promotions)
        .values({
          id: promotionId,
          ...promotionData,
          startDate: new Date(promotionData.startDate),
          endDate: new Date(promotionData.endDate),
          createdBy: user.id,
          usageCount: 0,
        })
        .returning();
      // Link shops to promotion - but skip if applies to all shops
      if (!promotionData.appliesToAllShops && shopIds && shopIds.length > 0) {
        await db.insert(promotionShops).values(
          shopIds.map((shopId) => ({
            id: nanoid(),
            promotionId: promotionId,
            shopId: shopId,
          }))
        );
      }

      // Link products if specified
      if (productIds && productIds.length > 0) {
        await db.insert(promotionProducts).values(
          productIds.map((productId) => ({
            id: nanoid(),
            promotionId: promotionId,
            productId: productId,
          }))
        );
      }

      return c.json(
        {
          success: true,
          data: newPromotion,
        },
        201
      );
    } catch (error) {
      console.error("Error creating promotion:", error);
      return c.json(
        {
          success: false,
          message: "Failed to create promotion",
        },
        500
      );
    }
  })
  // Update an existing promotion
  .patch(
    "/promotions/:id",
    zValidator("json", updatePromotionSchema),
    async (c) => {
      try {
        const { id } = c.req.param();
        const data = c.req.valid("json");
        const db = c.get("db");

        // Check if promotion exists
        const existingPromotion = await db.query.promotions.findFirst({
          where: eq(promotions.id, id),
        });

        if (!existingPromotion) {
          return c.json(
            {
              success: false,
              message: "Promotion not found",
            },
            404
          );
        }

        // If updating code, check if it's unique
        if (data.code && data.code !== existingPromotion.code) {
          const codeExists = await db.query.promotions.findFirst({
            where: and(
              eq(promotions.code, data.code),
              dbNot(eq(promotions.id, id))
            ),
          });

          if (codeExists) {
            return c.json(
              {
                success: false,
                message: "This coupon code is already in use",
              },
              400
            );
          }
        }

        // Extract fields for processing
        const { productIds, shopIds, startDate, endDate, ...promotionData } =
          data;

        // Convert date strings to Date objects if provided
        const dateFields: { startDate?: Date; endDate?: Date } = {};
        if (startDate) dateFields.startDate = new Date(startDate);
        if (endDate) dateFields.endDate = new Date(endDate);

        // Update the promotion
        const now = new Date();
        const [updatedPromotion] = await db
          .update(promotions)
          .set({
            ...promotionData,
            ...dateFields,
            updatedAt: now,
          })
          .where(eq(promotions.id, id))
          .returning();
        // Update shop links if specified
        if (shopIds !== undefined) {
          // Remove existing shop links
          await db
            .delete(promotionShops)
            .where(eq(promotionShops.promotionId, id));

          // Add new shop links if not "applies to all shops"
          if (!promotionData.appliesToAllShops && shopIds.length > 0) {
            await db.insert(promotionShops).values(
              shopIds.map((shopId) => ({
                id: nanoid(),
                promotionId: id,
                shopId: shopId,
                createdAt: now,
                updatedAt: now,
              }))
            );
          }
        }

        // Update product links if specified
        if (productIds !== undefined) {
          // Remove existing product links
          await db
            .delete(promotionProducts)
            .where(eq(promotionProducts.promotionId, id));

          // Add new product links
          if (productIds.length > 0) {
            await db.insert(promotionProducts).values(
              productIds.map((productId) => ({
                id: nanoid(),
                promotionId: id,
                productId: productId,
                createdAt: now,
                updatedAt: now,
              }))
            );
          }
        }

        return c.json({
          success: true,
          data: updatedPromotion,
        });
      } catch (error) {
        console.error("Error updating promotion:", error);
        return c.json(
          {
            success: false,
            message: "Failed to update promotion",
          },
          500
        );
      }
    }
  )
  // Delete a promotion
  .delete("/promotions/:id", async (c) => {
    try {
      const { id } = c.req.param();
      const db = c.get("db");

      // Check if promotion exists
      const existingPromotion = await db.query.promotions.findFirst({
        where: eq(promotions.id, id),
      });

      if (!existingPromotion) {
        return c.json(
          {
            success: false,
            message: "Promotion not found",
          },
          404
        );
      }

      // Delete shop links first
      await db.delete(promotionShops).where(eq(promotionShops.promotionId, id));

      // Delete product links
      await db
        .delete(promotionProducts)
        .where(eq(promotionProducts.promotionId, id));

      // Delete the promotion
      await db.delete(promotions).where(eq(promotions.id, id));

      return c.json({
        success: true,
        message: "Promotion deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting promotion:", error);
      return c.json(
        {
          success: false,
          message: "Failed to delete promotion",
        },
        500
      );
    }
  });

export default adminRoute;
