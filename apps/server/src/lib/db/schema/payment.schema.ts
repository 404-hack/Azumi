import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { timestamps } from "./utils.schema";
import { nanoid } from "nanoid";
import { userTable } from "./auth.schema";
import { orderTable } from "./order.schema";

export const paymentMethodTable = sqliteTable("payment_method", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  userId: text("user_id").notNull().references(() => userTable.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // credit_card, bank_transfer, mobile_money, etc.
  provider: text("provider"), // visa, mastercard, mpesa, etc.
  accountNumber: text("account_number"),
  expiryDate: text("expiry_date"),
  isDefault: integer("is_default", { mode: "boolean" }).default(false),
  metadata: text("metadata", { mode: "json" }),
  ...timestamps,
});

export const transactionTable = sqliteTable("transaction", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  userId: text("user_id").notNull().references(() => userTable.id, { onDelete: "cascade" }),
  orderId: text("order_id").references(() => orderTable.id, { onDelete: "set null" }),
  paymentMethodId: text("payment_method_id").references(() => paymentMethodTable.id, { onDelete: "set null" }),
  amount: integer("amount").notNull(),
  currency: text("currency").notNull().default("USD"),
  status: text("status").notNull(), // pending, completed, failed, refunded
  type: text("type").notNull(), // payment, refund, credit
  reference: text("reference").unique(),
  description: text("description"),
  metadata: text("metadata", { mode: "json" }),
  ...timestamps,
});