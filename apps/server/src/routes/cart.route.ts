import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { Context } from "../lib/types";
import { z } from "zod";
import {
  cartTable,
  cartItems,
  cartItemOptions,
} from "../lib/db/schema/cart.schema";
import { eq, and, desc, sql, inArray } from "drizzle-orm";
import { menuItemTable } from "../lib/db/schema/menu.schema";
import { optionTable } from "../lib/db/schema/option.schema";
import { nanoid } from "nanoid";
import { factory } from "../lib/factory";
import {
  addCartItemSchema,
  updateCartItemSchema,
} from "../lib/validation/cart.validation";

const cartRoute = factory
  .createApp()
  // Get user's cart
  .get("/", async (c) => {
    try {
      const db = c.get("db");
      const user = c.get("user");

      if (!user) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      // Find active carts for the user
      const carts = await db.query.cartTable.findMany({
        where: and(
          eq(cartTable.customerId, user.id),
          eq(cartTable.status, "ACTIVE")
        ),
        with: {
          items: {
            with: {
              options: true,
              menuItem: true,
            },
          },
          shop: {
            columns: {
              id: true,
              name: true,
              logo: true,
              slug: true,
            },
          },
        },
      });

      if (!carts || carts.length === 0) {
        // Return empty cart if none exists
        return c.json({
          data: [],
        });
      }

      // Process carts with calculated totals
      const processedCarts = carts.map((cart) => {
        let totalItems = 0;
        let subtotal = 0;

        (cart.items || []).forEach((item) => {
          totalItems += item.quantity;
          subtotal += item.totalPrice;
        });

        return {
          ...cart,
          totalItems,
          subtotal,
        };
      });

      return c.json({
        data: processedCarts,
      });
    } catch (error) {
      console.error("Error fetching cart:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  })
  // get cart by shopId
  .get("/shop/:shopId", async (c) => {
    try {
      const db = c.get("db");
      const user = c.get("user");
      const { shopId } = c.req.param();

      if (!user) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      // Find active cart for the user and shop
      const cart = await db.query.cartTable.findFirst({
        where: and(
          eq(cartTable.customerId, user.id),
          eq(cartTable.shopId, shopId),
          eq(cartTable.status, "ACTIVE")
        ),
        with: {
          items: {
            with: {
              options: true,
              menuItem: true,
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
      });

      if (!cart) {
        // return 404, no cart found
        return c.json({ message: "Cart not found" }, 404);
      }

      // Calculate totals
      let totalItems = 0;
      let subtotal = 0;

      (cart.items || []).forEach((item) => {
        totalItems += item.quantity;
        subtotal += item.totalPrice;
      });

      return c.json({
        data: {
          ...cart,
          totalItems,
          subtotal,
        },
      });
    } catch (error) {
      console.error("Error fetching cart by restaurant:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  })

  // Add item to cart
  .post("/", zValidator("json", addCartItemSchema), async (c) => {
    try {
      const data = c.req.valid("json");
      const db = c.get("db");
      const user = c.get("user");

      if (!user) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      // Get the menu item to validate it exists and get restaurant ID
      const menuItem = await db.query.menuItemTable.findFirst({
        where: eq(menuItemTable.id, data.menuItemId),
      });

      if (!menuItem) {
        return c.json({ error: "Menu item not found" }, 404);
      }

      // Check if user has an active cart for THIS restaurant
      let cart = await db.query.cartTable.findFirst({
        where: and(
          eq(cartTable.customerId, user.id),
          eq(cartTable.shopId, menuItem.shopId),
          eq(cartTable.status, "active")
        ),
      });

      // Initialize base price from menu item
      let totalPrice = menuItem.price * data.quantity;
      const cartItemId = nanoid();

      // Create a new cart for this restaurant if needed
      if (!cart) {
        const newCart = await db
          .insert(cartTable)
          .values({
            shopId: menuItem.shopId,
            customerId: user.id,
            status: "ACTIVE",
          })
          .returning()
          .get();

        if (!newCart) {
          return c.json({ error: "Failed to create cart" }, 500);
        }

        cart = newCart;
      }

      // Create the cart item first
      await db.insert(cartItems).values({
        id: cartItemId,
        cartId: cart.id,
        menuItemId: data.menuItemId,
        quantity: data.quantity,
        specialInstructions: data.specialInstructions || null,
        totalPrice: totalPrice,
      });

      // Process options if provided
      if (data.options && data.options.length > 0) {
        // Get all option data in a single query
        const optionIds = data.options.map((opt) => opt.optionId);
        const optionsData = await db.query.optionTable.findMany({
          where: inArray(optionTable.id, optionIds),
        });

        // Prepare option entries for batch insert
        const optionEntries = [];
        let optionsPrice = 0;

        for (const option of data.options) {
          const optionData = optionsData.find(
            (opt) => opt.id === option.optionId
          );

          if (optionData) {
            const optionPrice = optionData.price * option.quantity;
            optionsPrice += optionPrice;

            optionEntries.push({
              id: nanoid(),
              cartItemId: cartItemId,
              optionId: option.optionId,
              optionGroupId: option.optionGroupId,
              quantity: option.quantity,
              price: optionData.price,
            });
          }
        }

        // Update total price with options
        totalPrice += optionsPrice;

        // Batch insert all options
        if (optionEntries.length > 0) {
          await db.insert(cartItemOptions).values(optionEntries);
        }

        // Update cart item with final price
        await db
          .update(cartItems)
          .set({ totalPrice })
          .where(eq(cartItems.id, cartItemId));
      }

      // Return the updated cart with full information
      const updatedCart = await db.query.cartTable.findFirst({
        where: eq(cartTable.id, cart.id),
        with: {
          items: {
            with: {
              options: true,
              menuItem: true,
            },
          },
          shop: {
            columns: {
              id: true,
              name: true,
              logo: true,
            },
          },
        },
      });

      if (!updatedCart) {
        return c.json({ error: "Cart not found" }, 404);
      }

      // Calculate totals
      let totalItems = 0;
      let subtotal = 0;

      (updatedCart.items || []).forEach((item) => {
        totalItems += item.quantity;
        subtotal += item.totalPrice;
      });

      return c.json({
        data: {
          ...updatedCart,
          totalItems,
          subtotal,
        },
      });
    } catch (error) {
      console.error("Error adding item to cart:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  })

  // Update cart item quantity
  .patch(
    "/items/:itemId",
    zValidator("json", updateCartItemSchema),
    async (c) => {
      try {
        const { itemId } = c.req.param();
        const { quantity } = c.req.valid("json");
        const db = c.get("db");
        const user = c.get("user");

        if (!user) {
          return c.json({ error: "Unauthorized" }, 401);
        }

        // Get cart item and verify ownership
        const cartItem = await db.query.cartItems.findFirst({
          where: eq(cartItems.id, itemId),
          with: {
            cart: true,
            menuItem: true,
            options: true,
          },
        });

        if (
          !cartItem ||
          !cartItem.cart ||
          cartItem.cart.customerId !== user.id
        ) {
          return c.json({ error: "Cart item not found" }, 404);
        }

        if (!cartItem.menuItem) {
          return c.json(
            { error: "Menu item not found for this cart item" },
            404
          );
        }

        // Calculate new total price
        let basePrice = cartItem.menuItem.price;
        let optionsPrice = 0;

        // Safely handle options array which might be undefined
        (cartItem.options || []).forEach((option) => {
          optionsPrice += option.price * option.quantity;
        });

        const newTotalPrice = (basePrice + optionsPrice) * quantity;

        // Update the cart item
        await db
          .update(cartItems)
          .set({
            quantity,
            totalPrice: newTotalPrice,
          })
          .where(eq(cartItems.id, itemId));

        // Return the updated cart
        const updatedCart = await db.query.cartTable.findFirst({
          where: eq(cartTable.id, cartItem.cartId),
          with: {
            items: {
              with: {
                options: true,
                menuItem: true,
              },
            },
            shop: {
              columns: {
                id: true,
                name: true,
                logo: true,
              },
            },
          },
        });

        // Handle potentially null updatedCart
        if (!updatedCart) {
          return c.json({ error: "Cart not found after update" }, 404);
        }

        // Calculate totals
        let totalItems = 0;
        let subtotal = 0;

        // Safely handle items array which might be undefined
        (updatedCart.items || []).forEach((item) => {
          totalItems += item.quantity;
          subtotal += item.totalPrice;
        });

        return c.json({
          data: {
            ...updatedCart,
            totalItems,
            subtotal,
          },
        });
      } catch (error) {
        console.error("Error updating cart item:", error);
        return c.json({ error: "Internal server error" }, 500);
      }
    }
  )

  // Remove item from cart
  .delete("/items/:itemId", async (c) => {
    try {
      const { itemId } = c.req.param();
      const db = c.get("db");
      const user = c.get("user");

      if (!user) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      // Get cart item and verify ownership
      const cartItem = await db.query.cartItems.findFirst({
        where: eq(cartItems.id, itemId),
        with: {
          cart: true,
        },
      });

      if (!cartItem || !cartItem.cart || cartItem.cart.customerId !== user.id) {
        return c.json({ error: "Cart item not found" }, 404);
      }

      // Save the cartId for later check
      const cartId = cartItem.cartId;

      // Delete the cart item options first
      await db
        .delete(cartItemOptions)
        .where(eq(cartItemOptions.cartItemId, itemId));

      // Delete the cart item
      await db.delete(cartItems).where(eq(cartItems.id, itemId));

      // Check if cart is now empty
      const remainingItems = await db.query.cartItems.findMany({
        where: eq(cartItems.cartId, cartId),
      });

      // If no items remain, completely delete the cart instead of marking it abandoned
      if (remainingItems.length === 0) {
        await db.delete(cartTable).where(eq(cartTable.id, cartId));

        // Return empty cart response when cart is deleted
        return c.json({
          data: {
            items: [],
            restaurantId: null,
            restaurant: null,
            totalItems: 0,
            subtotal: 0,
          },
        });
      } else {
        // Return the updated cart with remaining items
        const updatedCart = await db.query.cartTable.findFirst({
          where: eq(cartTable.id, cartId),
          with: {
            items: {
              with: {
                options: true,
                menuItem: true,
              },
            },
            shop: {
              columns: {
                id: true,
                name: true,
                logo: true,
                slug: true,
              },
            },
          },
        });

        // Handle potentially null updatedCart
        if (!updatedCart) {
          return c.json({ error: "Cart not found after item removal" }, 404);
        }

        // Calculate totals
        let totalItems = 0;
        let subtotal = 0;

        // Safely handle items array which might be undefined
        (updatedCart.items || []).forEach((item) => {
          totalItems += item.quantity;
          subtotal += item.totalPrice;
        });

        return c.json({
          data: {
            ...updatedCart,
            totalItems,
            subtotal,
          },
        });
      }
    } catch (error) {
      console.error("Error removing cart item:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  })

  // Clear cart - Modified to completely delete cart instead of marking as abandoned
  .delete("/:cartId", async (c) => {
    try {
      const db = c.get("db");
      const user = c.get("user");
      const { cartId } = c.req.param();

      if (!user) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      // If cartId is provided, clear only that specific cart
      if (cartId) {
        const cart = await db.query.cartTable.findFirst({
          where: and(
            eq(cartTable.id, cartId),
            eq(cartTable.customerId, user.id),
            eq(cartTable.status, "active")
          ),
        });

        if (cart) {
          // Get cart items to delete options first
          const cartItemsList = await db.query.cartItems.findMany({
            where: eq(cartItems.cartId, cart.id),
          });

          // Delete all cart item options
          for (const item of cartItemsList) {
            await db
              .delete(cartItemOptions)
              .where(eq(cartItemOptions.cartItemId, item.id));
          }

          // Delete all cart items
          await db.delete(cartItems).where(eq(cartItems.cartId, cart.id));

          // Completely delete cart instead of marking as abandoned
          await db.delete(cartTable).where(eq(cartTable.id, cart.id));
        }

        return c.json({
          data: {
            items: [],
            restaurantId: null,
            restaurant: null,
            totalItems: 0,
            subtotal: 0,
          },
        });
      } else {
        // If no cartId provided, clear all active carts for this user
        const carts = await db.query.cartTable.findMany({
          where: and(
            eq(cartTable.customerId, user.id),
            eq(cartTable.status, "active")
          ),
        });

        for (const cart of carts) {
          // Get cart items to delete options first
          const cartItemsList = await db.query.cartItems.findMany({
            where: eq(cartItems.cartId, cart.id),
          });

          // Delete all cart item options
          for (const item of cartItemsList) {
            await db
              .delete(cartItemOptions)
              .where(eq(cartItemOptions.cartItemId, item.id));
          }

          // Delete all cart items
          await db.delete(cartItems).where(eq(cartItems.cartId, cart.id));

          // Completely delete cart instead of marking as abandoned
          await db.delete(cartTable).where(eq(cartTable.id, cart.id));
        }

        return c.json({
          data: {
            items: [],
            restaurantId: null,
            restaurant: null,
            totalItems: 0,
            subtotal: 0,
          },
        });
      }
    } catch (error) {
      console.error("Error clearing cart:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  });

export default cartRoute;
