import { factory } from "../lib/factory";
import { zValidator } from "@hono/zod-validator";
import { menuItemTable, menuCategoryTable } from "../lib/db/schema/menu.schema";
import { eq, and } from "drizzle-orm";

const menuRoute = factory
  .createApp()

  // Get all categories for a shop
  .get("/categories", async (c) => {
    const shopId = c.get("session")?.activeOrganizationId;
    if (!shopId) {
      return c.json({ message: "Unauthorized" }, 401);
    }

    const db = c.get("db");
    const categories = await db.query.menuCategoryTable.findMany({
      where: (category, { eq }) => eq(category.shopId, shopId),
    });

    return c.json({ message: "success", data: categories });
  })

  // Get a specific menu item by ID
  .get("/:id", async (c) => {
    const db = c.get("db");
    const id = c.req.param("id");

    const menu = await db.query.menuItemTable.findFirst({
      where: (table, { eq }) => eq(table.id, id),
    });

    if (!menu) {
      return c.json({ message: "Menu item not found" }, 404);
    }

    return c.json({ data: menu, message: "success" });
  })

  // Get a category by ID
  .get("/category/:id", async (c) => {
    const { id } = c.req.param();
    const db = c.get("db");

    const includeMenus = c.req.query("includeMenus") === "true";

    const category = await db.query.menuCategoryTable.findFirst({
      where: (category, { eq }) => eq(category.id, id),
      with: {
        menus: includeMenus || undefined,
      },
    });

    if (!category) {
      return c.json({ message: "Category not found" }, 404);
    }

    return c.json({ message: "success", data: category });
  })

  // Get menu items by category
  .get("/by-category/:categoryId", async (c) => {
    const { categoryId } = c.req.param();
    const db = c.get("db");

    const menuItems = await db.query.menuItemTable.findMany({
      where: (table, { eq }) => eq(table.categoryId, categoryId),
    });

    return c.json({ message: "success", data: menuItems });
  });

export default menuRoute;
