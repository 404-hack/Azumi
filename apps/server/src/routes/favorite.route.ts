import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { favoriteShops } from "../lib/db/schema/favorite.schema";
import { factory } from "../lib/factory"; // Import factory
import { eq, and } from "drizzle-orm";
import { shopTable } from "../lib/db/schema/shop.schema";

const favoriteRoute = factory.createApp(); // Use factory to create app

const addFavoriteSchema = z.object({
  shopId: z.string(),
});

// Add a shop to favorites
favoriteRoute.post(
  "/",
  // vendorAuth middleware might not be needed if factory handles user auth
  zValidator("json", addFavoriteSchema), // Use zValidator
  async (c) => {
    const { shopId } = c.req.valid("json");
    const user = c.get("user");
    const db = c.get("db"); // Get db from context

    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    try {
      // Check if shop exists (optional but good practice)
      const shopExists = await db
        .select({ id: shopTable.id })
        .from(shopTable)
        .where(eq(shopTable.id, shopId))
        .limit(1);

      if (!shopExists.length) {
        return c.json({ error: "Shop not found" }, 404);
      }

      // Check if already favorited
      const existingFavorite = await db
        .select()
        .from(favoriteShops)
        .where(
          and(
            eq(favoriteShops.userId, user.id),
            eq(favoriteShops.shopId, shopId)
          )
        )
        .limit(1);

      if (existingFavorite.length > 0) {
        return c.json({ message: "Shop already in favorites" }, 200);
      }

      // Add to favorites
      await db.insert(favoriteShops).values({
        userId: user.id,
        shopId: shopId,
      });

      return c.json({ message: "Shop added to favorites" }, 201);
    } catch (error) {
      console.error("Error adding favorite:", error);
      return c.json({ error: "Failed to add favorite" }, 500);
    }
  }
);

// Remove a shop from favorites
favoriteRoute.delete("/:shopId", async (c) => {
  const shopId = c.req.param("shopId");
  const user = c.get("user");
  const db = c.get("db"); // Get db from context

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    await db
      .delete(favoriteShops)
      .where(
        and(eq(favoriteShops.userId, user.id), eq(favoriteShops.shopId, shopId))
      );

    // D1 doesn't provide a reliable row count for deletes in the same way
    // We might need to query first to see if it exists if we need to return 404
    // For simplicity, we'll assume success if no error occurs

    return c.json({ message: "Shop removed from favorites" });
  } catch (error) {
    console.error("Error removing favorite:", error);
    return c.json({ error: "Failed to remove favorite" }, 500);
  }
});

// List user's favorite shops
favoriteRoute.get("/", async (c) => {
  const user = c.get("user");
  const db = c.get("db"); // Get db from context

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const favorites = await db
      .select({
        shopId: favoriteShops.shopId,
        shopName: shopTable.name, // Include shop details if needed
        // Add other shop details you want to return
      })
      .from(favoriteShops)
      .leftJoin(shopTable, eq(favoriteShops.shopId, shopTable.id))
      .where(eq(favoriteShops.userId, user.id));

    return c.json(favorites);
  } catch (error) {
    console.error("Error fetching favorites:", error);
    return c.json({ error: "Failed to fetch favorites" }, 500);
  }
});
// Toggle favorite status for a shop
favoriteRoute.post("/toggle/:shopId", async (c) => {
  const shopId = c.req.param("shopId");
  const user = c.get("user");
  const db = c.get("db");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    // 1. Check if shop exists (optional but recommended)
    const shopExists = await db
      .select({ id: shopTable.id })
      .from(shopTable)
      .where(eq(shopTable.id, shopId))
      .limit(1);

    if (!shopExists.length) {
      return c.json({ error: "Shop not found" }, 404);
    }

    // 2. Check if the shop is currently favorited
    const existingFavorite = await db
      .select({ id: favoriteShops.id }) // Select only id for efficiency
      .from(favoriteShops)
      .where(
        and(eq(favoriteShops.userId, user.id), eq(favoriteShops.shopId, shopId))
      )
      .limit(1);

    if (existingFavorite.length > 0) {
      // 3a. If favorited, remove it
      await db
        .delete(favoriteShops)
        .where(
          and(
            eq(favoriteShops.userId, user.id),
            eq(favoriteShops.shopId, shopId)
          )
        );
      return c.json({
        message: "Shop removed from favorites",
        favorited: false,
      });
    } else {
      // 3b. If not favorited, add it
      await db.insert(favoriteShops).values({
        userId: user.id,
        shopId: shopId,
      });
      return c.json(
        { message: "Shop added to favorites", favorited: true },
        201
      );
    }
  } catch (error) {
    console.error("Error toggling favorite:", error);
    return c.json({ error: "Failed to toggle favorite status" }, 500);
  }
});
export default favoriteRoute; // Export the refactored route
