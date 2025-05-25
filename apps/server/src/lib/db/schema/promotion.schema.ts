import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { shopTable } from "./shop.schema";
import { timestamps } from "./utils.schema";
import { relations } from "drizzle-orm";
import { PROMOTION_COST_BEARER } from "../../constant";

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
  costBearer: text("cost_bearer", {
    enum: PROMOTION_COST_BEARER,
  })
    .default("VENDOR")
    .notNull(),
  ...timestamps,
});

export const promotionProducts = sqliteTable("promotion_products", {
  id: text("id").primaryKey(),
  promotionId: text("promotion_id").references(() => promotions.id),
  productId: text("product_id").notNull(),
  ...timestamps,
});

// Define relations
export const promotionsRelations = relations(promotions, ({ one, many }) => ({
  shop: one(shopTable, {
    fields: [promotions.shopId],
    references: [shopTable.id],
  }),
  products: many(promotionProducts),
}));

export const promotionProductsRelations = relations(
  promotionProducts,
  ({ one }) => ({
    promotion: one(promotions, {
      fields: [promotionProducts.promotionId],
      references: [promotions.id],
    }),
  })
);
