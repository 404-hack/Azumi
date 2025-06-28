import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  json,
} from "drizzle-orm/pg-core";
import { timestamps } from "./utils.schema";
import { nanoid } from "nanoid";
import { userTable } from "./auth.schema";
import { shopTable } from "./shop.schema";

export const loyaltyProgramTable = pgTable("loyalty_program", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  shopId: text("shop_id").references(() => shopTable.id, {
    onDelete: "cascade",
  }),
  name: text("name").notNull(),
  description: text("description"),
  pointsPerCurrency: integer("points_per_currency").notNull().default(1),
  minimumPoints: integer("minimum_points").notNull().default(0),
  active: boolean("active").default(true),
  rules: json("rules"),
  metadata: json("metadata"),
  ...timestamps,
});

export const loyaltyPointsTable = pgTable("loyalty_points", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  userId: text("user_id")
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),
  shopId: text("shop_id").references(() => shopTable.id, {
    onDelete: "cascade",
  }),
  points: integer("points").notNull().default(0),
  lifetimePoints: integer("lifetime_points").notNull().default(0),
  tier: text("tier").default("bronze"),
  lastEarnedAt: timestamp("last_earned_at", { mode: "date" }),
  metadata: json("metadata"),
  ...timestamps,
});

export const pointsTransactionTable = pgTable("points_transaction", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  userId: text("user_id")
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),
  shopId: text("shop_id").references(() => shopTable.id, {
    onDelete: "cascade",
  }),
  points: integer("points").notNull(),
  type: text("type").notNull(),
  description: text("description"),
  reference: text("reference"),
  metadata: json("metadata"),
  ...timestamps,
});
