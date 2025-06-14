import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { timestamps } from "./utils.schema";
import { nanoid } from "nanoid";
import { userTable } from "./auth.schema";
import { orderTable } from "./order.schema";
import { shopTable } from "./shop.schema";
import { relations } from "drizzle-orm";

export const paymentMethodTable = sqliteTable("payment_method", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  userId: text("user_id")
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // credit_card, bank_transfer, mobile_money, etc.
  provider: text("provider"), // visa, mastercard, mpesa, etc.
  accountNumber: text("account_number"),
  expiryDate: text("expiry_date"),
  isDefault: integer("is_default", { mode: "boolean" }).default(false),
  metadata: text("metadata", { mode: "json" }),
  ...timestamps,
});

// Vendor Transaction Table - For shop/vendor earnings and payouts
export const vendorTransactionTable = sqliteTable("vendor_transaction", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  shopId: text("shop_id")
    .notNull()
    .references(() => shopTable.id, { onDelete: "cascade" }),
  orderId: text("order_id").references(() => orderTable.id, {
    onDelete: "set null",
  }),

  // Amount breakdown for transparency
  grossAmount: integer("gross_amount").notNull(), // Full order subtotal before any deductions (in cents)
  commissionRate: integer("commission_rate").notNull(), // Commission percentage (e.g., 10 for 10%)
  commissionAmount: integer("commission_amount").notNull(), // Actual commission deducted in cents
  netAmount: integer("net_amount").notNull(), // Final payout amount after commission in cents

  // Legacy amount field for backward compatibility
  amount: integer("amount").notNull(), // This will be same as netAmount

  currency: text("currency").notNull().default("NGN"),
  status: text("status").notNull(), // PENDING, COMPLETED, FAILED, REFUNDED
  type: text("type").notNull(), // CREDIT (earning), DEBIT (withdrawal), REFUND
  reference: text("reference").unique(),
  description: text("description"),
  metadata: text("metadata", { mode: "json" }),
  ...timestamps,
});

// Rider Transaction Table - For delivery driver earnings and payouts
export const riderTransactionTable = sqliteTable("rider_transaction", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  riderId: text("rider_id")
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),
  orderId: text("order_id").references(() => orderTable.id, {
    onDelete: "set null",
  }),

  // Amount breakdown for delivery earnings
  deliveryFee: integer("delivery_fee").notNull(), // Base delivery fee in cents
  distanceBonus: integer("distance_bonus").default(0), // Extra for long distances
  peakTimeBonus: integer("peak_time_bonus").default(0), // Rush hour bonus
  tipAmount: integer("tip_amount").default(0), // Customer tip
  platformFee: integer("platform_fee").default(0), // Platform commission from delivery fee
  netAmount: integer("net_amount").notNull(), // Final payout to rider in cents

  // Legacy amount field for backward compatibility
  amount: integer("amount").notNull(), // This will be same as netAmount

  currency: text("currency").notNull().default("NGN"),
  status: text("status").notNull(), // PENDING, COMPLETED, FAILED, REFUNDED
  type: text("type").notNull(), // CREDIT (earning), DEBIT (withdrawal), REFUND
  reference: text("reference").unique(),
  description: text("description"),
  metadata: text("metadata", { mode: "json" }),
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
