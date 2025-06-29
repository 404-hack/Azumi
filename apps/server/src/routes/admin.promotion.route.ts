import { factory } from "../lib/factory";
import { zValidator } from "@hono/zod-validator";
import { eq, and, not as dbNot } from "drizzle-orm";
import { nanoid } from "nanoid";
import { createAuth } from "../lib/auth";
import {
  promotions,
  promotionProducts,
} from "../lib/db/schema/promotion.schema";
import {
  createPromotionSchema,
  updatePromotionSchema,
} from "../lib/validation/index";
import adminAuthMiddleware from "../middlewares/adminAuth";

const adminPromotionRoute = factory
  .createApp()
  .use("*", adminAuthMiddleware)

  // Create a new promotion
  .post("/", zValidator("json", createPromotionSchema), async (c) => {
    try {
      const data = c.req.valid("json");
      const db = c.get("db");
      const user = c.get("user");
      const session = c.get("session");

      if (!user || !session?.activeOrganizationId) {
        return c.json({ error: "Unauthorized" }, 401);
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
      const now = new Date();

      const [newPromotion] = await db
        .insert(promotions)
        .values({
          id: promotionId,
          shopId: session.activeOrganizationId,
          ...promotionData,
          usageCount: 0,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

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
  })

  // Update an existing promotion
  .patch("/:id", zValidator("json", updatePromotionSchema), async (c) => {
    try {
      const { id } = c.req.param();
      const data = c.req.valid("json");
      const db = c.get("db");
      const user = c.get("user");
      const session = c.get("session");

      if (!user || !session?.activeOrganizationId) {
        return c.json({ error: "Unauthorized" }, 401);
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
            dbNot(eq(promotions.id, id))
          ),
        });

        if (codeExists) {
          return c.json({ error: "This coupon code is already in use" }, 400);
        }
      }

      // Extract product IDs if provided
      const { productIds, ...promotionData } = data;

      // Update the promotion
      const now = new Date();
      const [updatedPromotion] = await db
        .update(promotions)
        .set({
          ...promotionData,
        })
        .where(eq(promotions.id, id))
        .returning();

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

      return c.json({ data: updatedPromotion });
    } catch (error) {
      console.error("Error updating promotion:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  })

  // Delete a promotion
  .delete("/:id", async (c) => {
    try {
      const { id } = c.req.param();
      const db = c.get("db");
      const user = c.get("user");
      const session = c.get("session");

      if (!user || !session?.activeOrganizationId) {
        return c.json({ error: "Unauthorized" }, 401);
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

export default adminPromotionRoute;
