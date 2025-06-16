import { factory } from "../lib/factory";
import { zValidator } from "@hono/zod-validator";
import { env } from "cloudflare:workers";
import {
  createMenuSchema,
  createMenuCategorySchema,
  updateMenuCategorySchema,
  updateMenuSchema,
  createPackSchema,
  updateShopSchema,
  updatePackSchema,
  createPromotionSchema,
  updatePromotionSchema,
} from "../lib/validation/index";

import {
  menuItemTable,
  menuCategoryTable,
  menuItemOptionGroups,
} from "../lib/db/schema/menu.schema";
import { eq, and, sql, not } from "drizzle-orm";
import { createAuth } from "../lib/auth";
import {
  optionGroupTable,
  optionTable,
  optionToOptionGroupTable,
} from "../lib/db/schema/option.schema";
import {
  createOptionGroupSchema,
  createOptionSchema,
  updateOptionGroupSchema,
} from "../lib/validation/option.validation";
import { packTable } from "../lib/db/schema/pack.schema";
import {
  orderTable,
  promotionProducts,
  promotions,
  shopAgreementsTable,
  shopOperatingHoursTable,
  shopPaymentMethodTable,
  shopTable,
  shopTodoTable,
} from "../lib/db/schema";
import { ShopTodoService } from "../services/shopTodo.service";
import {
  bannerImageSchema,
  dayScheduleSchema,
} from "../lib/validation/shop.validation";
import { nanoid } from "nanoid";
import { ORDER_STATUS } from "../lib/constant";
import vendorAuthMiddleware from "../middlewares/vendorAuth";
import { z } from "zod";
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
  .post("/menu", zValidator("form", createMenuSchema), async (c) => {
    try {
      const data = c.req.valid("form");
      const db = c.get("db");
      const orgId = c.get("orgId");
      let imageUrl = null;
      if (data.image) {
        const imageBuffer = await data.image.arrayBuffer();
        const filename = `${orgId}-${Date.now()}-${data.image.name}`;
        const b = await env.BUCKET.put(filename, imageBuffer, {
          httpMetadata: { contentType: data.image.type },
        });
        imageUrl = `${env.R2_PUBLIC_URL}/${filename}`;
      }

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
          imageUrl: imageUrl, // Add imageUrl here
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
      // handle pack if provided
      if (data.packId) {
        await db
          .update(menuItemTable)
          .set({ packId: data.packId })
          .where(eq(menuItemTable.id, menuItem.id));
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
  // get menu by id
  .get("/menu/:id", async (c) => {
    try {
      const { id } = c.req.param();
      const db = c.get("db");
      const orgId = c.get("orgId");
      const menuItem = await db.query.menuItemTable.findFirst({
        where: (table, { and, eq }) =>
          and(eq(table.id, id), eq(table.shopId, orgId)),
        with: {
          category: true,
          menuItemOptionGroups: {
            with: {
              optionGroup: true,
            },
          },
          pack: true,
        },
      });

      if (!menuItem) {
        return c.json(
          {
            message:
              "Menu item not found or you don't have permission to access it",
          },
          404
        );
      }

      return c.json({
        data: menuItem,
      });
    } catch (error) {
      console.error("Error fetching menu item:", error);
      return c.json({ message: "Internal server error" }, 500);
    }
  })

  // Update a menu item
  .put("/menu/:id", zValidator("form", updateMenuSchema), async (c) => {
    try {
      const data = c.req.valid("form");
      const db = c.get("db");
      const orgId = c.get("orgId");
      const id = c.req.param("id");

      // Verify menu item exists and belongs to shop
      const existingMenuItem = await db.query.menuItemTable.findFirst({
        where: (table, { and, eq }) =>
          and(eq(table.id, id), eq(table.shopId, orgId)),
      });

      if (!existingMenuItem) {
        return c.json(
          {
            message:
              "Menu item not found or you don't have permission to update it",
          },
          404
        );
      }

      let imageUrl = existingMenuItem.imageUrl; // Handle image update if provided
      if (data.image instanceof File) {
        // Delete old image if exists
        if (existingMenuItem.imageUrl) {
          try {
            const oldFilename = existingMenuItem.imageUrl.substring(
              existingMenuItem.imageUrl.lastIndexOf("/") + 1
            );
            await env.BUCKET.delete(oldFilename);
          } catch (imageError) {
            console.error("Error deleting old image:", imageError);
          }
        }

        // Check if data.image is a File object
        if (data.image instanceof File) {
          // Upload new image
          const imageBuffer = await data.image.arrayBuffer();
          const filename = `${orgId}-${Date.now()}-${data.image.name}`;
          await env.BUCKET.put(filename, imageBuffer, {
            httpMetadata: { contentType: data.image.type },
          });
          imageUrl = `${env.R2_PUBLIC_URL}/${filename}`;
        } else if (typeof data.image === "string") {
          // If it's a string URL, use it directly
          imageUrl = data.image;
        }
      }

      // Update menu item basic info
      const updatedMenu = await db
        .update(menuItemTable)
        .set({
          name: data.name,
          description: data.description,
          price: data.price,
          priceDescription: data.priceDescription,
          inStock: data.inStock,
          categoryId: data.categoryId,
          imageUrl: imageUrl,
          packId: data.packId || null,
        })
        .where(and(eq(menuItemTable.id, id), eq(menuItemTable.shopId, orgId)))
        .returning()
        .get();

      // Update option groups
      await db
        .delete(menuItemOptionGroups)
        .where(eq(menuItemOptionGroups.menuItemId, id));

      if (data.optionGroupId && data.optionGroupId.length > 0) {
        const optionGroupEntries = data.optionGroupId.map((groupId, index) => ({
          menuItemId: id,
          optionGroupId: groupId,
          sortOrder: index,
        }));

        await db.insert(menuItemOptionGroups).values(optionGroupEntries);
      }

      return c.json({
        message: "Menu item updated successfully",
        data: updatedMenu,
      });
    } catch (error) {
      console.error("Error updating menu item:", error);
      return c.json({ message: "Internal server error" }, 500);
    }
  })
  // Delete a menu item
  .delete("/menu/:id", async (c) => {
    try {
      const { id } = c.req.param();
      const db = c.get("db");
      const orgId = c.get("orgId");

      // Verify the menu item belongs to this vendor
      const menuItem = await db.query.menuItemTable.findFirst({
        where: (table, { and, eq }) =>
          and(eq(table.id, id), eq(table.shopId, orgId)),
      });

      if (!menuItem) {
        return c.json(
          {
            message:
              "Menu item not found or you don't have permission to delete it",
          },
          404
        );
      }

      // Delete image from bucket if it exists
      if (menuItem.imageUrl) {
        try {
          // Extract filename from the full URL
          const imageUrl = menuItem.imageUrl;
          const filename = imageUrl.substring(imageUrl.lastIndexOf("/") + 1);

          // Delete from R2 bucket
          await env.BUCKET.delete(filename);
        } catch (imageError) {
          // Log error but continue with deletion process
          console.error("Error deleting image from bucket:", imageError);
        }
      }

      // Delete menu item option groups associations first
      await db
        .delete(menuItemOptionGroups)
        .where(eq(menuItemOptionGroups.menuItemId, id));

      // Delete the menu item
      await db.delete(menuItemTable).where(eq(menuItemTable.id, id));

      return c.json({
        success: true,
        message: "Menu item deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting menu item:", error);
      return c.json({ message: "Internal server error" }, 500);
    }
  })

  // Create menu category
  .post(
    "/menu/category/create",
    zValidator("json", createMenuCategorySchema),
    async (c) => {
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

  // Get a single option by ID
  .get("/option/:id", async (c) => {
    const { id } = c.req.param();
    const db = c.get("db");
    const orgId = c.get("orgId");

    const option = await db.query.optionTable.findFirst({
      where: (table, { and, eq }) =>
        and(eq(table.id, id), eq(table.shopId, orgId)),
      columns: {
        name: true,
        price: true,
        inStock: true,
        id: true,
      },
    });

    if (!option) {
      return c.json(
        {
          message: "Option not found or you don't have permission to access it",
        },
        404
      );
    }

    return c.json({ data: option });
  })
  // edit a single option
  .patch(
    "/option/:id",
    zValidator(
      "json",
      z.object({
        name: z.string().optional(),
        price: z.number().optional(),
        inStock: z.boolean().optional(),
      })
    ),
    async (c) => {
      try {
        const { id } = c.req.param();
        const data = c.req.valid("json");
        const db = c.get("db");
        const orgId = c.get("orgId");

        // Verify the option belongs to this vendor
        const existingOption = await db.query.optionTable.findFirst({
          where: (table, { and, eq }) =>
            and(eq(table.id, id), eq(table.shopId, orgId)),
        });

        if (!existingOption) {
          return c.json(
            {
              message:
                "Option not found or you don't have permission to edit it",
            },
            404
          );
        }

        // Update the option
        const updatedOption = await db
          .update(optionTable)
          .set(data)
          .where(and(eq(optionTable.id, id), eq(optionTable.shopId, orgId)))
          .returning()
          .get();

        return c.json({
          message: "Option updated successfully",
          data: updatedOption,
        });
      } catch (error) {
        return c.json({ message: "Internal server error" }, 500);
      }
    }
  )
  // get a single option group by id
  .get("/option-group/:id", async (c) => {
    const { id } = c.req.param();
    const db = c.get("db");
    const orgId = c.get("orgId");

    // Fetch the option group with its associated options
    const optionGroup = await db.query.optionGroupTable.findFirst({
      where: (table, { and, eq }) =>
        and(eq(table.id, id), eq(table.shopId, orgId)),
      with: {
        optionsToOptionGroups: {
          with: {
            option: true,
          },
        },
      },
    });

    if (!optionGroup) {
      return c.json(
        {
          message:
            "Option group not found or you don't have permission to access it",
        },
        404
      );
    }

    return c.json({ data: optionGroup });
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
    "/option-group",
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
  // edit an option group with options  by id
  .patch(
    "/option-group/:id",
    zValidator("json", updateOptionGroupSchema),
    async (c) => {
      const { id } = c.req.param();
      const db = c.get("db");
      const orgId = c.get("orgId");
      const data = c.req.valid("json");

      // Verify the option group belongs to this vendor
      const optionGroup = await db.query.optionGroupTable.findFirst({
        where: (table, { and, eq }) =>
          and(eq(table.id, id), eq(table.shopId, orgId)),
      });

      if (!optionGroup) {
        return c.json(
          {
            message:
              "Option group not found or you don't have permission to edit it",
          },
          404
        );
      }

      // Update the option group
      await db
        .update(optionGroupTable)
        .set({
          name: data.name,
          maxSelections: data.maxSelections,
          minSelections: data.minSelections,
        })
        .where(
          and(eq(optionGroupTable.id, id), eq(optionGroupTable.shopId, orgId))
        );

      const res = await db
        .delete(optionToOptionGroupTable)
        .where(eq(optionToOptionGroupTable.optionGroupId, id))
        .returning()
        .get();
      console.log(res);

      // Update associations between option group and options in junction table
      if (data.optionsId && data.optionsId.length > 0) {
        // Delete existing associations

        // Create new associations
        await db.insert(optionToOptionGroupTable).values(
          data.optionsId.map((optionId) => ({
            optionId,
            optionGroupId: id,
          }))
        );
      }

      // Fetch updated option group with options
      const updatedGroup = await db.query.optionGroupTable.findFirst({
        where: (table, { eq }) => eq(table.id, id),
        with: {
          optionsToOptionGroups: {
            with: {
              option: true,
            },
          },
        },
      });

      return c.json({
        message: "Option group updated successfully",
        data: updatedGroup,
      });
    }
  )

  // ===== PACK ROUTES =====
  // Get all packs for vendor
  .get("/pack", async (c) => {
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
  // Edit a pack by id
  .patch("/pack/:id", zValidator("json", updatePackSchema), async (c) => {
    try {
      const { id } = c.req.param();
      const data = c.req.valid("json");
      const db = c.get("db");
      const orgId = c.get("orgId");

      // Verify the pack belongs to this vendor
      const existingPack = await db.query.packTable.findFirst({
        where: (table, { and, eq }) =>
          and(eq(table.id, id), eq(table.shopId, orgId)),
      });

      if (!existingPack) {
        return c.json(
          {
            message: "Pack not found or you don't have permission to edit it",
          },
          404
        );
      }

      // Update the pack
      const updatedPack = await db
        .update(packTable)
        .set(data)
        .where(and(eq(packTable.id, id), eq(packTable.shopId, orgId)))
        .returning()
        .get();

      return c.json({
        message: "Pack updated successfully",
        data: updatedPack,
      });
    } catch (error) {
      console.error("Error updating pack:", error);
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
  // Get vendor orders with status filter
  .get(
    "/orders",
    zValidator(
      "query",
      z.object({
        status: z.enum(ORDER_STATUS).optional(),
      })
    ),
    async (c) => {
      try {
        // if (c.req.header("upgrade") !== "websocket") {
        //   return c.text("Not a websocket request", 426);
        // }
        const db = c.get("db");
        const orgId = c.get("orgId");
        console.log("🚀 ~ orgId:", orgId);
        const { status } = c.req.valid("query");
        // const id = env.ORDER_NOTIFICATION.idFromName(orgId);
        // const stub = env.ORDER_NOTIFICATION.get(id);
        // const response = await stub.fetch(c.req.raw);
        // return new Response(null, {
        //   status: response.status,
        //   headers: response.headers,
        //   webSocket: response.webSocket,
        // });
        let query = db.query.orderTable.findMany({
          where: (orders, { eq, and }) => {
            const conditions = [eq(orders.shopId, orgId)];
            if (status) {
              conditions.push(eq(orders.status, status));
            }
            return and(...conditions);
          },

          with: {
            customer: true,
            shop: {
              columns: {
                id: true,
                name: true,
                commission: true,
              },
            },
            items: {
              columns: {
                id: true,
                menuItemId: true,
                menuItemName: true,
                quantity: true,
                unitPrice: true,
                totalPrice: true,
                specialInstructions: true,
              },
              with: {
                options: true,
              },
            },
            rider: true,
          },
        });

        const orders = await query;

        return c.json({
          message: "success",
          data: orders,
        });
      } catch (error) {
        console.error("Error fetching orders:", error);
        return c.json({ message: "Internal server error" }, 500);
      }
    }
  )

  // Get single order by ID
  .get("/order/:id", async (c) => {
    try {
      const { id } = c.req.param();
      const db = c.get("db");
      const orgId = c.get("orgId");
      const order = await db.query.orderTable.findFirst({
        where: (orders, { and, eq }) =>
          and(eq(orders.id, id), eq(orders.shopId, orgId)),
        with: {
          customer: true,
          shop: {
            columns: {
              id: true,
              name: true,
              commission: true,
            },
          },
          items: {
            columns: {
              id: true,
              menuItemId: true,
              menuItemName: true,
              quantity: true,
              unitPrice: true,
              totalPrice: true,
              specialInstructions: true,
            },
            with: {
              options: true,
              menuItem: {
                columns: {
                  imageUrl: true,
                },
              },
            },
          },
          rider: true,
        },
      });

      if (!order) {
        return c.json({ message: "Order not found" }, 404);
      }

      return c.json({
        message: "success",
        data: order,
      });
    } catch (error) {
      console.error("Error fetching order:", error);
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
      // const includeTodo = c.req.query("includeTodo") === "true";

      const shop = await db.query.shopTable.findFirst({
        where: eq(shopTable.id, orgId),
        with: {
          operatingHours: true,
        },
      });
      if (!shop) {
        return c.json({ error: "Shop not found" }, 404);
      }
      let todoData = await todoService.getComputedTodos(shop.id, db);
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

        // Insert new hours
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
        return c.json({ message: "Internal server error" }, 500);
      }
    }
  )

  // ===== PAYMENT & BANKING ROUTES =====

  // Get banks list from Paystack
  .get("/banks", async (c) => {
    try {
      // Fetch list of banks from Paystack
      const response = await fetch(
        "https://api.paystack.co/bank?currency=NGN",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        return c.json(
          {
            success: false,
            message: "Failed to fetch banks from payment provider",
          },
          500
        );
      }

      const data: { status: boolean } = await response.json();

      // Return only active banks and format them
      if (data.status) {
        const banks = data.data
          .filter((bank: any) => bank.active)
          .map((bank: any) => ({
            id: bank.id,
            name: bank.name,
            code: bank.code,
          }));

        return c.json({ success: true, data: banks });
      } else {
        return c.json(
          {
            success: false,
            message: "Failed to process bank list",
          },
          400
        );
      }
    } catch (error) {
      console.error("Error fetching banks:", error);
      return c.json(
        {
          success: false,
          message: "Internal server error",
        },
        500
      );
    }
  })

  // Verify bank account
  .post(
    "/verify-account",
    zValidator(
      "json",
      z.object({
        accountNumber: z.string().length(10),
        bankCode: z.string(),
      })
    ),
    async (c) => {
      try {
        const { accountNumber, bankCode } = c.req.valid("json");

        // Call Paystack to verify the account
        const response = await fetch(
          `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
              "Content-Type": "application/json",
            },
          }
        );

        const data = await response.json();

        if (data.status) {
          return c.json({
            success: true,
            data: {
              accountName: data.data.account_name,
            },
          });
        } else {
          return c.json(
            {
              success: false,
              message: data.message || "Could not verify account",
            },
            400
          );
        }
      } catch (error) {
        console.error("Error verifying account:", error);
        return c.json(
          {
            success: false,
            message: "Internal server error",
          },
          500
        );
      }
    }
  )

  // Create/save payment method (bank account)
  .post(
    "/payment-methods",
    zValidator(
      "json",
      z.object({
        type: z.enum(["BANK_TRANSFER", "CARD", "MOBILE_MONEY"]),
        accountNumber: z.string().optional(),
        accountName: z.string().optional(),
        bankName: z.string().optional(),
        bankCode: z.string().optional(),
      })
    ),
    async (c) => {
      try {
        const paymentMethodData = c.req.valid("json");
        const orgId = c.get("orgId");
        const db = c.get("db");
        // For bank transfers, create a Paystack recipient
        let paystackRecipientCode = null;
        if (
          paymentMethodData.type === "BANK_TRANSFER" &&
          paymentMethodData.accountNumber &&
          paymentMethodData.accountName &&
          paymentMethodData.bankCode
        ) {
          try {
            const response = await fetch(
              "https://api.paystack.co/transferrecipient",
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  type: "nuban",
                  name: paymentMethodData.accountName,
                  account_number: paymentMethodData.accountNumber,
                  bank_code: paymentMethodData.bankCode,
                  currency: "NGN", // Adjust as needed for your market
                }),
              }
            );

            const data = await response.json();

            if (data.status) {
              paystackRecipientCode = data.data.recipient_code;
            } else {
              throw new Error(data.message || "Failed to create recipient");
            }
          } catch (error) {
            console.error("Error creating Paystack recipient:", error);
            throw error;
          }
        }

        // Create new payment method entry
        const paymentMethod = await db
          .insert(shopPaymentMethodTable)
          .values({
            shopId: orgId,
            type: paymentMethodData.type,
            accountNumber: paymentMethodData.accountNumber,
            accountName: paymentMethodData.accountName,
            bankName: paymentMethodData.bankName,
            bankCode: paymentMethodData.bankCode,
            paystackRecipientCode: paystackRecipientCode,
          })
          .returning()
          .get();

        return c.json({
          success: true,
          data: paymentMethod,
        });
      } catch (error) {
        return c.json(
          {
            success: false,
            message: "Failed to create payment method",
          },
          500
        );
      }
    }
  )

  // Get vendor payment methods
  .get("/payment-methods", async (c) => {
    try {
      const db = c.get("db");
      const orgId = c.get("orgId");

      const paymentMethods = await db.query.shopPaymentMethodTable.findMany({
        where: eq(shopPaymentMethodTable.shopId, orgId),
      });

      return c.json({
        success: true,
        data: paymentMethods,
      });
    } catch (error) {
      console.error("Error fetching payment methods:", error);
      return c.json(
        {
          success: false,
          message: "Failed to fetch payment methods",
        },
        500
      );
    }
  })

  // Delete a payment method
  .delete("/payment-methods/:id", async (c) => {
    try {
      const { id } = c.req.param();
      const db = c.get("db");
      const orgId = c.get("orgId");

      // Check if the payment method exists and belongs to this vendor
      const paymentMethod = await db.query.shopPaymentMethodTable.findFirst({
        where: and(
          eq(shopPaymentMethodTable.id, id),
          eq(shopPaymentMethodTable.shopId, orgId)
        ),
      });

      if (!paymentMethod) {
        return c.json(
          {
            success: false,
            message:
              "Payment method not found or you do not have permission to delete it",
          },
          404
        );
      }

      // Delete the payment method
      await db
        .delete(shopPaymentMethodTable)
        .where(
          and(
            eq(shopPaymentMethodTable.id, id),
            eq(shopPaymentMethodTable.shopId, orgId)
          )
        );

      return c.json({
        success: true,
        message: "Payment method deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting payment method:", error);
      return c.json(
        {
          success: false,
          message: "Failed to delete payment method",
        },
        500
      );
    }
  })
  // Get vendor wallet balance
  .get("/wallet", async (c) => {
    try {
      const user = c.get("user");
      const { VendorPaymentService } = await import(
        "../services/vendorPayment.service"
      );
      const vendorPaymentService = new VendorPaymentService();

      const walletData = await vendorPaymentService.getVendorWalletBalance(
        user.id,
        c.get("db")
      );

      return c.json({
        success: true,
        data: walletData,
      });
    } catch (error) {
      console.error("Error fetching wallet balance:", error);
      return c.json(
        {
          success: false,
          message: "Failed to fetch wallet balance",
        },
        500
      );
    }
  })
  // Check if vendor has accepted terms and conditions
  .get("/terms-agreement/check", async (c) => {
    try {
      const db = c.get("db");
      const orgId = c.get("orgId");

      // Check if there's an accepted agreement for this shop
      const agreement = await db.query.shopAgreementsTable.findFirst({
        where: and(
          eq(shopAgreementsTable.shopId, orgId),
          eq(shopAgreementsTable.agreementType, "VENDOR_TERMS")
        ),
      });

      return c.json({
        success: true,
        hasAgreement: !!agreement,
      });
    } catch (error) {
      console.error("Error checking terms agreement:", error);
      return c.json(
        {
          success: false,
          message: "Failed to check terms agreement status",
        },
        500
      );
    }
  })

  // Save vendor terms and conditions agreement
  .post(
    "/terms-agreement",
    zValidator(
      "json",
      z.object({
        agreementType: z.enum(["VENDOR_TERMS"]),
        version: z.string(),
        accepted: z.boolean(),
      })
    ),
    async (c) => {
      try {
        const data = c.req.valid("json");
        const db = c.get("db");
        const orgId = c.get("orgId");
        const user = c.get("user");
        if (!user) {
          return c.json(
            {
              success: false,
              message: "User not found",
            },
            404
          );
        }
        // Only save the agreement record if it was accepted
        if (data.accepted) {
          const agreement = await db
            .insert(shopAgreementsTable)
            .values({
              shopId: orgId,
              agreementType: data.agreementType,
              version: data.version,
              acceptedById: user.id,
              ipAddress:
                c.req.header("x-forwarded-for") ||
                c.req.header("x-real-ip") ||
                "unknown",
              userAgent: c.req.header("user-agent") || "unknown",
            })
            .returning()
            .get();

          return c.json({
            success: true,
            message: "Terms accepted successfully",
            data: agreement,
          });
        } else {
          return c.json({
            success: true,
            message: "Terms declined",
          });
        }
      } catch (error) {
        console.error("Error saving terms agreement:", error);
        return c.json(
          {
            success: false,
            message: "Failed to save terms agreement",
          },
          500
        );
      }
    }
  )

  // Update vendor todo items
  .post(
    "/update-todo",
    zValidator(
      "json",
      z.object({
        storeInformationComplete: z.boolean().optional(),
        uploadAtLeastOneMenu: z.boolean().optional(),
        setUpPaymentMethod: z.boolean().optional(),
        reviewTermsAndConditions: z.boolean().optional(),
        setUpOperatingHours: z.boolean().optional(),
      })
    ),
    async (c) => {
      try {
        const data = c.req.valid("json");
        const db = c.get("db");
        const orgId = c.get("orgId");

        // Check if todo exists first
        const todoExists = await db.query.shopTodoTable.findFirst({
          where: eq(shopTodoTable.shopId, orgId),
        });

        let updatedTodo;

        if (todoExists) {
          // Update existing todo
          updatedTodo = await db
            .update(shopTodoTable)
            .set(data)
            .where(eq(shopTodoTable.shopId, orgId))
            .returning()
            .get();
        } else {
          // Create new todo entry
          updatedTodo = await db
            .insert(shopTodoTable)
            .values({
              shopId: orgId,
              ...data,
            })
            .returning()
            .get();
        }

        return c.json({
          success: true,
          message: "Todo updated successfully",
          data: updatedTodo,
        });
      } catch (error) {
        console.error("Error updating todo:", error);
        return c.json(
          {
            success: false,
            message: "Failed to update todo",
          },
          500
        );
      }
    }
  )
  .post("/request-activation", async (c) => {
    try {
      const db = c.get("db");
      const orgId = c.get("orgId");
      const user = c.get("user");

      if (!user) {
        return c.json(
          {
            success: false,
            message: "User not authenticated",
          },
          401
        );
      }

      // Use ShopTodoService to dynamically check completion status
      const todoService = new ShopTodoService();
      const todoStatus = await todoService.getComputedTodos(orgId, db);

      if (!todoStatus) {
        return c.json(
          {
            success: false,
            message: "Shop not found",
          },
          404
        );
      }

      const { todo } = todoStatus;
      const allTasksComplete =
        todo.storeInformationComplete &&
        todo.uploadAtLeastOneMenu &&
        todo.setUpPaymentMethod &&
        todo.reviewTermsAndConditions &&
        todo.setUpOperatingHours;

      if (!allTasksComplete) {
        return c.json(
          {
            success: false,
            message:
              "Please complete all setup tasks before requesting activation.",
            data: todo,
          },
          400
        );
      }

      // Get current shop status
      const currentShop = await db.query.shopTable.findFirst({
        where: (table, { eq }) => eq(table.id, orgId),
        columns: { status: true },
      });

      if (!currentShop) {
        return c.json(
          {
            success: false,
            message: "Shop not found",
          },
          404
        );
      }

      if (currentShop.status === "APPROVED") {
        return c.json({
          success: true,
          message: "Shop is already approved and active.",
        });
      }

      // Update shop status to PENDING for review
      await db
        .update(shopTable)
        .set({ status: "PENDING" })
        .where(eq(shopTable.id, orgId));

      return c.json({
        success: true,
        message:
          "Activation request submitted successfully. Your shop is now pending review.",
      });
    } catch (error) {
      console.error("Error requesting activation:", error);
      return c.json(
        {
          success: false,
          message: "Failed to request shop activation.",
        },
        500
      );
    }
  })
  .post("/cover-image", zValidator("form", bannerImageSchema), async (c) => {
    try {
      const { file } = c.req.valid("form");
      const db = c.get("db");
      const orgId = c.get("orgId");

      // Delete existing banner image if it exists
      const shop = await db.query.shopTable.findFirst({
        where: (shops) => eq(shops.id, orgId),
      });

      if (shop?.coverImage) {
        try {
          const oldFilename = shop.coverImage.substring(
            shop.coverImage.lastIndexOf("/") + 1
          );
          await env.BUCKET.delete(oldFilename);
        } catch (error) {
          console.error("Error deleting old banner:", error);
        }
      }

      // Upload new banner image
      const imageBuffer = await file.arrayBuffer();
      const filename = `${orgId}-banner-${Date.now()}-${file.name}`;
      await env.BUCKET.put(filename, imageBuffer, {
        httpMetadata: { contentType: file.type },
      });

      const imageUrl = `${env.R2_PUBLIC_URL}/${filename}`;

      // Update shop record with new banner URL
      const updatedShop = await db
        .update(shopTable)
        .set({ coverImage: imageUrl })
        .where(eq(shopTable.id, orgId))
        .returning()
        .get();

      return c.json({
        success: true,
        message: "Banner uploaded successfully",
        data: { url: imageUrl },
      });
    } catch (error) {
      console.error("Error uploading banner:", error);
      return c.json(
        {
          success: false,
          message: "Failed to upload banner image",
        },
        500
      );
    }
  })
  .delete("/cover-image", async (c) => {
    try {
      const db = c.get("db");
      const orgId = c.get("orgId");

      // Get current shop record
      const shop = await db.query.shopTable.findFirst({
        where: (table, { eq }) => eq(table.id, orgId),
      });

      if (!shop?.coverImage) {
        return c.json(
          {
            success: false,
            message: "No banner image found",
          },
          404
        );
      }

      try {
        // Extract filename from the full URL
        const filename = shop.coverImage.substring(
          shop.coverImage.lastIndexOf("/") + 1
        );
        // Delete from R2 bucket
        await env.BUCKET.delete(filename);
      } catch (error) {
        console.error("Error deleting banner from bucket:", error);
      }

      // Update shop record to remove banner URL
      const updatedShop = await db
        .update(shopTable)
        .set({ coverImage: null })
        .where(eq(shopTable.id, orgId))
        .returning()
        .get();

      return c.json({
        success: true,
        message: "Banner deleted successfully",
        data: updatedShop,
      });
    } catch (error) {
      console.error("Error deleting banner:", error);
      return c.json(
        {
          success: false,
          message: "Failed to delete banner image",
        },
        500
      );
    }
  })
  // Get vendor transaction history
  .get("/transactions", async (c) => {
    try {
      const user = c.get("user");
      const limit = parseInt(c.req.query("limit") || "50");
      const { VendorPaymentService } = await import(
        "../services/vendorPayment.service"
      );
      const vendorPaymentService = new VendorPaymentService();

      const transactions =
        await vendorPaymentService.getVendorTransactionHistory(
          user.id,
          c.get("db"),
          limit
        );

      return c.json({
        success: true,
        data: transactions,
      });
    } catch (error) {
      console.error("Error fetching transaction history:", error);
      return c.json(
        {
          success: false,
          message: "Failed to fetch transaction history",
        },
        500
      );
    }
  });

// || Promotion routes
// List all promotions for the vendor's shop
// .get("/", async (c) => {
//   try {
//     const db = c.get("db");
//     const session = c.get("session");

//     if (!session?.activeOrganizationId) {
//       return c.json({ error: "Unauthorized" }, 401);
//     }

//     // Pagination parameters
//     const limit = Number(c.req.query("limit")) || 20;
//     const page = Number(c.req.query("page")) || 1;
//     const offset = (page - 1) * limit;

//     // Get promotions for the active shop
//     const shopPromotions = await db.query.promotions.findMany({
//       where: eq(promotions.shopId, session.activeOrganizationId),
//       orderBy: (promotions) => [promotions.createdAt],
//       limit,
//       offset,
//     });

//     // Get total count for pagination
//     const countResult = await db
//       .select({ count: sql`count(*)` })
//       .from(promotions)
//       .where(eq(promotions.shopId, session.activeOrganizationId));

//     const totalCount = Number(countResult[0]?.count || 0);

//     return c.json({
//       data: shopPromotions,
//       pagination: {
//         total: totalCount,
//         page,
//         limit,
//         pages: Math.ceil(totalCount / limit),
//       },
//     });
//   } catch (error) {
//     console.error("Error fetching promotions:", error);
//     return c.json({ error: "Internal server error" }, 500);
//   }
// })

// // Get a single promotion by ID
// .get("/:id", async (c) => {
//   try {
//     const { id } = c.req.param();
//     const db = c.get("db");
//     const session = c.get("session");

//     if (!session?.activeOrganizationId) {
//       return c.json({ error: "Unauthorized" }, 401);
//     }

//     // Get the promotion
//     const promotion = await db.query.promotions.findFirst({
//       where: and(
//         eq(promotions.id, id),
//         eq(promotions.shopId, session.activeOrganizationId)
//       ),
//       with: {
//         products: true,
//       },
//     });

//     if (!promotion) {
//       return c.json({ error: "Promotion not found" }, 404);
//     }

//     return c.json({ data: promotion });
//   } catch (error) {
//     console.error("Error fetching promotion:", error);
//     return c.json({ error: "Internal server error" }, 500);
//   }
// })

// // Create a new promotion
// .post("/", zValidator("json", createPromotionSchema), async (c) => {
//   try {
//     const data = c.req.valid("json");
//     const db = c.get("db");
//     const user = c.get("user");
//     const session = c.get("session");
//     const auth = await createAuth(db);

//     if (!user || !session?.activeOrganizationId) {
//       return c.json({ error: "Unauthorized" }, 401);
//     }

//     // Check organization membership and role
//     const member = await auth.api.getActiveMember();
//     if (!member || member.role !== "admin") {
//       return c.json({ error: "Only admins can create promotions" }, 403);
//     }

//     // Check if code is already in use
//     const existingPromotion = await db.query.promotions.findFirst({
//       where: and(
//         eq(promotions.code, data.code),
//         eq(promotions.shopId, session.activeOrganizationId)
//       ),
//     });

//     if (existingPromotion) {
//       return c.json({ error: "This coupon code is already in use" }, 400);
//     }

//     // Extract product IDs if provided
//     const { productIds, ...promotionData } = data;

//     // Create the promotion
//     const promotionId = nanoid();
//     const now = new Date();

//     const newPromotion = await db
//       .insert(promotions)
//       .values({
//         id: promotionId,
//         shopId: session.activeOrganizationId,
//         ...promotionData,
//         startDate: new Date(promotionData.startDate),
//         endDate: new Date(promotionData.endDate),
//         usageCount: 0,
//         createdAt: now,
//         updatedAt: now,
//       })
//       .returning()
//       .get();

//     // Link products if specified
//     if (productIds && productIds.length > 0) {
//       await db.insert(promotionProducts).values(
//         productIds.map((productId) => ({
//           id: nanoid(),
//           promotionId: promotionId,
//           productId: productId,
//           createdAt: now,
//         }))
//       );
//     }

//     return c.json({ data: newPromotion }, 201);
//   } catch (error) {
//     console.error("Error creating promotion:", error);
//     return c.json({ error: "Internal server error" }, 500);
//   }
// })

// // Update an existing promotion
// .patch("/:id", zValidator("json", updatePromotionSchema), async (c) => {
//   try {
//     const { id } = c.req.param();
//     const data = c.req.valid("json");
//     const db = c.get("db");
//     const user = c.get("user");
//     const session = c.get("session");
//     const auth = await createAuth(db);

//     if (!user || !session?.activeOrganizationId) {
//       return c.json({ error: "Unauthorized" }, 401);
//     }

//     // Check organization membership and role
//     const member = await auth.api.getActiveMember();
//     if (!member || member.role !== "admin") {
//       return c.json({ error: "Only admins can update promotions" }, 403);
//     }

//     // Check if promotion exists
//     const existingPromotion = await db.query.promotions.findFirst({
//       where: and(
//         eq(promotions.id, id),
//         eq(promotions.shopId, session.activeOrganizationId)
//       ),
//     });

//     if (!existingPromotion) {
//       return c.json({ error: "Promotion not found" }, 404);
//     }

//     // If updating code, check if it's unique
//     if (data.code && data.code !== existingPromotion.code) {
//       const codeExists = await db.query.promotions.findFirst({
//         where: and(
//           eq(promotions.code, data.code),
//           eq(promotions.shopId, session.activeOrganizationId),
//           not(eq(promotions.id, id))
//         ),
//       });

//       if (codeExists) {
//         return c.json({ error: "This coupon code is already in use" }, 400);
//       }
//     }

//     // Extract product IDs if provided
//     const { productIds, ...promotionData } = data;

//     // Prepare update data
//     const updateData: any = {
//       ...promotionData,
//       updatedAt: new Date(),
//     };

//     // Convert date strings to Date objects
//     if (promotionData.startDate) {
//       updateData.startDate = new Date(promotionData.startDate);
//     }
//     if (promotionData.endDate) {
//       updateData.endDate = new Date(promotionData.endDate);
//     }

//     // Update the promotion
//     const updatedPromotion = await db
//       .update(promotions)
//       .set(updateData)
//       .where(eq(promotions.id, id))
//       .returning()
//       .get();

//     // Update product links if specified
//     if (productIds !== undefined) {
//       // Remove existing product links
//       await db
//         .delete(promotionProducts)
//         .where(eq(promotionProducts.promotionId, id));

//       // Add new product links
//       if (productIds.length > 0) {
//         await db.insert(promotionProducts).values(
//           productIds.map((productId) => ({
//             id: nanoid(),
//             promotionId: id,
//             productId: productId,
//             createdAt: new Date(),

//           }))
//         );
//       }
//     }

//     return c.json({ data: updatedPromotion });
//   } catch (error) {
//     console.error("Error updating promotion:", error);
//     return c.json({ error: "Internal server error" }, 500);
//   }
// })

// // Delete a promotion
// .delete("/:id", async (c) => {
//   try {
//     const { id } = c.req.param();
//     const db = c.get("db");
//     const user = c.get("user");
//     const session = c.get("session");
//     const auth = await createAuth(db);

//     if (!user || !session?.activeOrganizationId) {
//       return c.json({ error: "Unauthorized" }, 401);
//     }

//     // Check organization membership and role
//     const member = await auth.api.getActiveMember();
//     if (!member || member.role !== "admin") {
//       return c.json({ error: "Only admins can delete promotions" }, 403);
//     }

//     // Check if promotion exists
//     const existingPromotion = await db.query.promotions.findFirst({
//       where: and(
//         eq(promotions.id, id),
//         eq(promotions.shopId, session.activeOrganizationId)
//       ),
//     });

//     if (!existingPromotion) {
//       return c.json({ error: "Promotion not found" }, 404);
//     }

//     // Delete product links first
//     await db
//       .delete(promotionProducts)
//       .where(eq(promotionProducts.promotionId, id));

//     // Delete the promotion
//     await db.delete(promotions).where(eq(promotions.id, id));
//     return c.json({ success: true });
//   } catch (error) {
//     console.error("Error deleting promotion:", error);
//     return c.json({ error: "Internal server error" }, 500);
//   }
// })

export default vendorRoute;
