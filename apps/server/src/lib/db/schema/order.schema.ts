import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { nanoid } from "nanoid";
import { timestamps } from "./utils.schema";
import { userTable } from "./auth.schema";
import { ORDER_STATUS, PAYMENT_STATUS, PAYMENT_METHODS } from "../../constant";
import { menuItemTable } from "./menu.schema";
import { relations } from "drizzle-orm";
import { shopTable } from "./shop.schema";
import { addressesTable } from "./address.schema";
import { cartTable, cartItems, cartItemOptions } from "./cart.schema";
import { optionTable, optionGroupTable } from "./option.schema";

export const orderTable = sqliteTable("order", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  code: text("code").notNull(),
  customerId: text("customer_id").references(() => userTable.id),
  shopId: text()
    .references(() => shopTable.id)
    .notNull(),
  riderId: text("rider_id").references(() => userTable.id),
  status: text("status", { enum: ORDER_STATUS }).notNull(),
  cartId: text("cart_id")
    .references(() => cartTable.id)
    .notNull(), // Required cart reference

  // Delivery information
  deliveryAddressId: text("delivery_address_id").references(
    () => addressesTable.id
  ),
  deliveryNotes: text("delivery_notes"),
  vendorNotes: text("vendor_notes"),
  contactPhone: text("contact_phone"),

  // Payment information
  paymentMethod: text("payment_method", { enum: PAYMENT_METHODS })
    .notNull()
    .default("CARD"),
  paymentStatus: text("payment_status", { enum: PAYMENT_STATUS }).notNull(),
  paymentTransactionId: text("payment_transaction_id"),

  // Pricing
  subtotal: real("subtotal").notNull(),
  deliveryFee: real("delivery_fee").default(0),
  serviceFee: real("service_fee").default(0),
  discount: real("discount").default(0),
  total: real("total").notNull(),

  // Timestamps for order progress
  acceptedAt: text("accepted_at"),
  preparedAt: text("prepared_at"),
  pickedUpAt: text("picked_up_at"),
  deliveredAt: text("delivered_at"),
  canceledAt: text("canceled_at"),
  cancelReason: text("cancel_reason"),

  // Refund information
  refundAmount: real("refund_amount").default(0),
  refundReason: text("refund_reason"),

  ...timestamps,
});

export const orderItemTable = sqliteTable("orderItem", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  orderId: text("order_id")
    .notNull()
    .references(() => orderTable.id, {
      onDelete: "cascade",
    }),
  menuItemId: text("menu_item_id").references(() => menuItemTable.id),
  menuItemName: text("menu_item_name").notNull(), // Snapshot of name at time of order
  quantity: integer("quantity").notNull(),
  unitPrice: real("unit_price").notNull(),
  totalPrice: real("total_price").notNull(),
  specialInstructions: text("special_instructions"),

  ...timestamps,
});

// Table for order item options (to preserve option choices)
export const orderItemOptionTable = sqliteTable("orderItemOption", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  orderItemId: text("order_item_id")
    .notNull()
    .references(() => orderItemTable.id, {
      onDelete: "cascade",
    }),
  optionId: text("option_id").references(() => optionTable.id),
  optionGroupId: text("option_group_id").references(() => optionGroupTable.id),
  optionName: text("option_name").notNull(), // Snapshot of option name
  quantity: integer("quantity").default(1),
  price: real("price").notNull(), // Price at time of order

  ...timestamps,
});

// Order relations
export const orderRelations = relations(orderTable, ({ one, many }) => ({
  customer: one(userTable, {
    fields: [orderTable.customerId],
    references: [userTable.id],
  }),
  rider: one(userTable, {
    fields: [orderTable.riderId],
    references: [userTable.id],
  }),
  shop: one(shopTable, {
    fields: [orderTable.shopId],
    references: [shopTable.id],
  }),
  cart: one(cartTable, {
    fields: [orderTable.cartId],
    references: [cartTable.id],
  }),
  items: many(orderItemTable),
}));

// Order item relations
export const orderItemRelations = relations(
  orderItemTable,
  ({ one, many }) => ({
    order: one(orderTable, {
      fields: [orderItemTable.orderId],
      references: [orderTable.id],
    }),
    menuItem: one(menuItemTable, {
      fields: [orderItemTable.menuItemId],
      references: [menuItemTable.id],
    }),
    options: many(orderItemOptionTable),
  })
);

// Order item option relations
export const orderItemOptionRelations = relations(
  orderItemOptionTable,
  ({ one }) => ({
    orderItem: one(orderItemTable, {
      fields: [orderItemOptionTable.orderItemId],
      references: [orderItemTable.id],
    }),
    option: one(optionTable, {
      fields: [orderItemOptionTable.optionId],
      references: [optionTable.id],
    }),
    optionGroup: one(optionGroupTable, {
      fields: [orderItemOptionTable.optionGroupId],
      references: [optionGroupTable.id],
    }),
  })
);
