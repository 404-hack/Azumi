import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { nanoid } from "nanoid";
import { timestamps } from "./utils.schema";
import { userTable } from "./auth.schema";
import { orderTable } from "./order.schema";
import { menuItemTable } from "./menu.schema";

export const userActivityTable = sqliteTable("user_activity", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  userId: text("user_id").notNull().references(() => userTable.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // search, view_item, add_to_cart, etc.
  itemId: text("item_id").references(() => menuItemTable.id, { onDelete: "set null" }),
  orderId: text("order_id").references(() => orderTable.id, { onDelete: "set null" }),
  metadata: text("metadata", { mode: "json" }),
  ...timestamps,
});

export const searchHistoryTable = sqliteTable("search_history", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  userId: text("user_id").notNull().references(() => userTable.id, { onDelete: "cascade" }),
  query: text("query").notNull(),
  resultCount: integer("result_count").notNull(),
  filters: text("filters", { mode: "json" }),
  metadata: text("metadata", { mode: "json" }),
  ...timestamps,
});

export const userMetricsTable = sqliteTable("user_metrics", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  userId: text("user_id").notNull().references(() => userTable.id, { onDelete: "cascade" }),
  totalOrders: integer("total_orders").notNull().default(0),
  totalSpent: integer("total_spent").notNull().default(0),
  averageOrderValue: integer("average_order_value").notNull().default(0),
  lastOrderDate: integer("last_order_date", { mode: "timestamp" }),
  favoriteCategories: text("favorite_categories", { mode: "json" }),
  metadata: text("metadata", { mode: "json" }),
  ...timestamps,
});