import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { Context } from "../lib/types";
import { z } from "zod";
import {
  promotions,
  promotionProducts,
} from "../lib/db/schema/promotion.schema";
import { eq, and, inArray, or, lt, gt } from "drizzle-orm";
import { nanoid } from "nanoid";
import { createAuth } from "../lib/auth";

const app = new Hono<Context>();

// Create promotion schema
const createPromotionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(3, "Code must be at least 3 characters").toUpperCase(),
  description: z.string().optional(),
  type: z.enum(["percentage", "fixed", "bogo", "minimum_spend"]),
  value: z.number().positive("Value must be positive"),
  minOrderValue: z.number().nonnegative().optional(),
  maxDiscount: z.number().nonnegative().optional(),
  buyQuantity: z.number().int().positive().optional(),
  getQuantity: z.number().int().positive().optional(),
  startDate: z.string().datetime(), // ISO date string
  endDate: z.string().datetime(), // ISO date string
  usageLimit: z.number().int().nonnegative().optional(),
  isActive: z.boolean().default(true),
  productIds: z.array(z.string()).optional(),
});

// Update promotion schema
const updatePromotionSchema = createPromotionSchema.partial();

// Validate coupon code schema
const validateCouponSchema = z.object({
  code: z.string().min(1, "Code is required"),
  shopId: z.string(),
  cartTotal: z.number().positive(),
});

