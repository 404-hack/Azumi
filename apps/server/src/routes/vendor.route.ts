import { factory } from "../lib/factory";
import { zValidator } from "@hono/zod-validator";
import {
  createMenuSchema,
  createMenuCategorySchema,
  updateMenuCategorySchema,
  updateMenuSchema,
  createPackSchema,
  updateShopSchema,
} from "../lib/validation/index";
import {
  menuItemTable,
  menuCategoryTable,
  menuItemOptionGroups,
} from "../lib/db/schema/menu.schema";
import { eq, and, sql } from "drizzle-orm";
import { createAuth } from "../lib/auth";
import vendorAuthMiddleware from "../middlewares/vendorAuth";
import {
  optionGroupTable,
  optionTable,
  optionToOptionGroupTable,
} from "../lib/db/schema/option.schema";
import {
  createOptionGroupSchema,
  createOptionSchema,
} from "../lib/validation/option.validation";
import { packTable } from "../lib/db/schema/pack.schema";
import {
  shopAgreementsTable,
  shopOperatingHoursTable,
  shopPaymentMethodTable,
  shopTable,
  shopTodoTable,
} from "../lib/db/schema";
import { ShopTodoService } from "../services/shopTodo.service";
import { z } from "zod";
import { dayScheduleSchema } from "../lib/validation/shop.validation";

const todoService = new ShopTodoService();

