import { factory } from "../lib/factory";
import { shopTable, member } from "../lib/db/schema";
import { eq, like, and, or, not as dbNot, sql } from "drizzle-orm";
import adminAuthMiddleware from "../middlewares/adminAuth";
import {
  SHOP_STATUS,
  RIDER_APPLICATION_STATUS,
  RIDER_AVAILABILITY_STATUS,
} from "../lib/constant";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { userTable } from "../lib/db/schema/auth.schema";
import { riderTable } from "../lib/db/schema/rider.schema";
import {
  promotions,
  promotionProducts,
} from "../lib/db/schema/promotion.schema";
import {
  createPromotionSchema,
  updatePromotionSchema,
} from "../lib/validation/index";
import { nanoid } from "nanoid";

const adminRoute = factory
  .createApp()
  .use("*", adminAuthMiddleware)

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
          .where(eq(shopTable.id, id))
          .returning()
          .get();

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
          whereConditions.push(eq(riderTable.verified, isVerified === "true"));
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
        const updatedRider = await db
          .update(riderTable)
          .set(updates)
          .where(eq(riderTable.id, id))
          .returning()
          .get();

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

  // PROMOTION ROUTES

  // List all promotions (admin)
  .get("/promotions", async (c) => {
    try {
      const db = c.get("db");

      // Pagination parameters
      const limit = Number(c.req.query("limit")) || 20;
      const page = Number(c.req.query("page")) || 1;
      const offset = (page - 1) * limit;
      const shopId = c.req.query("shopId");

      const whereCondition = shopId ? eq(promotions.shopId, shopId) : undefined;

      // Get promotions
      const allPromotions = await db.query.promotions.findMany({
        where: whereCondition,
        orderBy: (promotions) => [promotions.createdAt],
        limit,
        offset,
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
          shop: {
            columns: {
              id: true,
              name: true,
              email: true,
              phoneNumber: true,
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

  // Create a new promotion for a specific shop
  .post("/promotions", zValidator("json", createPromotionSchema), async (c) => {
    try {
      const data = c.req.valid("json");
      const db = c.get("db");
      const shopId = c.req.query("shopId");

      if (!shopId) {
        return c.json(
          {
            success: false,
            message: "Shop ID is required",
          },
          400
        );
      }

      // Check if code is already in use
      const existingPromotion = await db.query.promotions.findFirst({
        where: and(
          eq(promotions.code, data.code),
          eq(promotions.shopId, shopId)
        ),
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

      // Extract product IDs if provided
      const { productIds, ...promotionData } = data;

      // Create the promotion
      const promotionId = nanoid();
      const now = new Date();

      const newPromotion = await db
        .insert(promotions)
        .values({
          id: promotionId,
          shopId,
          ...promotionData,
          usageCount: 0,
        })
        .returning()
        .get();

      // Link products if specified
      if (productIds && productIds.length > 0) {
        await db.insert(promotionProducts).values(
          productIds.map((productId) => ({
            id: nanoid(),
            promotionId: promotionId,
            productId: productId,
            createdAt: now,
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
              eq(promotions.shopId, existingPromotion.shopId),
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

        // Extract product IDs if provided
        const { productIds, ...promotionData } = data;

        // Update the promotion
        const now = new Date();
        const updatedPromotion = await db
          .update(promotions)
          .set({
            ...promotionData,
            updatedAt: now,
          })
          .where(eq(promotions.id, id))
          .returning()
          .get();

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

      // Delete product links first
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
