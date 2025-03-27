import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { shopTable } from "./shop.schema";
import { timestamps } from "./utils.schema";

export const promotions = sqliteTable("promotions", {
  id: text("id").primaryKey(),
  shopId: text("shop_id").references(() => shopTable.id),
  name: text("name").notNull(),
  code: text("code").unique().notNull(),
  description: text("description"),
  type: text("type", {
    enum: ["percentage", "fixed", "bogo", "minimum_spend"],
  }).notNull(),
  value: real("value").notNull(),
  minOrderValue: real("min_order_value"),
  maxDiscount: real("max_discount"),
  buyQuantity: integer("buy_quantity"), // for BOGO promotions
  getQuantity: integer("get_quantity"), // for BOGO promotions
  startDate: integer("start_date", { mode: "timestamp" }).notNull(),
  endDate: integer("end_date", { mode: "timestamp" }).notNull(),
  usageLimit: integer("usage_limit"),
  usageCount: integer("usage_count").default(0),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  ...timestamps,
});

export const promotionProducts = sqliteTable("promotion_products", {
  id: text("id").primaryKey(),
  promotionId: text("promotion_id").references(() => promotions.id),
  productId: text("product_id").notNull(),
  ...timestamps,
});
