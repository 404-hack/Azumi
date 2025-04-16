import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
// Assuming Context is defined in ../lib/types and includes db/user properties
// import { Context } from "../lib/types";
import { z } from "zod";
import {
  cartTable,
  cartItems,
  cartItemOptions,
} from "../lib/db/schema/cart.schema";
// Import necessary schemas for types if needed elsewhere
// import { shopTable } from "../lib/db/schema/shop.schema"; // Assuming shopTable is imported if needed
// import { optionGroupTable } from "../lib/db/schema/option.schema"; // Assuming this exists and is imported if needed
import { eq, and, desc, inArray } from "drizzle-orm";
// import { BatchItem } from "drizzle-orm/sqlite-core"; // Correct import path for BatchItem
import { menuItemTable } from "../lib/db/schema/menu.schema";
import { optionTable } from "../lib/db/schema/option.schema";
import { nanoid } from "nanoid";
import { factory } from "../lib/factory"; // Assuming factory provides typed context 'c'
import {
  addCartItemSchema,
  updateCartItemSchema,
} from "../lib/validation/cart.validation";

// Helper function to calculate totals - Rely on inferred types
const calculateCartTotals = (cart: any | null) => {
  // Use 'any' or let TS infer; null check remains
  let totalItems = 0;
  let subtotal = 0;
  (cart?.items || []).forEach((item: any) => {
    // Use 'any' or let TS infer
    totalItems += item.quantity;
    // Use nullish coalescing for safety if totalPrice might be missing/null
    const itemSubtotal = item.totalPrice ?? 0;
    subtotal += itemSubtotal;
  });
  return { totalItems, subtotal };
};

