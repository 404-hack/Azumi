import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq, and, desc, inArray } from "drizzle-orm";
import {
  menuItemTable,
  menuItemOptionGroups,
} from "../lib/db/schema/menu.schema";
import {
  optionTable,
  optionGroupTable,
  optionToOptionGroupTable,
} from "../lib/db/schema/option.schema";
import { nanoid } from "nanoid";
import { factory } from "../lib/factory";
import {
  addCartItemSchema,
  updateCartItemSchema,
} from "../lib/validation/cart.validation";
import {
  cartItems,
  cartTable,
  cartItemOptions,
} from "../lib/db/schema/cart.schema";
import type { Context } from "../lib/types";

// Helper function to calculate totals
const calculateCartTotals = (
  cart: {
    items: Array<{
      quantity: number;
      totalPrice: number | string | null;
    }>;
  } | null
) => {
  let totalItems = 0;
  let subtotal = 0;
  (cart?.items || []).forEach((item) => {
    totalItems += item.quantity;
    const itemSubtotal = Number(item.totalPrice) || 0;
    subtotal += itemSubtotal;
  });
  return { totalItems, subtotal };
};

// Helper function to generate a consistent hash for cart item options
const generateOptionsHash = (
  options: Array<{
    optionId: string;
    optionGroupId: string | null;
    quantity?: number;
  }>
) => {
  if (!options || options.length === 0) {
    return "no-options";
  }
  const sortedOptions = options.slice().sort((a, b) => {
    const groupA = a.optionGroupId ?? "";
    const groupB = b.optionGroupId ?? "";
    if (groupA < groupB) return -1;
    if (groupA > groupB) return 1;
    if (a.optionId < b.optionId) return -1;
    if (a.optionId > b.optionId) return 1;
    return 0;
  });

  return sortedOptions
    .map(
      (opt) =>
        `${opt.optionGroupId || "none"}:${opt.optionId}:${opt.quantity || 1}`
    )
    .join("|");
};

// Helper function to map selected options consistently
const mapSelectedOption = (itemOption: any) => {
  if (!itemOption.option || !itemOption.optionGroup) {
    return null;
  }
  return {
    quantity: itemOption.quantity || 1,
    option: {
      id: itemOption.option.id,
      name: itemOption.option.name,
      price: Number(itemOption.option.price) || 0,
    },
    optionGroup: {
      id: itemOption.optionGroup.id,
      name: itemOption.optionGroup.name,
    },
  };
};