const vendorRoute = factory
  .createApp()
  // Apply auth middleware to all routes
  .use("*", vendorAuthMiddleware)

  // Get ALL vendor data (comprehensive endpoint)
  .get("/all-data", async (c) => {
    try {
      const db = c.get("db");
      const orgId = c.get("orgId");

      // Get all vendor data in a structured way
      const shopData = await db.query.shopTable.findFirst({
        where: eq(shopTable.id, orgId),
        with: {
          // Menu data
          menus: {
            with: {
              category: true,
              optionGroups: {
                with: {
                  optionGroup: true,
                },
              },
            },
          },
          menuCategories: true,

          // Option data
          optionGroups: {
            with: {
              options: {
                with: {
                  option: true,
                },
              },
            },
          },

          // Pack data
          packs: true,
        },
      });

      if (!shopData) {
        return c.json({ error: "Shop not found" }, 404);
      }

      return c.json({
        message: "Successfully retrieved all vendor data",
        data: shopData,
      });
    } catch (error) {
      console.error("Error fetching vendor data:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  })

  // Get vendor menu data
  .get("/menu", async (c) => {
    try {
      const db = c.get("db");

      const orgId = c.get("orgId");

      // Get shop with role-based data
      const shopWithData = await db.query.shopTable.findFirst({
        where: eq(shopTable.id, orgId),
        with: {
          // Basic data for all roles
          menus: true,
          menuCategories: true,
          menuPacks: true,
          menuOptionGroups: true,
        },
      });

      if (!shopWithData) {
        return c.json({ error: "Shop not found" }, 404);
      }

      return c.json({
        data: shopWithData,
      });
    } catch (error) {
      console.error("Error fetching shop:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  })

  // Get menu categories for vendor
  .get("/menu/categories", async (c) => {
    const orgId = c.get("orgId");
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

  // Get a specific category by ID for vendor
  .get("/menu/category/:id", async (c) => {
    const { id } = c.req.param();
    const db = c.get("db");
    const orgId = c.get("orgId");
    const includeMenus = c.req.query("includeMenus") === "true";

    const category = await db.query.menuCategoryTable.findFirst({
      where: (category, { and, eq }) =>
        and(eq(category.id, id), eq(category.shopId, orgId)),
      with: {
        menus: includeMenus || undefined,
      },
    });

    if (!category) {
      return c.json({ message: "Category not found" }, 404);
    }

    return c.json({ message: "success", data: category });
  })

  // Create a menu item
  .post("/menu/create", zValidator("json", createMenuSchema), async (c) => {
    try {
      const data = c.req.valid("json");
      const db = c.get("db");
      const orgId = c.get("orgId");

      // Verify category exists and belongs to shop
      const category = await db.query.menuCategoryTable.findFirst({
        where: (category, { and, eq }) =>
          and(eq(category.id, data.categoryId), eq(category.shopId, orgId)),
      });

      if (!category) {
        return c.json({ message: "Category not found" }, 404);
      }

      const menuItem = await db
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
        .returning()
        .get();

      // Handle option groups if provided
      if (data.optionGroupId && data.optionGroupId.length > 0) {
        const optionGroupEntries = data.optionGroupId.map((groupId, index) => ({
          menuItemId: menuItem.id,
          optionGroupId: groupId,
          sortOrder: index, // Use index as sort order
        }));

        await db.insert(menuItemOptionGroups).values(optionGroupEntries);
      }

      // Check if vendor has more than one menu item and update todo
      const menuCount = await db
        .select({ count: sql`count(*)` })
        .from(menuItemTable)
        .where(eq(menuItemTable.shopId, orgId))
        .then((result) => Number(result[0]?.count || 0));

      console.log("🚀 ~ .post ~ menuCount:", menuCount);
      if (menuCount > 1) {
        // First check if the todo flag is already true
        const shopTodo = await db.query.shopTodoTable.findFirst({
          where: eq(shopTodoTable.shopId, orgId),
        });
        console.log("🚀 ~ .post ~ shopTodo:", shopTodo);

        // Only update if the flag is currently false
        if (shopTodo && !shopTodo.uploadAtLeastOneMenu) {
          await db
            .update(shopTodoTable)
            .set({
              uploadAtLeastOneMenu: true,
            })
            .where(eq(shopTodoTable.shopId, orgId));
        }
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
  .put("/menu/update/:id", zValidator("json", updateMenuSchema), async (c) => {
    try {
      const data = c.req.valid("json");
      const db = c.get("db");
      const orgId = c.get("orgId");
      const id = c.req.param("id");

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
        .where(and(eq(menuItemTable.id, id), eq(menuItemTable.shopId, orgId)))
        .returning();

      return c.json({
        message: "Menu item updated successfully",
        data: updatedMenu,
      });
    } catch (error) {
      console.error("Error updating menu item:", error);
      return c.json({ message: "Internal server error" }, 500);
    }
  })

  // Create menu category
  .post(
    "/menu/category/create",
    zValidator("json", createMenuCategorySchema),
    async (c) => {
      try {
        const body = c.req.valid("json");
        const db = c.get("db");
        const orgId = c.get("orgId");

        const category = await db
          .insert(menuCategoryTable)
          .values({
            name: body.name,
            published: body.published,
            shopId: orgId,
          })
          .returning()
          .get();

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

  // Update menu category
  .put(
    "/menu/category/:id",
    zValidator("json", updateMenuCategorySchema),
    async (c) => {
      try {
        const { id } = c.req.param();
        const body = c.req.valid("json");
        const db = c.get("db");
        const orgId = c.get("orgId");

        // Verify category exists and belongs to shop
        const category = await db.query.menuCategoryTable.findFirst({
          where: (category, { and, eq }) =>
            and(eq(category.id, id), eq(category.shopId, orgId)),
        });

        if (!category) {
          return c.json({ message: "Category not found" }, 404);
        }

        const updatedCategory = await db
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
          .returning()
          .get();

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
  // delete menu category
  .delete("/menu/category/:id", async (c) => {
    const { id } = c.req.param();
    const db = c.get("db");
    const orgId = c.get("orgId");

    // Verify the category belongs to this vendor
    const category = await db.query.menuCategoryTable.findFirst({
      where: (category, { and, eq }) =>
        and(eq(category.id, id), eq(category.shopId, orgId)),
    });

    if (!category) {
      return c.json(
        {
          message:
            "Category not found or you don't have permission to delete it",
        },
        404
      );
    }

    // Delete the category
    await db.delete(menuCategoryTable).where(eq(menuCategoryTable.id, id));

    return c.json({ success: true, message: "Category deleted successfully" });
  })

  // ===== OPTION ROUTES =====

  // Get vendor options
  .get("/options", async (c) => {
    const db = c.get("db");
    const orgId = c.get("orgId");

    const options = await db.query.optionTable.findMany({
      where: (table, { eq }) => eq(table.shopId, orgId),
    });

    return c.json({ data: options });
  })

  // Get vendor option groups with options
  .get("/option-groups", async (c) => {
    const db = c.get("db");
    const orgId = c.get("orgId");

    const optionGroups = await db.query.optionGroupTable.findMany({
      where: (table, { eq }) => eq(table.shopId, orgId),
      with: {
        optionsToOptionGroups: {
          with: {
            option: true,
          },
        },
      },
    });

    return c.json({ data: optionGroups });
  })

  // Create option
  .post("/option/create", zValidator("json", createOptionSchema), async (c) => {
    const data = c.req.valid("json");
    const db = c.get("db");
    const session = c.get("session");
    const orgId = c.get("orgId");

    const option = await db
      .insert(optionTable)
      .values({
        name: data.name,
        price: data.price,
        inStock: data.inStock,
        userId: session.userId,
        shopId: orgId,
      })
      .returning()
      .get();

    return c.json({ data: option });
  })

  // Create option group with options
  .post(
    "/option-group/create",
    zValidator("json", createOptionGroupSchema),
    async (c) => {
      const data = c.req.valid("json");
      const db = c.get("db");
      const session = c.get("session");
      const orgId = c.get("orgId");

      const group = await db
        .insert(optionGroupTable)
        .values({
          name: data.name,
          shopId: orgId,
          maxSelections: data.maxSelections,
          minSelections: data.minSelections,
          userId: session.userId,
        })
        .returning()
        .get();

      // Create associations between option group and options in junction table
      if (data.optionsId && data.optionsId.length > 0) {
        await db.insert(optionToOptionGroupTable).values(
          data.optionsId.map((optionId) => ({
            optionId,
            optionGroupId: group.id,
          }))
        );
      }

      return c.json({ data: group });
    }
  )

  // Delete an option
  .delete("/option/:id", async (c) => {
    const { id } = c.req.param();
    const db = c.get("db");
    const orgId = c.get("orgId");

    // Verify the option belongs to this vendor
    const option = await db.query.optionTable.findFirst({
      where: (table, { and, eq }) =>
        and(eq(table.id, id), eq(table.shopId, orgId)),
    });

    if (!option) {
      return c.json(
        {
          message: "Option not found or you don't have permission to delete it",
        },
        404
      );
    }

    // Delete the option
    await db.delete(optionTable).where(eq(optionTable.id, id));

    return c.json({ success: true, message: "Option deleted successfully" });
  })

  // Add an option to an option group
  .post("/option-group/:optionGroupId/option/:optionId/add", async (c) => {
    const { optionGroupId, optionId } = c.req.param();
    const db = c.get("db");
    const orgId = c.get("orgId");

    // Verify the option group belongs to this vendor
    const optionGroup = await db.query.optionGroupTable.findFirst({
      where: (table, { and, eq }) =>
        and(eq(table.id, optionGroupId), eq(table.shopId, orgId)),
    });

    if (!optionGroup) {
      return c.json(
        {
          message:
            "Option group not found or you don't have permission to modify it",
        },
        404
      );
    }

    // Verify the option belongs to this vendor
    const option = await db.query.optionTable.findFirst({
      where: (table, { and, eq }) =>
        and(eq(table.id, optionId), eq(table.shopId, orgId)),
    });

    if (!option) {
      return c.json(
        {
          message: "Option not found or you don't have permission to use it",
        },
        404
      );
    }

    // Check if the association already exists
    const existingAssociation =
      await db.query.optionToOptionGroupTable.findFirst({
        where: (table, { and, eq }) =>
          and(
            eq(table.optionId, optionId),
            eq(table.optionGroupId, optionGroupId)
          ),
      });

    if (existingAssociation) {
      return c.json({ message: "Option is already part of this group" }, 400);
    }

    // Create the association
    await db.insert(optionToOptionGroupTable).values({
      optionId,
      optionGroupId,
    });

    return c.json({
      success: true,
      message: "Option successfully added to group",
    });
  })

  // ===== PACK ROUTES =====

  // Get all packs for vendor
  .get("/packs", async (c) => {
    try {
      const db = c.get("db");
      const orgId = c.get("orgId");

      const packs = await db.query.packTable.findMany({
        where: eq(packTable.shopId, orgId),
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

  // Get single pack with details
  .get("/pack/:id", async (c) => {
    try {
      const { id } = c.req.param();
      const db = c.get("db");
      const orgId = c.get("orgId");

      const pack = await db.query.packTable.findFirst({
        where: (table, { and, eq }) =>
          and(eq(table.id, id), eq(table.shopId, orgId)),
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
  })

  // Create new pack
  .post("/pack/create", zValidator("json", createPackSchema), async (c) => {
    try {
      const data = c.req.valid("json");
      const db = c.get("db");
      const session = c.get("session");
      const orgId = c.get("orgId");

      const pack = await db
        .insert(packTable)
        .values({
          ...data,
          shopId: orgId,
          userId: session.userId,
        })
        .returning()
        .get();

      return c.json(
        {
          message: "Pack created successfully",
          data: pack,
        },
        201
      );
    } catch (error) {
      console.error("Error creating pack:", error);
      return c.json({ message: "Internal server error" }, 500);
    }
  })

  // Delete a pack
  .delete("/pack/:id", async (c) => {
    try {
      const { id } = c.req.param();
      const db = c.get("db");
      const orgId = c.get("orgId");

      // Verify the pack belongs to this vendor
      const pack = await db.query.packTable.findFirst({
        where: (table, { and, eq }) =>
          and(eq(table.id, id), eq(table.shopId, orgId)),
      });

      if (!pack) {
        return c.json(
          {
            message: "Pack not found or you don't have permission to delete it",
          },
          404
        );
      }

      // Remove pack reference from menu items
      await db
        .update(menuItemTable)
        .set({ packId: null })
        .where(eq(menuItemTable.packId, id));

      // Delete the pack
      await db.delete(packTable).where(eq(packTable.id, id));

      return c.json({
        message: "Pack deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting pack:", error);
      return c.json({ message: "Internal server error" }, 500);
    }
  })
  // Operating hours

  .patch("/", zValidator("json", updateShopSchema), async (c) => {
    try {
      const data = c.req.valid("json");
      const db = c.get("db");

      // Get active organization from session
      const orgId = c.get("orgId");

      const shop = await db.query.shopTable.findFirst({
        where: eq(shopTable.id, orgId),
      });

      if (!shop) {
        return c.json({ error: "Shop not found" }, 404);
      }

      // Verify active organization matches shop's organization
      if (orgId !== shop.id) {
        return c.json(
          { error: "You don't have access to edit this shop" },
          403
        );
      }

      // Check organization membership and role
      // const member = await auth.api.getActiveMember();

      // if (!member || member.role !== "admin") {
      //   return c.json({ error: "Only admins can update shop details" }, 403);
      // }

      const updatedShop = await db
        .update(shopTable)
        .set(data)
        .where(eq(shopTable.id, orgId))
        .returning()
        .get();

      return c.json({ data: updatedShop });
    } catch (error) {
      console.error("Error updating shop:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  })
  .get("/profile", async (c) => {
    try {
      const db = c.get("db");
      const orgId = c.get("orgId");
      const includeTodo = c.req.query("includeTodo") === "true";

      const shop = await db.query.shopTable.findFirst({
        where: eq(shopTable.id, orgId),
        with: {
          operatingHours: true,
        },
      });
      if (!shop) {
        return c.json({ error: "Shop not found" }, 404);
      }
      // let todoData = null;

      // if (includeTodo) {
      //   // Pass the db instance to the todo service
      let todoData = await todoService.getComputedTodos(shop.id, db);
      console.log("🚀 ~ .get ~ todoData:", todoData);
      // }
      if (!todoData) {
        return c.json({ error: "Todo data not found" }, 404);
      }

      return c.json({
        data: {
          ...shop,
          todo: todoData.todo,
          profileCompletion: todoData.profileCompletion,
        },
      });
    } catch (error) {
      console.error("Error fetching shop:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  })
  .post(
    "/operating-hours",
    zValidator(
      "json",
      z.object({
        schedule: z.array(dayScheduleSchema),
      })
    ),
    async (c) => {
      try {
        const { schedule } = c.req.valid("json");
        const db = c.get("db");
        console.log("🚀 ~ schedule:", schedule);
        const orgId = c.get("orgId");

        // Delete existing hours
        // await db
        //   .delete(shopOperatingHoursTable)
        //   .where(eq(shopOperatingHoursTable.shopId, orgId));

        // Insert new hours
        // Use onConflictDoUpdate for more efficient upsert operation
        const operatingHours = await Promise.all(
          schedule.map(async (day) => {
            return db
              .insert(shopOperatingHoursTable)
              .values({
                shopId: orgId,
                day: day.day,
                isOpen: day.isOpen,
                openTime: day.openTime,
                closeTime: day.closeTime,
              })
              .onConflictDoUpdate({
                target: [
                  shopOperatingHoursTable.shopId,
                  shopOperatingHoursTable.day,
                ],
                set: {
                  isOpen: day.isOpen,
                  openTime: day.openTime,
                  closeTime: day.closeTime,
                },
              })
              .returning();
          })
        );

        return c.json({
          message: "Operating hours updated successfully",
          data: operatingHours,
        });
      } catch (error) {
        console.error("Error updating operating hours:", error);
        return c.json({ error: "Internal server error" }, 500);
      }
    }
  );

export default vendorRoute;
