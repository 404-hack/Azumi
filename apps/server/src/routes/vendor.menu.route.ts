import { factory } from "../lib/factory";
import { zValidator } from "@hono/zod-validator";
import {
  createMenuSchema,
  createMenuCategorySchema,
  updateMenuCategorySchema,
  updateMenuSchema,
} from "../lib/validation/index";
import {
  menuItemTable,
  menuCategoryTable,
  menuItemOptionGroups,
} from "../lib/db/schema/menu.schema";
import { eq, and } from "drizzle-orm";

// Vendor specific menu routes
const vendorMenuRoute = factory
  .createApp()

  // Get all categories for the vendor's shop
  .get("/categories", async (c) => {
    const session = c.get("session");
    const orgId = session?.activeOrganizationId;
    if (!orgId) {
      return c.json(
        {
          message: "Unauthorized",
        },
        401
      );
    }
    const db = c.get("db");
    const includeMenus = c.req.query("includeMenus") === "true";

    const menu = await db.query.menuCategoryTable.findMany({
      where: (menu, { eq }) => eq(menu.shopId, orgId),
      with: {
        menus: includeMenus || undefined,
      },
      columns: {
        updatedAt: false,
        createdAt: false,
      },
    });

    return c.json({ message: "success", data: menu });
  })

  // Create a new menu item
  .post("/create", zValidator("json", createMenuSchema), async (c) => {
    try {
      const data = c.req.valid("json");

      const db = c.get("db");
      const session = c.get("session");
      const orgId = session?.activeOrganizationId;
      if (!orgId) {
        return c.json({ message: "Unauthorized" }, 401);
      }

      // Verify category exists and belongs to shop
      const category = await db.query.menuCategoryTable.findFirst({
        where: (category, { and, eq }) =>
          and(eq(category.id, data.categoryId), eq(category.shopId, orgId)),
      });

      if (!category) {
        return c.json({ message: "Category not found" }, 404);
      }

      const [menuItem] = await db
        .insert(menuItemTable)
        .values({
          name: data.name,
          description: data.description,
          price: data.price,
          priceDescription: data.priceDescription,
          inStock: data.inStock,
          categoryId: data.categoryId,
          shopId: orgId,
        })
        .returning();

      // Handle option groups if provided
      if (data.optionGroupId && data.optionGroupId.length > 0) {
        const optionGroupEntries = data.optionGroupId.map((groupId, index) => ({
          menuItemId: menuItem.id,
          optionGroupId: groupId,
          sortOrder: index, // Use index as sort order
        }));

        await db.insert(menuItemOptionGroups).values(optionGroupEntries);
      }

      return c.json({
        message: "Menu item created successfully",
        data: menuItem,
      });
    } catch (error) {
      console.error("Error creating menu item:", error);
      return c.json({ message: "Internal server error" }, 500);
    }
  })

  // Update a menu item
  .put("/update/:id", zValidator("json", updateMenuSchema), async (c) => {
    const data = c.req.valid("json");
    const db = c.get("db");
    const session = c.get("session");
    const orgId = session?.activeOrganizationId;
    const id = c.req.param("id");
    if (!orgId) {
      return c.json({ message: "Unauthorized" }, 401);
    }

    const updatedMenu = await db
      .update(menuItemTable)
      .set({
        name: data.name,
        description: data.description,
        price: data.price,
        priceDescription: data.priceDescription,
        inStock: data.inStock,
        categoryId: data.categoryId,
      })
      .where(and(eq(menuItemTable.id, id), eq(menuItemTable.shopId, orgId)));
    return c.json({ data: updatedMenu });
  })

  // Get details of a specific menu item
  .get("/:id", async (c) => {
    const db = c.get("db");
    const session = c.get("session");
    const id = c.req.param("id");
    const orgId = session?.activeOrganizationId;
    if (!orgId) {
      return c.json({ message: "Unauthorized" }, 401);
    }

    const menu = await db.query.menuItemTable.findFirst({
      where: (table, { eq, and }) =>
        and(eq(table.id, id), eq(table.shopId, orgId)),
    });

    return c.json({ data: menu, message: "success" });
  })

  // Create a new category
  .post(
    "/category/create",
    zValidator("json", createMenuCategorySchema),
    async (c) => {
      try {
        const body = c.req.valid("json");
        const db = c.get("db");
        const session = c.get("session");
        const orgId = session?.activeOrganizationId;
        if (!orgId) {
          return c.json({ message: "Unauthorized" }, 401);
        }

        const [category] = await db
          .insert(menuCategoryTable)
          .values({
            name: body.name,
            published: body.published,
            shopId: orgId,
          })
          .returning();

        return c.json(
          {
            message: "Category created successfully",
            data: category,
          },
          201
        );
      } catch (error) {
        console.error("Error creating category:", error);
        return c.json({ message: "Internal server error" }, 500);
      }
    }
  )

  // Update an existing category
  .put(
    "/category/update/:id",
    zValidator("json", updateMenuCategorySchema),
    async (c) => {
      try {
        const { id } = c.req.param();
        const body = c.req.valid("json");
        const db = c.get("db");
        const session = c.get("session");
        const orgId = session?.activeOrganizationId;
        if (!orgId) {
          return c.json({ message: "Unauthorized" }, 401);
        }

        // Verify category exists and belongs to shop
        const category = await db.query.menuCategoryTable.findFirst({
          where: (category, { and, eq }) =>
            and(eq(category.id, id), eq(category.shopId, orgId)),
        });

        if (!category) {
          return c.json({ message: "Category not found" }, 404);
        }

        const [updatedCategory] = await db
          .update(menuCategoryTable)
          .set({
            name: body.name,
            published: body.published,
          })
          .where(
            and(
              eq(menuCategoryTable.id, id),
              eq(menuCategoryTable.shopId, orgId)
            )
          )
          .returning();

        return c.json({
          message: "Category updated successfully",
          data: updatedCategory,
        });
      } catch (error) {
        console.error("Error updating category:", error);
        return c.json({ message: "Internal server error" }, 500);
      }
    }
  )

  // Get details of a specific category
  .get("/category/:id", async (c) => {
    const { id } = c.req.param();
    const db = c.get("db");
    const orgId = c.get("session")?.activeOrganizationId;
    if (!orgId) {
      return c.json({ message: "Unauthorized" }, 401);
    }

    const includeMenus = c.req.query("includeMenus") === "true";

    const category = await db.query.menuCategoryTable.findFirst({
      where: (category, { eq, and }) =>
        and(eq(category.id, id), eq(category.shopId, orgId)),
      with: {
        menus: includeMenus || undefined,
      },
    });
    if (!category) {
      return c.json({ message: "Category not found" }, 404);
    }

    return c.json({ message: "success", data: category });
  });

export default vendorMenuRoute;