const cartRoute = factory
  .createApp()
  .get("/", async (c) => {
    try {
      const db = c.get("db");
      const user = c.get("user");

      if (!user) {
        return c.json(
          { error: "Unauthorized", message: "User not authenticated" },
          401
        );
      }

      const cartsData = await db.query.cartTable.findMany({
        where: and(
          eq(cartTable.customerId, user.id),
          eq(cartTable.status, "ACTIVE")
        ),
        with: {
          items: {
            with: {
              menuItem: {
                columns: {
                  id: true,
                  name: true,
                  price: true,
                  image: true,
                  description: true,
                  priceDescription: true,
                },
              },
              options: {
                with: {
                  option: true,
                  optionGroup: true,
                },
              },
            },
            columns: {
              id: true,
              quantity: true,
              specialInstructions: true,
              totalPrice: true,
            },
          },
          shop: {
            columns: {
              id: true,
              name: true,
              logo: true,
              slug: true,
              coverImage: true,
            },
          },
        },
        orderBy: (carts, { desc }) => [desc(carts.createdAt)],
      });

      if (cartsData.length === 0) {
        return c.json({ data: [] });
      }

      const processedCarts = cartsData.map((cart) => {
        const totals = calculateCartTotals(cart);
        const shopInfo = cart.shop
          ? {
              id: cart.shop.id,
              name: cart.shop.name,
              slug: cart.shop.slug,
              logo: cart.shop.logo,
              coverImage: cart.shop.coverImage,
            }
          : {
              id: "unknown",
              name: "Unknown Shop",
              slug: "unknown-shop",
              logo: null,
              coverImage: null,
            };

        const items = cart.items.map((item) => {
          if (!item.menuItem) {
            return {
              id: item.id,
              quantity: item.quantity,
              specialInstructions: item.specialInstructions,
              totalPrice: Number(item.totalPrice) || 0,
              menuItem: {
                id: "unknown",
                name: "Unknown Item",
                price: 0,
                image: null,
              },
              selectedOptions: [],
            };
          }

          const selectedOptions = item.options
            .map(mapSelectedOption)
            .filter((opt): opt is NonNullable<typeof opt> => opt !== null);

          return {
            id: item.id,
            quantity: item.quantity,
            specialInstructions: item.specialInstructions,
            totalPrice: Number(item.totalPrice) || 0,
            menuItem: {
              id: item.menuItem.id,
              name: item.menuItem.name,
              price: Number(item.menuItem.price) || 0,
              image: item.menuItem.image,
            },
            selectedOptions,
          };
        });

        return {
          id: cart.id,
          shop: shopInfo,
          items,
          totalItems: totals.totalItems,
          subtotal: totals.subtotal,
        };
      });

      return c.json({
        data: processedCarts,
      });
    } catch (error: any) {
      console.error("Error fetching carts:", error);
      return c.json(
        {
          error: "Internal server error",
          message: error?.message || "Failed to fetch carts",
        },
        500
      );
    }
  })
  .get("/shop/:shopId", async (c) => {
    try {
      const db = c.get("db");
      const user = c.get("user");
      const { shopId } = c.req.param();

      if (!user) {
        return c.json(
          { error: "Unauthorized", message: "User not authenticated" },
          401
        );
      }

      // First, fetch the cart with its basic items
      const cartData = await db.query.cartTable.findFirst({
        where: and(
          eq(cartTable.customerId, user.id),
          eq(cartTable.shopId, shopId),
          eq(cartTable.status, "ACTIVE")
        ),
        with: {
          items: {
            with: {
              menuItem: {
                columns: {
                  id: true,
                  name: true,
                  price: true,
                  image: true,
                  description: true,
                  priceDescription: true,
                },
              },
              options: {
                with: {
                  option: true,
                  optionGroup: true,
                },
              },
            },
            columns: {
              id: true,
              quantity: true,
              specialInstructions: true,
              totalPrice: true,
            },
          },
          shop: {
            columns: {
              id: true,
              name: true,
              logo: true,
              slug: true,
              coverImage: true,
            },
          },
        },
        columns: {
          id: true,
        },
      });

      if (!cartData) {
        return c.json(
          { data: null, message: "No active cart found for this shop." },
          404
        );
      }

      if (!cartData.shop) {
        console.error(`Cart ${cartData.id} is missing shop data.`);
        return c.json(
          {
            error: "Internal Server Error",
            message: "Cart data is incomplete (missing shop)",
          },
          500
        );
      }

      // For each menu item, fetch its available option groups and options separately
      const menuItemIds = cartData.items
        .map((item) => item.menuItem?.id)
        .filter(Boolean);

      // Fetch all option groups and their options for these menu items
      const availableOptionsMap = new Map();

      if (menuItemIds.length > 0) {
        for (const menuItemId of menuItemIds) {
          // Replace the menuItemOptionGroups query with direct table query
          const optionGroups = await db
            .select({
              menuItemId: menuItemOptionGroups.menuItemId,
              optionGroupId: menuItemOptionGroups.optionGroupId,
            })
            .from(menuItemOptionGroups)
            .where(eq(menuItemOptionGroups.menuItemId, menuItemId));

          const optionGroupIds = optionGroups.map((g) => g.optionGroupId);

          const availableOptions = [];

          for (const optionGroupId of optionGroupIds) {
            const optionGroup = await db.query.optionGroupTable.findFirst({
              where: eq(optionGroupTable.id, optionGroupId),
              columns: {
                id: true,
                name: true,
                minSelections: true,
                maxSelections: true,
              },
            });

            if (optionGroup) {
              const options = await db.query.optionToOptionGroupTable.findMany({
                where: eq(
                  optionToOptionGroupTable.optionGroupId,
                  optionGroupId
                ),
                with: {
                  option: {
                    columns: {
                      id: true,
                      name: true,
                      price: true,
                    },
                  },
                },
              });

              availableOptions.push({
                ...optionGroup,
                options: options.map((opt) => opt.option).filter(Boolean),
              });
            }
          }

          availableOptionsMap.set(menuItemId, availableOptions);
        }
      }

      // Map the cart data with both selected and available options
      const mappedCart = {
        id: cartData.id,
        shop: {
          id: cartData.shop.id,
          name: cartData.shop.name,
          slug: cartData.shop.slug,
          logo: cartData.shop.logo,
          coverImage: cartData.shop.coverImage,
        },
        items: cartData.items.map((item) => {
          if (!item.menuItem) {
            console.error(`Cart item ${item.id} is missing menu item data.`);
            return {
              id: item.id,
              quantity: item.quantity,
              specialInstructions: item.specialInstructions,
              totalPrice: Number(item.totalPrice) || 0,
              menuItem: {
                id: "unknown",
                name: "Unknown Item",
                price: 0,
                image: null,
              },
              selectedOptions: [],
              availableOptionGroups: [],
            };
          }

          const selectedOptions = item.options
            .map(mapSelectedOption)
            .filter((opt): opt is NonNullable<typeof opt> => opt !== null);

          return {
            id: item.id,
            quantity: item.quantity,
            specialInstructions: item.specialInstructions,
            totalPrice: Number(item.totalPrice) || 0,
            menuItem: {
              ...item.menuItem,
            },
            selectedOptions,
            availableOptionGroups:
              availableOptionsMap.get(item.menuItem.id) || [],
          };
        }),
        ...calculateCartTotals(cartData),
      };

      return c.json({
        data: mappedCart,
      });
    } catch (error: any) {
      console.error("Error fetching cart by shop:", error);
      return c.json(
        {
          error: "Internal server error",
          message: error?.message || "Failed to fetch cart for shop",
        },
        500
      );
    }
  })

  .post("/", zValidator("json", addCartItemSchema), async (c) => {
    const db = c.get("db");
    const user = c.get("user");

    if (!user) {
      return c.json(
        { error: "Unauthorized", message: "User not authenticated" },
        401
      );
    }

    try {
      const data = c.req.valid("json");

      // --- Pre-computation and Checks ---
      const menuItem = await db.query.menuItemTable.findFirst({
        where: eq(menuItemTable.id, data.menuItemId),
        columns: { id: true, shopId: true, price: true, name: true },
      });

      if (!menuItem || !menuItem.shopId) {
        return c.json(
          { error: "Not Found", message: "Menu item not found or is invalid" },
          404
        );
      }

      // Find or create cart
      let cart = await db.query.cartTable.findFirst({
        where: and(
          eq(cartTable.customerId, user.id),
          eq(cartTable.shopId, menuItem.shopId),
          eq(cartTable.status, "ACTIVE")
        ),
        columns: { id: true },
      });

      let cartId: string;
      if (!cart) {
        const newCartResult = await db
          .insert(cartTable)
          .values({
            customerId: user.id,
            shopId: menuItem.shopId,
            status: "ACTIVE",
          })
          .returning({ id: cartTable.id });

        if (!newCartResult || newCartResult.length === 0) {
          console.error("Failed to create cart record");
          return c.json(
            {
              error: "Internal Server Error",
              message: "Failed to initialize cart",
            },
            500
          );
        }
        cartId = newCartResult[0].id;
      } else {
        cartId = cart.id;
      } // Generate hash for options to uniquely identify this combination
      const optionsHash = generateOptionsHash(data.options || []);

      // Check for existing item with the same menu item ID AND options hash
      const existingCartItem = await db.query.cartItems.findFirst({
        where: and(
          eq(cartItems.cartId, cartId),
          eq(cartItems.menuItemId, data.menuItemId),
          eq(cartItems.optionsHash, optionsHash) // Add condition to check options hash
        ),
        columns: { id: true, quantity: true, totalPrice: true },
      });

      // Calculate prices
      const menuItemPrice = Number(menuItem.price) || 0;
      // Base price component should be per unit, not multiplied by quantity yet
      const baseItemPricePerUnit = menuItemPrice;
      let optionsPricePerUnit = 0; // Calculate total price of selected options per unit
      let selectedOptionDetails: Array<{
        optionId: string;
        optionGroupId: string | null; // Allow null
        quantity: number;
        price: number; // Price of the option itself
      }> = [];

      if (data.options && data.options.length > 0) {
        const optionIds = data.options.map((opt) => opt.optionId);
        if (optionIds.length > 0) {
          const dbOptions = await db.query.optionTable.findMany({
            where: inArray(optionTable.id, optionIds),
            columns: { id: true, price: true },
          });
          const dbOptionsMap = new Map(dbOptions.map((opt) => [opt.id, opt]));

          for (const reqOption of data.options) {
            const dbOption = dbOptionsMap.get(reqOption.optionId);
            if (!dbOption) {
              return c.json(
                {
                  error: "Bad Request",
                  message: `Invalid option ID: ${reqOption.optionId}`,
                },
                400
              );
            }
            const optionPrice = Number(dbOption.price) || 0;
            // Option quantity from request (usually 1 for selection, but could be more)
            const optionQuantity = reqOption.quantity || 1;
            // Add to the *per unit* price increase from options
            optionsPricePerUnit += optionPrice * optionQuantity;
            selectedOptionDetails.push({
              optionId: dbOption.id,
              optionGroupId: reqOption.optionGroupId || null, // Store null if not provided
              quantity: optionQuantity,
              price: optionPrice, // Store the option's base price
            });
          }
        }
      }

      // Calculate the total price for *one* unit of this item configuration
      const totalItemPricePerUnit = baseItemPricePerUnit + optionsPricePerUnit;
      // Calculate the final total price for the line item (price per unit * quantity)
      const finalLineItemTotalPrice = totalItemPricePerUnit * data.quantity;

      // --- Perform Database Operations Sequentially ---
      let finalCartItemId: string;
      if (existingCartItem) {
        finalCartItemId = existingCartItem.id;
        // Replace quantity instead of adding to it
        const finalQuantity = data.quantity;
        // Use the newly calculated final line item total price
        const totalItemPrice = finalLineItemTotalPrice;

        // Update existing item
        await db
          .update(cartItems)
          .set({
            quantity: finalQuantity,
            specialInstructions: data.specialInstructions,
            totalPrice: totalItemPrice, // Update with the correct total price
            optionsHash: optionsHash, // Ensure hash is updated if options changed (though logic implies they are the same here)
          })
          .where(eq(cartItems.id, existingCartItem.id));

        // Delete existing options ONLY IF the options actually changed.
        // Since we matched on optionsHash, they *should* be the same.
        // If the intent is to always replace options even if identical, keep the delete.
        // If the intent is only to update quantity, skip delete/insert of options.
        // For robustness (in case hash logic had edge cases or requirements change),
        // let's keep the delete/re-insert pattern for now.
        await db
          .delete(cartItemOptions)
          .where(eq(cartItemOptions.cartItemId, existingCartItem.id));

        // Insert new options for the updated item
        if (selectedOptionDetails.length > 0) {
          await db.insert(cartItemOptions).values(
            selectedOptionDetails.map((opt) => ({
              id: nanoid(), // Generate new ID for option instance
              cartItemId: finalCartItemId,
              optionId: opt.optionId,
              optionGroupId: opt.optionGroupId, // Use stored null if applicable
              quantity: opt.quantity,
              price: opt.price, // Store price at time of adding
            }))
          );
        }
      } else {
        // Item does not exist, create new one
        finalCartItemId = nanoid();
        // Use the newly calculated final line item total price
        const totalItemPrice = finalLineItemTotalPrice;

        // Insert new cart item with options hash
        await db.insert(cartItems).values({
          id: finalCartItemId,
          cartId: cartId,
          menuItemId: data.menuItemId,
          optionsHash: optionsHash, // Store the options hash to identify unique configurations
          quantity: data.quantity,
          specialInstructions: data.specialInstructions,
          totalPrice: totalItemPrice, // Store the correct total price
        });

        // Insert options for the new item
        if (selectedOptionDetails.length > 0) {
          await db.insert(cartItemOptions).values(
            selectedOptionDetails.map((opt) => ({
              id: nanoid(), // Generate new ID for option instance
              cartItemId: finalCartItemId,
              optionId: opt.optionId,
              optionGroupId: opt.optionGroupId, // Use stored null if applicable
              quantity: opt.quantity,
              price: opt.price, // Store price at time of adding
            }))
          );
        }
      }

      // --- Fetch Final State (including available options) ---
      const finalCartState = await db.query.cartTable.findFirst({
        where: eq(cartTable.id, cartId),
        with: {
          items: {
            with: {
              menuItem: {
                columns: {
                  id: true,
                  name: true,
                  price: true,
                  image: true,
                },
              },
              options: {
                with: {
                  option: true,
                  optionGroup: true,
                },
              },
            },
            columns: {
              id: true,
              quantity: true,
              specialInstructions: true,
              totalPrice: true,
            },
          },
          shop: {
            columns: {
              id: true,
              name: true,
              logo: true,
              slug: true,
              coverImage: true,
            },
          },
        },
        columns: {
          id: true,
        },
      });

      if (!finalCartState) {
        console.error(
          "Failed to fetch final cart state after add/update for cart:",
          cartId
        );
        return c.json(
          {
            error: "Internal Server Error",
            message: "Failed to retrieve updated cart state",
          },
          500
        );
      }

      if (!finalCartState.shop) {
        console.error(
          `Cart ${finalCartState.id} is missing shop data after add/update.`
        );
        return c.json(
          {
            error: "Internal Server Error",
            message: "Updated cart data is incomplete (missing shop)",
          },
          500
        );
      }

      // Fetch available options for all menu items
      const menuItemIds = finalCartState.items
        .map((item) => item.menuItem?.id)
        .filter(Boolean);
      const availableOptionsMap = new Map();

      if (menuItemIds.length > 0) {
        for (const menuItemId of menuItemIds) {
          // Replace the menuItemOptionGroups query with direct table query
          const optionGroups = await db
            .select({
              menuItemId: menuItemOptionGroups.menuItemId,
              optionGroupId: menuItemOptionGroups.optionGroupId,
            })
            .from(menuItemOptionGroups)
            .where(eq(menuItemOptionGroups.menuItemId, menuItemId));

          const optionGroupIds = optionGroups.map((g) => g.optionGroupId);

          const availableOptions = [];

          for (const optionGroupId of optionGroupIds) {
            const optionGroup = await db.query.optionGroupTable.findFirst({
              where: eq(optionGroupTable.id, optionGroupId),
              columns: {
                id: true,
                name: true,
                minSelections: true,
                maxSelections: true,
              },
            });

            if (optionGroup) {
              const options = await db.query.optionToOptionGroupTable.findMany({
                where: eq(
                  optionToOptionGroupTable.optionGroupId,
                  optionGroupId
                ),
                with: {
                  option: {
                    columns: {
                      id: true,
                      name: true,
                      price: true,
                    },
                  },
                },
              });

              availableOptions.push({
                ...optionGroup,
                options: options.map((opt) => opt.option).filter(Boolean),
              });
            }
          }

          availableOptionsMap.set(menuItemId, availableOptions);
        }
      }

      // Map the final state with both selected and available options
      const mappedCartState = {
        id: finalCartState.id,
        shop: {
          id: finalCartState.shop.id,
          name: finalCartState.shop.name,
          slug: finalCartState.shop.slug,
          logo: finalCartState.shop.logo,
          coverImage: finalCartState.shop.coverImage,
        },
        items: finalCartState.items.map((item) => {
          if (!item.menuItem) {
            console.error(
              `Cart item ${item.id} in final state is missing menu item data.`
            );
            return {
              id: item.id,
              quantity: item.quantity,
              specialInstructions: item.specialInstructions,
              totalPrice: Number(item.totalPrice) || 0,
              menuItem: {
                id: "unknown",
                name: "Unknown Item",
                price: 0,
                image: null,
              },
              selectedOptions: [],
              availableOptionGroups: [],
            };
          }

          const selectedOptions = item.options
            .map(mapSelectedOption)
            .filter((opt): opt is NonNullable<typeof opt> => opt !== null);

          return {
            id: item.id,
            quantity: item.quantity,
            specialInstructions: item.specialInstructions,
            totalPrice: Number(item.totalPrice) || 0,
            menuItem: {
              id: item.menuItem.id,
              name: item.menuItem.name,
              price: Number(item.menuItem.price) || 0,
              image: item.menuItem.image,
            },
            selectedOptions,
            availableOptionGroups:
              availableOptionsMap.get(item.menuItem.id) || [],
          };
        }),
        ...calculateCartTotals(finalCartState),
      };

      return c.json({
        data: mappedCartState,
      });
    } catch (error: any) {
      console.error("Error adding item to cart:", error);
      return c.json(
        {
          error: "Internal server error",
          message: error?.message || "Failed to add item to cart",
        },
        500
      );
    }
  })
  .patch(
    "/items/:itemId",
    zValidator("json", updateCartItemSchema),
    async (c) => {
      const db = c.get("db");
      const user = c.get("user");
      const { itemId } = c.req.param();

      if (!user) {
        return c.json(
          { error: "Unauthorized", message: "User not authenticated" },
          401
        );
      }

      try {
        const { quantity } = c.req.valid("json");

        if (quantity <= 0) {
          return c.json(
            {
              error: "Bad Request",
              message: "Quantity must be positive. Use DELETE to remove items.",
            },
            400
          );
        }

        // --- Pre-computation and Checks ---
        // Fetch item with necessary relations to calculate price and check ownership
        const cartItem = await db.query.cartItems.findFirst({
          where: eq(cartItems.id, itemId),
          with: {
            cart: { columns: { customerId: true, id: true } }, // Need cart ID and owner ID
            menuItem: { columns: { price: true } }, // Need base price
            options: {
              // Need options to recalculate price per unit
              with: {
                option: { columns: { price: true } }, // Need individual option prices
              },
              columns: { quantity: true }, // Need quantity of each selected option
            },
          },
          columns: { id: true }, // Need item ID itself
        });

        if (!cartItem || !cartItem.cart) {
          return c.json(
            {
              error: "Not Found",
              message: "Cart item or associated cart not found",
            },
            404
          );
        }
        if (cartItem.cart.customerId !== user.id) {
          return c.json(
            { error: "Forbidden", message: "You do not own this cart item" },
            403
          );
        }
        if (!cartItem.menuItem) {
          console.error(
            "Internal Error: Menu item data missing for cart item:",
            itemId
          );
          return c.json(
            {
              error: "Internal Server Error",
              message: "Internal Error: Menu item data missing",
            },
            500
          );
        }

        const parentCartId = cartItem.cart.id; // Get parent cart ID for final fetch

        // Recalculate the price per unit based on fetched data
        const basePrice = Number(cartItem.menuItem.price) || 0;
        let optionsPricePerUnit = 0;
        (cartItem.options || []).forEach((optInstance) => {
          // Ensure the nested option and its price exist
          const optionPrice = Number(optInstance.option?.price) || 0;
          const optionQuantity = optInstance.quantity || 1; // Default to 1 if quantity is missing
          optionsPricePerUnit += optionPrice * optionQuantity;
        });

        const pricePerUnit = basePrice + optionsPricePerUnit;
        const newTotalPrice = pricePerUnit * quantity; // Calculate new total line item price

        // --- Perform Update Operation ---
        await db
          .update(cartItems)
          .set({
            quantity: quantity,
            totalPrice: newTotalPrice, // Update with the recalculated total price
          })
          .where(eq(cartItems.id, itemId));

        // --- After update, fetch the final state ---
        const finalCartState = await db.query.cartTable.findFirst({
          where: eq(cartTable.id, parentCartId),
          with: {
            items: {
              with: {
                menuItem: {
                  columns: {
                    id: true,
                    name: true,
                    price: true,
                    image: true,
                  },
                },
                options: {
                  with: {
                    option: true,
                    optionGroup: true,
                  },
                },
              },
              columns: {
                id: true,
                quantity: true,
                specialInstructions: true,
                totalPrice: true,
              },
            },
            shop: {
              columns: {
                id: true,
                name: true,
                logo: true,
                slug: true,
                coverImage: true,
              },
            },
          },
          columns: {
            id: true,
          },
        });

        if (!finalCartState) {
          console.error(
            "Failed to fetch updated parent cart after item update for cart:",
            parentCartId
          );
          return c.json(
            {
              error: "Internal Server Error",
              message: "Failed to retrieve updated cart state",
            },
            500
          );
        }

        if (!finalCartState.shop) {
          console.error(
            `Cart ${finalCartState.id} is missing shop data after item update.`
          );
          return c.json(
            {
              error: "Internal Server Error",
              message: "Updated cart data is incomplete (missing shop)",
            },
            500
          );
        }

        // Fetch available options for all menu items
        const menuItemIds = finalCartState.items
          .map((item) => item.menuItem?.id)
          .filter(Boolean);
        const availableOptionsMap = new Map();

        if (menuItemIds.length > 0) {
          for (const menuItemId of menuItemIds) {
            // Replace the menuItemOptionGroups query with direct table query
            const optionGroups = await db
              .select({
                menuItemId: menuItemOptionGroups.menuItemId,
                optionGroupId: menuItemOptionGroups.optionGroupId,
              })
              .from(menuItemOptionGroups)
              .where(eq(menuItemOptionGroups.menuItemId, menuItemId));

            const optionGroupIds = optionGroups.map((g) => g.optionGroupId);

            const availableOptions = [];

            for (const optionGroupId of optionGroupIds) {
              const optionGroup = await db.query.optionGroupTable.findFirst({
                where: eq(optionGroupTable.id, optionGroupId),
                columns: {
                  id: true,
                  name: true,
                  minSelections: true,
                  maxSelections: true,
                },
              });

              if (optionGroup) {
                const options =
                  await db.query.optionToOptionGroupTable.findMany({
                    where: eq(
                      optionToOptionGroupTable.optionGroupId,
                      optionGroupId
                    ),
                    with: {
                      option: {
                        columns: {
                          id: true,
                          name: true,
                          price: true,
                        },
                      },
                    },
                  });

                availableOptions.push({
                  ...optionGroup,
                  options: options.map((opt) => opt.option).filter(Boolean),
                });
              }
            }

            availableOptionsMap.set(menuItemId, availableOptions);
          }
        }

        // Map the final state with both selected and available options
        // Use the helper function in all places where we map cart items
        const mappedCartState = {
          id: finalCartState.id,
          shop: {
            id: finalCartState.shop.id,
            name: finalCartState.shop.name,
            slug: finalCartState.shop.slug,
            logo: finalCartState.shop.logo,
            coverImage: finalCartState.shop.coverImage,
          },
          items: finalCartState.items.map((item) => {
            if (!item.menuItem) {
              console.error(
                `Cart item ${item.id} in final state is missing menu item data.`
              );
              return {
                id: item.id,
                quantity: item.quantity,
                specialInstructions: item.specialInstructions,
                totalPrice: Number(item.totalPrice) || 0,
                menuItem: {
                  id: "unknown",
                  name: "Unknown Item",
                  price: 0,
                  image: null,
                },
                selectedOptions: [],
                availableOptionGroups: [],
              };
            }

            const selectedOptions = item.options
              .map(mapSelectedOption)
              .filter((opt): opt is NonNullable<typeof opt> => opt !== null);

            return {
              id: item.id,
              quantity: item.quantity,
              specialInstructions: item.specialInstructions,
              totalPrice: Number(item.totalPrice) || 0,
              menuItem: {
                id: item.menuItem.id,
                name: item.menuItem.name,
                price: Number(item.menuItem.price) || 0,
                image: item.menuItem.image,
              },
              selectedOptions,
              availableOptionGroups:
                availableOptionsMap.get(item.menuItem.id) || [],
            };
          }),
          ...calculateCartTotals(finalCartState),
        };

        return c.json({
          data: mappedCartState,
        });
      } catch (error: any) {
        console.error("Error updating cart item:", error);
        return c.json(
          {
            error: "Internal server error",
            message: error?.message || "Failed to update cart item",
          },
          500
        );
      }
    }
  )
  .delete("/items/:itemId", async (c) => {
    const db = c.get("db");
    const user = c.get("user");
    const { itemId } = c.req.param();

    if (!user) {
      return c.json(
        { error: "Unauthorized", message: "User not authenticated" },
        401
      );
    }

    try {
      // --- Check Ownership and Get Parent Cart ID ---
      const cartItem = await db.query.cartItems.findFirst({
        where: eq(cartItems.id, itemId),
        columns: { id: true, cartId: true },
        with: {
          cart: { columns: { customerId: true } },
        },
      });

      if (!cartItem || !cartItem.cart) {
        return c.json(
          { error: "Not Found", message: "Cart item not found" },
          404
        );
      }
      if (cartItem.cart.customerId !== user.id) {
        return c.json(
          { error: "Forbidden", message: "You do not own this cart item" },
          403
        );
      }

      const parentCartId = cartItem.cartId;

      // --- Perform Deletion ---
      await db
        .delete(cartItemOptions)
        .where(eq(cartItemOptions.cartItemId, itemId));

      await db.delete(cartItems).where(eq(cartItems.id, itemId));

      // --- Check if Cart is Now Empty ---
      const remainingItems = await db.query.cartItems.findMany({
        where: eq(cartItems.cartId, parentCartId),
        columns: { id: true },
        limit: 1,
      });

      let finalCartState = null;

      if (remainingItems.length > 0) {
        // Cart still has items, fetch its updated state
        const fetchedCart = await db.query.cartTable.findFirst({
          where: eq(cartTable.id, parentCartId),
          with: {
            items: {
              with: {
                menuItem: {
                  columns: {
                    id: true,
                    name: true,
                    price: true,
                    image: true,
                  },
                },
                options: {
                  with: {
                    option: true,
                    optionGroup: true,
                  },
                },
              },
              columns: {
                id: true,
                quantity: true,
                specialInstructions: true,
                totalPrice: true,
              },
            },
            shop: {
              columns: {
                id: true,
                name: true,
                logo: true,
                slug: true,
                coverImage: true,
              },
            },
          },
          columns: {
            id: true,
          },
        });

        if (!fetchedCart) {
          console.error(
            "Failed to fetch cart after item removal for cart:",
            parentCartId
          );
          return c.json(
            {
              error: "Internal Server Error",
              message: "Failed to fetch updated cart state",
            },
            500
          );
        }

        if (!fetchedCart.shop) {
          console.error(
            `Cart ${fetchedCart.id} is missing shop data after item removal.`
          );
          return c.json(
            {
              error: "Internal Server Error",
              message: "Updated cart data is incomplete (missing shop)",
            },
            500
          );
        }

        // Fetch available options for remaining items
        const menuItemIds = fetchedCart.items
          .map((item) => item.menuItem?.id)
          .filter(Boolean);
        const availableOptionsMap = new Map();

        if (menuItemIds.length > 0) {
          for (const menuItemId of menuItemIds) {
            // Replace the menuItemOptionGroups query with direct table query
            const optionGroups = await db
              .select({
                menuItemId: menuItemOptionGroups.menuItemId,
                optionGroupId: menuItemOptionGroups.optionGroupId,
              })
              .from(menuItemOptionGroups)
              .where(eq(menuItemOptionGroups.menuItemId, menuItemId));

            const optionGroupIds = optionGroups.map((g) => g.optionGroupId);

            const availableOptions = [];

            for (const optionGroupId of optionGroupIds) {
              const optionGroup = await db.query.optionGroupTable.findFirst({
                where: eq(optionGroupTable.id, optionGroupId),
                columns: {
                  id: true,
                  name: true,
                  minSelections: true,
                  maxSelections: true,
                },
              });

              if (optionGroup) {
                const options =
                  await db.query.optionToOptionGroupTable.findMany({
                    where: eq(
                      optionToOptionGroupTable.optionGroupId,
                      optionGroupId
                    ),
                    with: {
                      option: {
                        columns: {
                          id: true,
                          name: true,
                          price: true,
                        },
                      },
                    },
                  });

                availableOptions.push({
                  ...optionGroup,
                  options: options.map((opt) => opt.option).filter(Boolean),
                });
              }
            }

            availableOptionsMap.set(menuItemId, availableOptions);
          }
        }

        // Map the final state
        finalCartState = {
          id: fetchedCart.id,
          shop: {
            id: fetchedCart.shop.id,
            name: fetchedCart.shop.name,
            slug: fetchedCart.shop.slug,
            logo: fetchedCart.shop.logo,
            coverImage: fetchedCart.shop.coverImage,
          },
          items: fetchedCart.items.map((item) => {
            if (!item.menuItem) {
              console.error(
                `Cart item ${item.id} in final state is missing menu item data.`
              );
              return {
                id: item.id,
                quantity: item.quantity,
                specialInstructions: item.specialInstructions,
                totalPrice: Number(item.totalPrice) || 0,
                menuItem: {
                  id: "unknown",
                  name: "Unknown Item",
                  price: 0,
                  image: null,
                },
                selectedOptions: [],
                availableOptionGroups: [],
              };
            }

            const selectedOptions = item.options
              .map(mapSelectedOption)
              .filter((opt): opt is NonNullable<typeof opt> => opt !== null);

            return {
              id: item.id,
              quantity: item.quantity,
              specialInstructions: item.specialInstructions,
              totalPrice: Number(item.totalPrice) || 0,
              menuItem: {
                id: item.menuItem.id,
                name: item.menuItem.name,
                price: Number(item.menuItem.price) || 0,
                image: item.menuItem.image,
              },
              selectedOptions,
              availableOptionGroups:
                availableOptionsMap.get(item.menuItem.id) || [],
            };
          }),
          ...calculateCartTotals(fetchedCart),
        };
      } else {
        // Cart is now empty, delete it
        await db.delete(cartTable).where(eq(cartTable.id, parentCartId));
      }

      return c.json({
        data: finalCartState,
        message: finalCartState
          ? "Item removed successfully."
          : "Item removed and cart is now empty.",
      });
    } catch (error: any) {
      console.error("Error removing item from cart:", error);
      return c.json(
        {
          error: "Internal server error",
          message: error?.message || "Failed to remove item from cart",
        },
        500
      );
    }
  })
  .delete("/:cartId", async (c) => {
    const db = c.get("db");
    const user = c.get("user");
    const { cartId } = c.req.param();

    if (!user) {
      return c.json(
        { error: "Unauthorized", message: "User not authenticated" },
        401
      );
    }

    try {
      // --- Check Ownership ---
      const cart = await db.query.cartTable.findFirst({
        where: and(eq(cartTable.id, cartId), eq(cartTable.customerId, user.id)),
        columns: { id: true }, // Only need ID to confirm existence and ownership
      });

      if (!cart) {
        return c.json(
          {
            error: "Not Found",
            message: "Cart not found or you do not own it",
          },
          404
        );
      }

      // --- Perform Deletion ---
      // Delete associated cart item options first (optional, depends on FK constraints)
      // Need to get item IDs associated with the cart
      const itemsToDelete = await db.query.cartItems.findMany({
        where: eq(cartItems.cartId, cartId),
        columns: { id: true },
      });
      const itemIdsToDelete = itemsToDelete.map((item) => item.id);

      if (itemIdsToDelete.length > 0) {
        await db
          .delete(cartItemOptions)
          .where(inArray(cartItemOptions.cartItemId, itemIdsToDelete));
        // Delete cart items
        await db.delete(cartItems).where(eq(cartItems.cartId, cartId));
      }

      // Delete the cart itself
      await db.delete(cartTable).where(eq(cartTable.id, cartId));

      return c.json({ data: null, message: "Cart cleared successfully." });
    } catch (error: any) {
      console.error("Error clearing cart:", error);
      return c.json(
        {
          error: "Internal server error",
          message: error?.message || "Failed to clear cart",
        },
        500
      );
    }
  });

export default cartRoute;