const cartRoute = factory
  .createApp()
  // Get user's cart
  .get("/", async (c) => {
    try {
      const db = c.get("db");
      const user = c.get("user");

      if (!user) {
        // Use c.json for error response
        return c.json(
          { error: "Unauthorized", message: "User not authenticated" },
          401
        );
      }

      // Removed type assertion
      const carts = await db.query.cartTable.findMany({
        where: and(
          eq(cartTable.customerId, user.id),
          eq(cartTable.status, "ACTIVE")
        ),
        with: {
          items: {
            with: {
              options: {
                with: {
                  option: { columns: { id: true, name: true, price: true } },
                  // Assuming optionGroupTable is imported and correct
                  optionGroup: { columns: { id: true, name: true } },
                },
              },
              menuItem: {
                columns: { id: true, name: true, price: true, image: true },
              },
            },
            orderBy: (items, { desc }) => [desc(items.createdAt)],
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
        orderBy: (carts, { desc }) => [desc(carts.createdAt)],
      });

      if (carts.length === 0) {
        return c.json({ data: [] });
      }

      const processedCarts = carts.map((cart) => {
        const totals = calculateCartTotals(cart);
        return {
          ...cart,
          totalItems: totals.totalItems,
          subtotal: totals.subtotal,
        };
      });

      return c.json({
        data: processedCarts,
      });
    } catch (error: any) {
      console.error("Error fetching cart:", error);
      // Use c.json for error response
      return c.json(
        {
          error: "Internal server error",
          message: error?.message || "Failed to fetch cart",
        },
        500
      );
    }
  })
  // get cart by shopId
  .get("/shop/:shopId", async (c) => {
    try {
      const db = c.get("db");
      const user = c.get("user");
      const { shopId } = c.req.param();

      if (!user) {
        // Use c.json for error response
        return c.json(
          { error: "Unauthorized", message: "User not authenticated" },
          401
        );
      }
      if (!shopId) {
        // Use c.json for error response
        return c.json(
          { error: "Bad Request", message: "Shop ID is required" },
          400
        );
      }

      // Removed type assertion
      const cart = await db.query.cartTable.findFirst({
        where: and(
          eq(cartTable.customerId, user.id),
          eq(cartTable.shopId, shopId),
          eq(cartTable.status, "ACTIVE")
        ),
        with: {
          items: {
            with: {
              options: {
                with: {
                  option: { columns: { id: true, name: true, price: true } },
                  optionGroup: { columns: { id: true, name: true } },
                },
              },
              menuItem: {
                columns: { id: true, name: true, price: true, image: true },
              },
            },
            orderBy: (items, { desc }) => [desc(items.createdAt)],
          },
          shop: {
            columns: {
              id: true,
              name: true,
              logo: true,
              slug: true,
              coverImage: true, // Assuming coverImage exists in shopTable schema
            },
          },
        },
      });

      if (!cart) {
        return c.json(
          { data: null, message: "No active cart found for this shop." },
          404
        ); // Use 404 for not found
      }

      const { totalItems, subtotal } = calculateCartTotals(cart);

      return c.json({
        data: {
          ...cart,
          totalItems,
          subtotal,
        },
      });
    } catch (error: any) {
      console.error("Error fetching cart by shop:", error);
      // Use c.json for error response
      return c.json(
        {
          error: "Internal server error",
          message: error?.message || "Failed to fetch cart for shop",
        },
        500
      );
    }
  })

  // Add item to cart - Refactored to avoid db.batch()
  .post("/", zValidator("json", addCartItemSchema), async (c) => {
    const db = c.get("db");
    const user = c.get("user");

    if (!user) {
      // Use c.json for error response
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
        // Use c.json for error response
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
      }

      // Check for existing item
      const existingCartItem = await db.query.cartItems.findFirst({
        where: and(
          eq(cartItems.cartId, cartId),
          eq(cartItems.menuItemId, data.menuItemId)
          // Add other conditions for uniqueness if needed (e.g., options hash)
        ),
        columns: { id: true, quantity: true, totalPrice: true },
      });

      // Calculate prices
      const menuItemPrice = Number(menuItem.price) || 0;
      let baseItemPriceComponent = menuItemPrice * data.quantity;
      let optionsPriceComponent = 0;
      let selectedOptionDetails: Array<{
        optionId: string;
        optionGroupId: string | null;
        quantity: number;
        price: number;
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
            const optionQuantity = reqOption.quantity || 1;
            optionsPriceComponent += optionPrice * optionQuantity;
            selectedOptionDetails.push({
              optionId: dbOption.id,
              optionGroupId: reqOption.optionGroupId, // From request
              quantity: optionQuantity,
              price: optionPrice, // Price at time of adding
            });
          }
        }
      }

      // --- Perform Database Operations Sequentially ---
      let finalCartItemId: string;

      if (existingCartItem) {
        finalCartItemId = existingCartItem.id;
        const finalQuantity = existingCartItem.quantity + data.quantity;
        const currentTotalPrice = Number(existingCartItem.totalPrice) || 0;
        const updatedTotalPrice =
          currentTotalPrice + baseItemPriceComponent + optionsPriceComponent;

        // Update existing item
        await db
          .update(cartItems)
          .set({
            quantity: finalQuantity,
            totalPrice: updatedTotalPrice,
          })
          .where(eq(cartItems.id, existingCartItem.id));

        // Insert new options for the updated item
        if (selectedOptionDetails.length > 0) {
          await db.insert(cartItemOptions).values(
            selectedOptionDetails.map((opt) => ({
              ...opt,
              cartItemId: finalCartItemId,
              id: nanoid(),
            }))
          );
        }
      } else {
        finalCartItemId = nanoid();
        const totalItemPrice = baseItemPriceComponent + optionsPriceComponent;

        // Insert new cart item
        await db.insert(cartItems).values({
          id: finalCartItemId,
          cartId: cartId,
          menuItemId: data.menuItemId,
          quantity: data.quantity,
          specialInstructions: data.specialInstructions,
          totalPrice: totalItemPrice,
        });

        // Insert options for the new item
        if (selectedOptionDetails.length > 0) {
          await db.insert(cartItemOptions).values(
            selectedOptionDetails.map((opt) => ({
              ...opt,
              cartItemId: finalCartItemId,
              id: nanoid(),
            }))
          );
        }
      }

      // --- Fetch Final State ---
      const finalCartState = await db.query.cartTable.findFirst({
        where: eq(cartTable.id, cartId),
        with: {
          items: {
            with: {
              options: { with: { option: true, optionGroup: true } },
              menuItem: true,
            },
            orderBy: (items, { desc }) => [desc(items.createdAt)],
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

      if (!finalCartState) {
        console.error(
          "Failed to fetch final cart state after update for cart:",
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

      const { totalItems, subtotal } = calculateCartTotals(finalCartState);

      return c.json({
        data: {
          ...finalCartState,
          totalItems,
          subtotal,
        },
      });
    } catch (error: any) {
      console.error("Error adding item to cart:", error);
      // Use c.json for error response
      return c.json(
        {
          error: "Internal server error",
          message: error?.message || "Failed to add item to cart",
        },
        500
      );
    }
  })

  // Update cart item quantity - Refactored to avoid db.batch()
  .patch(
    "/items/:itemId",
    zValidator("json", updateCartItemSchema),
    async (c) => {
      const db = c.get("db");
      const user = c.get("user");
      const { itemId } = c.req.param();

      if (!user) {
        // Use c.json for error response
        return c.json(
          { error: "Unauthorized", message: "User not authenticated" },
          401
        );
      }

      try {
        const { quantity } = c.req.valid("json");

        if (quantity <= 0) {
          // Use c.json for error response
          return c.json(
            {
              error: "Bad Request",
              message: "Quantity must be positive. Use DELETE to remove items.",
            },
            400
          );
        }

        // --- Pre-computation and Checks ---
        const cartItem = await db.query.cartItems.findFirst({
          where: eq(cartItems.id, itemId),
          with: {
            cart: { columns: { customerId: true, id: true } },
            menuItem: { columns: { price: true } },
            options: { columns: { quantity: true, price: true } },
          },
        });

        if (!cartItem || !cartItem.cart) {
          // Use c.json for error response
          return c.json(
            {
              error: "Not Found",
              message: "Cart item or associated cart not found",
            },
            404
          );
        }
        if (cartItem.cart.customerId !== user.id) {
          // Use c.json for error response
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
        if (!cartItem.cart.id) {
          console.error(
            "Cart ID missing from cart item relation for item:",
            itemId
          );
          return c.json(
            {
              error: "Internal Server Error",
              message: "Cart ID missing from cart item relation",
            },
            500
          );
        }

        const parentCartId = cartItem.cart.id;
        const basePrice = Number(cartItem.menuItem.price) || 0;
        let optionsPricePerUnit = 0;
        (cartItem.options || []).forEach((optInstance) => {
          const price = Number(optInstance.price) || 0;
          const qty = Number(optInstance.quantity) || 0;
          optionsPricePerUnit += price * qty;
        });

        const pricePerUnit = basePrice + optionsPricePerUnit;
        const newTotalPrice = pricePerUnit * quantity;

        // --- Perform Update Operation ---
        await db
          .update(cartItems)
          .set({
            quantity: quantity,
            totalPrice: newTotalPrice,
          })
          .where(eq(cartItems.id, itemId));

        // --- Fetch Final State ---
        const finalCartState = await db.query.cartTable.findFirst({
          where: eq(cartTable.id, parentCartId),
          with: {
            items: {
              with: {
                options: { with: { option: true, optionGroup: true } },
                menuItem: true,
              },
              orderBy: (items, { desc }) => [desc(items.createdAt)],
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

        const finalTotals = calculateCartTotals(finalCartState);

        return c.json({
          data: {
            ...finalCartState,
            totalItems: finalTotals.totalItems,
            subtotal: finalTotals.subtotal,
          },
        });
      } catch (error: any) {
        console.error("Error updating cart item:", error);
        // Use c.json for error response
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

  // Remove item from cart - Refactored to avoid db.batch()
  .delete("/items/:itemId", async (c) => {
    const db = c.get("db");
    const user = c.get("user");
    const { itemId } = c.req.param();

    if (!user) {
      // Use c.json for error response
      return c.json(
        { error: "Unauthorized", message: "User not authenticated" },
        401
      );
    }

    try {
      // --- Pre-computation and Checks ---
      const cartItem = await db.query.cartItems.findFirst({
        where: eq(cartItems.id, itemId),
        columns: { id: true, cartId: true },
        with: {
          cart: { columns: { customerId: true } },
        },
      });

      if (!cartItem || !cartItem.cart) {
        // Use c.json for error response
        return c.json(
          {
            error: "Not Found",
            message: "Cart item or associated cart not found",
          },
          404
        );
      }
      if (cartItem.cart.customerId !== user.id) {
        // Use c.json for error response
        return c.json(
          { error: "Forbidden", message: "You do not own this cart item" },
          403
        );
      }
      if (!cartItem.cartId) {
        console.error("Cart ID missing from cart item:", itemId);
        return c.json(
          {
            error: "Internal Server Error",
            message: "Cart ID missing from cart item",
          },
          500
        );
      }
      const parentCartId = cartItem.cartId;

      // --- Perform Deletion Operations Sequentially ---
      // Delete associated options first
      await db
        .delete(cartItemOptions)
        .where(eq(cartItemOptions.cartItemId, itemId));
      // Then delete the item itself
      await db.delete(cartItems).where(eq(cartItems.id, itemId));

      // --- Post-Deletion Check and Potential Cart Deletion ---
      const remainingItems = await db.query.cartItems.findMany({
        where: eq(cartItems.cartId, parentCartId),
        columns: { id: true },
        limit: 1,
      });

      let finalCartState: any | null = null; // Use any or let TS infer

      if (remainingItems.length === 0) {
        // Cart is empty, delete the cart itself
        await db.delete(cartTable).where(eq(cartTable.id, parentCartId));
        finalCartState = null; // Indicate cart was deleted
      } else {
        // Cart still has items, fetch its updated state
        const fetchedCart = await db.query.cartTable.findFirst({
          where: eq(cartTable.id, parentCartId),
          with: {
            items: {
              with: {
                options: { with: { option: true, optionGroup: true } },
                menuItem: true,
              },
              orderBy: (items, { desc }) => [desc(items.createdAt)],
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
        if (!fetchedCart) {
          console.error(
            `Failed to fetch cart ${parentCartId} after item removal, but items should remain.`
          );
          return c.json(
            {
              error: "Internal Server Error",
              message: "Failed to fetch updated cart state after item removal",
            },
            500
          );
        }
        finalCartState = fetchedCart;
      }

      // --- Return Response ---
      if (finalCartState) {
        const finalTotals = calculateCartTotals(finalCartState);
        return c.json({
          data: {
            ...finalCartState,
            totalItems: finalTotals.totalItems,
            subtotal: finalTotals.subtotal,
          },
        });
      } else {
        return c.json({
          data: null,
          message: "Item removed and cart is now empty.",
        });
      }
    } catch (error: any) {
      console.error("Error removing item from cart:", error);
      // Use c.json for error response
      return c.json(
        {
          error: "Internal server error",
          message: error?.message || "Failed to remove item from cart",
        },
        500
      );
    }
  })

  // Clear cart (specific or all active) - Refactored to avoid db.batch()
  .delete("/:cartId?", async (c) => {
    const db = c.get("db");
    const user = c.get("user");
    const { cartId } = c.req.param();

    if (!user) {
      // Use c.json for error response
      return c.json(
        { error: "Unauthorized", message: "User not authenticated" },
        401
      );
    }

    try {
      if (cartId) {
        // --- Clear Specific Cart ---
        const cart = await db.query.cartTable.findFirst({
          where: and(
            eq(cartTable.id, cartId),
            eq(cartTable.customerId, user.id)
          ),
          columns: { id: true },
          with: {
            items: { columns: { id: true } },
          },
        });

        if (!cart) {
          // Use c.json for error response
          return c.json(
            { error: "Not Found", message: "Cart not found or access denied" },
            404
          );
        }

        const itemIds = cart.items.map((item) => item.id);

        // Perform Deletions Sequentially
        if (itemIds.length > 0) {
          // Delete options first
          await db
            .delete(cartItemOptions)
            .where(inArray(cartItemOptions.cartItemId, itemIds));
          // Then delete items
          await db.delete(cartItems).where(eq(cartItems.cartId, cartId));
        }
        // Finally, delete the cart
        await db.delete(cartTable).where(eq(cartTable.id, cartId));

        return c.json({ data: null, message: "Cart cleared successfully." });
      } else {
        // --- Clear ALL User Carts ---
        const userCarts = await db.query.cartTable.findMany({
          where: eq(cartTable.customerId, user.id),
          columns: { id: true },
          with: {
            items: { columns: { id: true } },
          },
        });

        if (userCarts.length === 0) {
          return c.json({
            data: null,
            message: "No carts found for this user.",
          });
        }

        // Perform Deletions Sequentially for each cart
        for (const cart of userCarts) {
          const itemIds = cart.items.map((item) => item.id);
          if (itemIds.length > 0) {
            // Delete options first
            await db
              .delete(cartItemOptions)
              .where(inArray(cartItemOptions.cartItemId, itemIds));
            // Then delete items
            await db.delete(cartItems).where(eq(cartItems.cartId, cart.id));
          }
          // Finally, delete the cart
          await db.delete(cartTable).where(eq(cartTable.id, cart.id));
        }

        return c.json({
          data: null,
          message: "All user carts cleared successfully.",
        });
      }
    } catch (error: any) {
      console.error(`Error clearing cart(s) ${cartId || "(all user)"}:`, error);
      // Use c.json for error response
      return c.json(
        {
          error: "Internal server error",
          message: error?.message || "Failed to clear cart(s)",
        },
        500
      );
    }
  });

export default cartRoute;
