import {
  pgTable,
  text,
  integer,
  doublePrecision,
  boolean,
} from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";
import { timestamps } from "./utils.schema";
import { userTable } from "./auth.schema";
import {
  ORDER_STATUS,
  PAYMENT_STATUS,
  PAYMENT_METHODS,
  REFUND_STATUS,
} from "../../constant";
import { menuItemTable } from "./menu.schema";
import { relations } from "drizzle-orm";
import { shopTable } from "./shop.schema";
import { addressesTable } from "./address.schema";
import { cartTable, cartItems, cartItemOptions } from "./cart.schema";
import { optionTable, optionGroupTable } from "./option.schema";
import { riderTable } from "./rider.schema";

export const orderTable = pgTable("order", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  code: text("code"),
  customerId: text("customer_id").references(() => userTable.id),
  shopId: text("shop_id")
    .references(() => shopTable.id)
    .notNull(),
  riderId: text("rider_id").references(() => userTable.id),
  riderConfirmationCode: integer("rider_confirmation_code").notNull(),
  status: text("status", { enum: ORDER_STATUS }).notNull(),
  cartId: text("cart_id")
    .references(() => cartTable.id)
    .notNull(),

  addressName: text("address_name").notNull().default(""),
  longitude: doublePrecision("longitude").notNull(),
  latitude: doublePrecision("latitude").notNull(),

  deliveryNotes: text("delivery_notes"),
  vendorNotes: text("vendor_notes"),

  paymentMethod: text("payment_method", { enum: PAYMENT_METHODS })
    .notNull()
    .default("CARD"),
  paymentStatus: text("payment_status", { enum: PAYMENT_STATUS }).notNull(),
  paymentTransactionId: text("payment_transaction_id"),

  subtotal: integer("subtotal").notNull(),
  deliveryFee: integer("delivery_fee").default(0),
  serviceFee: integer("service_fee").default(0),
  discount: integer("discount").default(0),
  total: integer("total").notNull(),
  paymentConfirmedAt: text("payment_confirmed_at"),
  acceptedAt: text("accepted_at"),
  preparedAt: text("prepared_at"),
  riderAssignedAt: text("rider_assigned_at"),
  pickedUpAt: text("picked_up_at"),
  deliveredAt: text("delivered_at"),
  canceledAt: text("canceled_at"),
  cancelReason: text("cancel_reason"),
  refundAmount: integer("refund_amount").default(0),
  refundReason: text("refund_reason"),
  refundStatus: text("refund_status", { enum: REFUND_STATUS }),
  refundReference: text("refund_reference"),
  refundedAt: text("refunded_at"),

  ...timestamps,
});

export const orderItemTable = pgTable("orderItem", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  orderId: text("order_id")
    .notNull()
    .references(() => orderTable.id, {
      onDelete: "cascade",
    }),
  menuItemId: text("menu_item_id").references(() => menuItemTable.id),
  menuItemName: text("menu_item_name").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: integer("unit_price").notNull(),
  totalPrice: integer("total_price").notNull(),
  specialInstructions: text("special_instructions"),

  ...timestamps,
});

export const orderItemOptionTable = pgTable("orderItemOption", {
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
  optionName: text("option_name").notNull(),
  quantity: integer("quantity").default(1),
  price: integer("price").notNull(),

  ...timestamps,
});

// Order relations
export const orderRelations = relations(orderTable, ({ one, many }) => ({
  customer: one(userTable, {
    fields: [orderTable.customerId],
    references: [userTable.id],
  }),
  rider: one(riderTable, {
    fields: [orderTable.riderId],
    references: [riderTable.userId],
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
