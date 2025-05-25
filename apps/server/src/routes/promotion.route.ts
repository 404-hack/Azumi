import { factory } from "../lib/factory";
import { zValidator } from "@hono/zod-validator";
import { eq, and, inArray, or, lt, gt, sql, not } from "drizzle-orm";
import { nanoid } from "nanoid";
import { createAuth } from "../lib/auth";
import { promotions } from "../lib/db/schema/promotion.schema";
import { validateCouponSchema } from "../lib/validation/index";
import vendorAuthMiddleware from "../middlewares/vendorAuth";

// Public routes
const promotionRoute = factory
  .createApp()

  // List active promotions (public)
  .get("/active", async (c) => {
    try {
      const db = c.get("db");
      const shopId = c.req.query("shopId");

      if (!shopId) {
        return c.json({ error: "Shop ID is required" }, 400);
      }

      const now = new Date();

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
  })

  // Validate a coupon code
  .post("/validate", zValidator("json", validateCouponSchema), async (c) => {
    try {
      const { code, shopId, cartTotal } = c.req.valid("json");
      const db = c.get("db");
      const now = new Date();

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
        promotion.usageCount !== null &&
        promotion.usageCount >= promotion.usageLimit
      ) {
        return c.json(
          { error: "This coupon has reached its usage limit" },
          400
        );
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
          if (
            promotion.minOrderValue !== null &&
            cartTotal >= promotion.minOrderValue
          ) {
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

// Vendor routes
const vendorRoutes = factory.createApp().use("*", vendorAuthMiddleware);

export default promotionRoute;
