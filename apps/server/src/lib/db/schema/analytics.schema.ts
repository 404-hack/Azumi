import { pgTable, text, integer, json, timestamp } from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";
import { timestamps } from "./utils.schema";
import { userTable } from "./auth.schema";
import { orderTable } from "./order.schema";
import { menuItemTable } from "./menu.schema";

export const userActivityTable = pgTable("user_activity", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  userId: text("user_id")
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  itemId: text("item_id").references(() => menuItemTable.id, {
    onDelete: "set null",
  }),
  orderId: text("order_id").references(() => orderTable.id, {
    onDelete: "set null",
  }),
  metadata: json("metadata"),
  ...timestamps,
});

export const searchHistoryTable = pgTable("search_history", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  userId: text("user_id")
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),
  query: text("query").notNull(),
  resultCount: integer("result_count").notNull(),
  filters: json("filters"),
  metadata: json("metadata"),
  ...timestamps,
});

export const userMetricsTable = pgTable("user_metrics", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  userId: text("user_id")
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),
  totalOrders: integer("total_orders").notNull().default(0),
  totalSpent: integer("total_spent").notNull().default(0),
  averageOrderValue: integer("average_order_value").notNull().default(0),
  lastOrderDate: timestamp("last_order_date", { mode: "date" }),
  favoriteCategories: json("favorite_categories"),
  metadata: json("metadata"),
  ...timestamps,
});
