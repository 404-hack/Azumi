import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { userTable } from "./auth.schema";
import { shopTable } from "./shop.schema";
import { timestamps } from "./utils.schema";
import { menuItemTable } from "./menu.schema";
import { optionGroupTable, optionTable } from "./option.schema";
import { nanoid } from "nanoid";
import { relations } from "drizzle-orm";
import { orderTable } from "./order.schema";

export const cartTable = sqliteTable("carts", {
  id: text("id")
    .primaryKey()
    .notNull()
    .$default(() => nanoid()),
  customerId: text("customer_id").references(() => userTable.id, {
    onDelete: "cascade",
  }),
  shopId: text("shop_id")
    .references(() => shopTable.id)
    .notNull(), // Only one shop per cart
  status: text("status", {
    enum: ["ACTIVE", "ABANDONED", "CONVERTED", "PENDING_PAYMENT"],
  }).default("ACTIVE"),
  ...timestamps,
});

export const cartItems = sqliteTable("cart_items", {
  id: text("id")
    .primaryKey()
    .notNull()
    .$default(() => nanoid()),
  cartId: text("cart_id").references(() => cartTable.id, {
    onDelete: "cascade",
  }),
  menuItemId: text("menu_item_id").references(() => menuItemTable.id, {
    onDelete: "cascade",
  }),
  quantity: integer("quantity").notNull().default(1),
  specialInstructions: text("special_instructions"),
  totalPrice: integer("total_price").notNull(), // Calculated price including options
  ...timestamps,
});

export const cartItemOptions = sqliteTable("cart_item_options", {
  id: text("id")
    .primaryKey()
    .notNull()
    .$default(() => nanoid()),
  cartItemId: text("cart_item_id").references(() => cartItems.id, {
    onDelete: "cascade",
  }),
  optionId: text("option_id").references(() => optionTable.id, {
    onDelete: "cascade",
  }),
  optionGroupId: text("option_group_id").references(() => optionGroupTable.id, {
    onDelete: "cascade",
  }),
  quantity: integer("quantity").default(1),
  price: integer("price").notNull(), // Price at the time of selection
});

// Define relations for cart
export const cartRelations = relations(cartTable, ({ many, one }) => ({
  items: many(cartItems),
  shop: one(shopTable, {
    fields: [cartTable.shopId],
    references: [shopTable.id],
  }),
  customer: one(userTable, {
    fields: [cartTable.customerId],
    references: [userTable.id],
  }),
  order: one(orderTable, {
    fields: [cartTable.id],
    references: [orderTable.cartId],
  }),
}));

// Define relations for cart items
export const cartItemsRelations = relations(cartItems, ({ many, one }) => ({
  cart: one(cartTable, {
    fields: [cartItems.cartId],
    references: [cartTable.id],
  }),
  menuItem: one(menuItemTable, {
    fields: [cartItems.menuItemId],
    references: [menuItemTable.id],
  }),
  options: many(cartItemOptions),
}));

// Define relations for cart item options
export const cartItemOptionsRelations = relations(
  cartItemOptions,
  ({ one }) => ({
    cartItem: one(cartItems, {
      fields: [cartItemOptions.cartItemId],
      references: [cartItems.id],
    }),
    option: one(optionTable, {
      fields: [cartItemOptions.optionId],
      references: [optionTable.id],
    }),
    optionGroup: one(optionGroupTable, {
      fields: [cartItemOptions.optionGroupId],
      references: [optionGroupTable.id],
    }),
  })
);