// List active promotions (public)
app.get("/active", async (c) => {
  try {
    const db = c.get("db");
    const shopId = c.req.query("shopId");

    if (!shopId) {
      return c.json({ error: "Shop ID is required" }, 400);
    }

    const now = new Date().toISOString();

    // Get active promotions for the shop
    const activePromotions = await db.query.promotions.findMany({
      where: and(
        eq(promotions.shopId, shopId),
        eq(promotions.isActive, true),
        lt(promotions.startDate, now),
        gt(promotions.endDate, now)
      ),
      columns: {
        id: true,
        name: true,
        description: true,
        type: true,
        value: true,
        minOrderValue: true,
        endDate: true,
      },
    });

    return c.json({ data: activePromotions });
  } catch (error) {
    console.error("Error fetching active promotions:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Validate a coupon code
app.post("/validate", zValidator("json", validateCouponSchema), async (c) => {
  try {
    const { code, shopId, cartTotal } = c.req.valid("json");
    const db = c.get("db");
    const now = new Date().toISOString();

    // Find the promotion
    const promotion = await db.query.promotions.findFirst({
      where: and(
        eq(promotions.code, code.toUpperCase()),
        eq(promotions.shopId, shopId),
        eq(promotions.isActive, true),
        lt(promotions.startDate, now),
        gt(promotions.endDate, now)
      ),
    });

    if (!promotion) {
      return c.json({ error: "Invalid or expired coupon code" }, 400);
    }

    // Check if it's been used too many times
    if (
      promotion.usageLimit !== null &&
      promotion.usageCount >= promotion.usageLimit
    ) {
      return c.json({ error: "This coupon has reached its usage limit" }, 400);
    }

    // Check minimum order value
    if (
      promotion.minOrderValue !== null &&
      cartTotal < promotion.minOrderValue
    ) {
      return c.json(
        {
          error: `Order total must be at least ${promotion.minOrderValue} to use this coupon`,
          minOrderValue: promotion.minOrderValue,
        },
        400
      );
    }

    // Calculate discount
    let discount = 0;

    switch (promotion.type) {
      case "percentage":
        discount = cartTotal * (promotion.value / 100);
        // Apply max discount if specified
        if (
          promotion.maxDiscount !== null &&
          discount > promotion.maxDiscount
        ) {
          discount = promotion.maxDiscount;
        }
        break;

      case "fixed":
        discount = promotion.value;
        // Don't allow discount greater than cart total
        if (discount > cartTotal) {
          discount = cartTotal;
        }
        break;

      case "minimum_spend":
        if (cartTotal >= promotion.minOrderValue) {
          discount = promotion.value;
        }
        break;

      // BOGO is handled differently as it requires knowledge of specific cart items
      case "bogo":
        discount = 0; // This would need to be calculated based on actual cart items
        break;
    }

    return c.json({
      valid: true,
      data: {
        promotion,
        discount,
      },
    });
  } catch (error) {
    console.error("Error validating coupon:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Admin routes for managing promotions

// List all promotions for a shop (admin/vendor only)
app.get("/", async (c) => {
  try {
    const db = c.get("db");
    const user = c.get("user");
    const session = c.get("session");

    if (!user || !session?.activeOrganizationId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // Pagination parameters
    const limit = Number(c.req.query("limit")) || 20;
    const page = Number(c.req.query("page")) || 1;
    const offset = (page - 1) * limit;

    // Get promotions for the active shop
    const shopPromotions = await db.query.promotions.findMany({
      where: eq(promotions.shopId, session.activeOrganizationId),
      orderBy: [{ column: promotions.createdAt, order: "desc" }],
      limit,
      offset,
    });

    // Get total count for pagination
    const countResult = await db
      .select({ count: db.fn.count() })
      .from(promotions)
      .where(eq(promotions.shopId, session.activeOrganizationId));

    const totalCount = Number(countResult[0]?.count || 0);

    return c.json({
      data: shopPromotions,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching promotions:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Get a single promotion by ID
app.get("/:id", async (c) => {
  try {
    const { id } = c.req.param();
    const db = c.get("db");
    const user = c.get("user");
    const session = c.get("session");

    if (!user || !session?.activeOrganizationId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // Get the promotion
    const promotion = await db.query.promotions.findFirst({
      where: and(
        eq(promotions.id, id),
        eq(promotions.shopId, session.activeOrganizationId)
      ),
      with: {
        products: true,
      },
    });

    if (!promotion) {
      return c.json({ error: "Promotion not found" }, 404);
    }

    return c.json({ data: promotion });
  } catch (error) {
    console.error("Error fetching promotion:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Create a new promotion
app.post("/", zValidator("json", createPromotionSchema), async (c) => {
  try {
    const data = c.req.valid("json");
    const db = c.get("db");
    const user = c.get("user");
    const session = c.get("session");
    const auth = await createAuth(db);

    if (!user || !session?.activeOrganizationId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // Check organization membership and role
    const member = await auth.api.getActiveMember();
    if (!member || member.role !== "admin") {
      return c.json({ error: "Only admins can create promotions" }, 403);
    }

    // Check if code is already in use
    const existingPromotion = await db.query.promotions.findFirst({
      where: and(
        eq(promotions.code, data.code),
        eq(promotions.shopId, session.activeOrganizationId)
      ),
    });

    if (existingPromotion) {
      return c.json({ error: "This coupon code is already in use" }, 400);
    }

    // Extract product IDs if provided
    const { productIds, ...promotionData } = data;

    // Create the promotion
    const promotionId = nanoid();
    const now = new Date().toISOString();

    const newPromotion = await db
      .insert(promotions)
      .values({
        id: promotionId,
        shopId: session.activeOrganizationId,
        ...promotionData,
        usageCount: 0,
        createdAt: now,
        updatedAt: now,
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

    return c.json({ data: newPromotion }, 201);
  } catch (error) {
    console.error("Error creating promotion:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Update an existing promotion
app.patch("/:id", zValidator("json", updatePromotionSchema), async (c) => {
  try {
    const { id } = c.req.param();
    const data = c.req.valid("json");
    const db = c.get("db");
    const user = c.get("user");
    const session = c.get("session");
    const auth = await createAuth(db);

    if (!user || !session?.activeOrganizationId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // Check organization membership and role
    const member = await auth.api.getActiveMember();
    if (!member || member.role !== "admin") {
      return c.json({ error: "Only admins can update promotions" }, 403);
    }

    // Check if promotion exists
    const existingPromotion = await db.query.promotions.findFirst({
      where: and(
        eq(promotions.id, id),
        eq(promotions.shopId, session.activeOrganizationId)
      ),
    });

    if (!existingPromotion) {
      return c.json({ error: "Promotion not found" }, 404);
    }

    // If updating code, check if it's unique
    if (data.code && data.code !== existingPromotion.code) {
      const codeExists = await db.query.promotions.findFirst({
        where: and(
          eq(promotions.code, data.code),
          eq(promotions.shopId, session.activeOrganizationId),
          eq(promotions.id, id, true) // not this promotion
        ),
      });

      if (codeExists) {
        return c.json({ error: "This coupon code is already in use" }, 400);
      }
    }

    // Extract product IDs if provided
    const { productIds, ...promotionData } = data;

    // Update the promotion
    const updatedPromotion = await db
      .update(promotions)
      .set({
        ...promotionData,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(promotions.id, id))
      .returning()
      .get();

    // Update product links if specified
    if (productIds) {
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
            createdAt: new Date().toISOString(),
          }))
        );
      }
    }

    return c.json({ data: updatedPromotion });
  } catch (error) {
    console.error("Error updating promotion:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Delete a promotion
app.delete("/:id", async (c) => {
  try {
    const { id } = c.req.param();
    const db = c.get("db");
    const user = c.get("user");
    const session = c.get("session");
    const auth = await createAuth(db);

    if (!user || !session?.activeOrganizationId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // Check organization membership and role
    const member = await auth.api.getActiveMember();
    if (!member || member.role !== "admin") {
      return c.json({ error: "Only admins can delete promotions" }, 403);
    }

    // Check if promotion exists
    const existingPromotion = await db.query.promotions.findFirst({
      where: and(
        eq(promotions.id, id),
        eq(promotions.shopId, session.activeOrganizationId)
      ),
    });

    if (!existingPromotion) {
      return c.json({ error: "Promotion not found" }, 404);
    }

    // Delete product links first
    await db
      .delete(promotionProducts)
      .where(eq(promotionProducts.promotionId, id));

    // Delete the promotion
    await db.delete(promotions).where(eq(promotions.id, id));

    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting promotion:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

export default app;
