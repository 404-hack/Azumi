import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { Context } from "../lib/types";
import {
  optionGroupTable,
  optionTable,
  optionToOptionGroupTable,
} from "../lib/db/schema/option.schema";
import {
  createOptionGroupSchema,
  createOptionSchema,
  updateOptionGroupSchema,
  updateOptionSchema,
} from "../lib/validation/option.validation";
import { eq } from "drizzle-orm";
import { factory } from "../lib/factory";

const optionRoute = factory
  .createApp()

  // List all option groups with their options for a shop
  .get("/groups/:shopId", async (c) => {
    const { shopId } = c.req.param();
    const db = c.get("db");

    const groups = await db.query.optionGroupTable.findMany({
      where: eq(optionGroupTable.shopId, shopId),
      with: {
        options: true,
      },
    });

    return c.json(groups);
  })

  // Get single option group with options and menus
  .get("/group/:id", async (c) => {
    const { id } = c.req.param();
    const db = c.get("db");

    const group = await db.query.optionGroupTable.findFirst({
      where: eq(optionGroupTable.id, id),
      with: {
        options: true,
        menus: true,
      },
    });

    if (!group) {
      return c.json({ error: "Option group not found" }, 404);
    }

    return c.json(group);
  })

  // Get single option by ID
  .get("/:id", async (c) => {
    const { id } = c.req.param();
    const db = c.get("db");

    const option = await db.query.optionTable.findFirst({
      where: eq(optionTable.id, id),
    });

    if (!option) {
      return c.json({ error: "Option not found" }, 404);
    }

    return c.json(option);
  });

export default optionRoute;
