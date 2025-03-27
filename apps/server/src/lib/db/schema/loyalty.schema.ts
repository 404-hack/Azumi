import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { timestamps } from "./utils.schema";
import { nanoid } from "nanoid";
import { userTable } from "./auth.schema";
import { shopTable } from "./shop.schema";

export const loyaltyProgramTable = sqliteTable("loyalty_program", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  shopId: text("shop_id").references(() => shopTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  pointsPerCurrency: integer("points_per_currency").notNull().default(1),
  minimumPoints: integer("minimum_points").notNull().default(0),
  active: integer("active", { mode: "boolean" }).default(true),
  rules: text("rules", { mode: "json" }),
  metadata: text("metadata", { mode: "json" }),
  ...timestamps,
});

export const loyaltyPointsTable = sqliteTable("loyalty_points", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  userId: text("user_id").notNull().references(() => userTable.id, { onDelete: "cascade" }),
  shopId: text("shop_id").references(() => shopTable.id, { onDelete: "cascade" }),
  points: integer("points").notNull().default(0),
  lifetimePoints: integer("lifetime_points").notNull().default(0),
  tier: text("tier").default("bronze"),
  lastEarnedAt: integer("last_earned_at", { mode: "timestamp" }),
  metadata: text("metadata", { mode: "json" }),
  ...timestamps,
});

export const pointsTransactionTable = sqliteTable("points_transaction", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  userId: text("user_id").notNull().references(() => userTable.id, { onDelete: "cascade" }),
  shopId: text("shop_id").references(() => shopTable.id, { onDelete: "cascade" }),
  points: integer("points").notNull(),
  type: text("type").notNull(), // earned, redeemed, expired, adjusted
  description: text("description"),
  reference: text("reference"),
  metadata: text("metadata", { mode: "json" }),
  ...timestamps,
});