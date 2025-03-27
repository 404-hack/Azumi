import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { Context } from "../lib/types";
import { packTable } from "../lib/db/schema";
import { createPackSchema, updatePackSchema } from "../lib/validation";
import { eq } from "drizzle-orm";
import { menuItemTable } from "../lib/db/schema";
import { factory } from "../lib/factory";

const packRoute = factory
  .createApp()
  // List all packs for a shop
  .get("/list/:shopId", async (c) => {
    try {
      const { shopId } = c.req.param();
      const db = c.get("db");

      const packs = await db.query.packTable.findMany({
        where: eq(packTable.shopId, shopId),
        with: {
          menus: true,
        },
      });

      return c.json({
        message: "success",
        data: packs,
      });
    } catch (error) {
      console.error("Error fetching packs:", error);
      return c.json({ message: "Internal server error" }, 500);
    }
  })

  // Get single pack with its menu items
  .get("/:id", async (c) => {
    try {
      const { id } = c.req.param();
      const db = c.get("db");

      const pack = await db.query.packTable.findFirst({
        where: eq(packTable.id, id),
        with: {
          menus: true,
        },
      });

      if (!pack) {
        return c.json({ message: "Pack not found" }, 404);
      }

      return c.json({
        message: "success",
        data: pack,
      });
    } catch (error) {
      console.error("Error fetching pack:", error);
      return c.json({ message: "Internal server error" }, 500);
    }
  });

export default packRoute;
