import { pgTable, text, integer, boolean, json } from "drizzle-orm/pg-core";
import { timestamps } from "./utils.schema";
import { nanoid } from "nanoid";
import { userTable } from "./auth.schema";
import { orderTable } from "./order.schema";
import { shopTable } from "./shop.schema";
import { relations } from "drizzle-orm";

export const paymentMethodTable = pgTable("payment_method", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  userId: text("user_id")
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  provider: text("provider"),
  accountNumber: text("account_number"),
  expiryDate: text("expiry_date"),
  isDefault: boolean("is_default").default(false),
  metadata: json("metadata"),
  ...timestamps,
});

export const vendorTransactionTable = pgTable("vendor_transaction", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  shopId: text("shop_id")
    .notNull()
    .references(() => shopTable.id, { onDelete: "cascade" }),
  orderId: text("order_id").references(() => orderTable.id, {
    onDelete: "set null",
  }),

  grossAmount: integer("gross_amount").notNull(),
  commissionRate: integer("commission_rate").notNull(),
  commissionAmount: integer("commission_amount").notNull(),
  netAmount: integer("net_amount").notNull(),

  amount: integer("amount").notNull(),

  currency: text("currency").notNull().default("NGN"),
  status: text("status").notNull(),
  type: text("type").notNull(),
  reference: text("reference").unique(),
  description: text("description"),
  metadata: json("metadata"),
  ...timestamps,
});

export const riderTransactionTable = pgTable("rider_transaction", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  riderId: text("rider_id")
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),
  orderId: text("order_id").references(() => orderTable.id, {
    onDelete: "set null",
  }),

  deliveryFee: integer("delivery_fee").notNull(),
  distanceBonus: integer("distance_bonus").default(0),
  peakTimeBonus: integer("peak_time_bonus").default(0),
  tipAmount: integer("tip_amount").default(0),
  platformFee: integer("platform_fee").default(0),
  netAmount: integer("net_amount").notNull(),

  amount: integer("amount").notNull(),

  currency: text("currency").notNull().default("NGN"),
  status: text("status").notNull(),
  type: text("type").notNull(),
  reference: text("reference").unique(),
  description: text("description"),
  metadata: json("metadata"),
  ...timestamps,
});

// Relations for vendor transactions
export const vendorTransactionRelations = relations(
  vendorTransactionTable,
  ({ one }) => ({
    shop: one(shopTable, {
      fields: [vendorTransactionTable.shopId],
      references: [shopTable.id],
    }),
    order: one(orderTable, {
      fields: [vendorTransactionTable.orderId],
      references: [orderTable.id],
    }),
  })
);

// Relations for rider transactions
export const riderTransactionRelations = relations(
  riderTransactionTable,
  ({ one }) => ({
    rider: one(userTable, {
      fields: [riderTransactionTable.riderId],
      references: [userTable.id],
    }),
    order: one(orderTable, {
      fields: [riderTransactionTable.orderId],
      references: [orderTable.id],
    }),
  })
);
