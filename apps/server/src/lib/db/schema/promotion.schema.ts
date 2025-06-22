import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { shopTable } from "./shop.schema";
import { userTable } from "./auth.schema";
import { timestamps } from "./utils.schema";
import { relations } from "drizzle-orm";
import { PROMOTION_COST_BEARER } from "../../constant";

export const promotions = sqliteTable("promotions", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").unique().notNull(),
  description: text("description"),
  type: text("type", {
    enum: ["percentage", "fixed", "bogo", "minimum_spend"],
  }).notNull(),
  value: real("value").notNull(),
  minOrderValue: real("min_order_value"),
  maxDiscount: real("max_discount"),
  buyQuantity: integer("buy_quantity"),
  getQuantity: integer("get_quantity"),
  startDate: integer("start_date", { mode: "timestamp" }).notNull(),
  endDate: integer("end_date", { mode: "timestamp" }).notNull(),
  usageLimit: integer("usage_limit"),
  usageCount: integer("usage_count").default(0),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  isFirstOrderOnly: integer("is_first_order_only", { mode: "boolean" }).default(
    false
  ),
  appliesToAllShops: integer("applies_to_all_shops", {
    mode: "boolean",
  }).default(false),
  costBearer: text("cost_bearer", {
    enum: PROMOTION_COST_BEARER,
  })
    .default("PLATFORM")
    .notNull(),
  createdBy: text("created_by")
    .notNull()
    .references(() => userTable.id),
  creatorType: text("creator_type", {
    enum: ["superAdmin", "vendor"],
  }).notNull(),
  ...timestamps,
});

export const promotionShops = sqliteTable("promotion_shops", {
  id: text("id").primaryKey(),
  promotionId: text("promotion_id")
    .notNull()
    .references(() => promotions.id, { onDelete: "cascade" }),
  shopId: text("shop_id")
    .notNull()
    .references(() => shopTable.id, { onDelete: "cascade" }),
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
  creator: one(userTable, {
    fields: [promotions.createdBy],
    references: [userTable.id],
  }),
  shops: many(promotionShops),
  products: many(promotionProducts),
}));

export const promotionShopsRelations = relations(promotionShops, ({ one }) => ({
  promotion: one(promotions, {
    fields: [promotionShops.promotionId],
    references: [promotions.id],
  }),
  shop: one(shopTable, {
    fields: [promotionShops.shopId],
    references: [shopTable.id],
  }),
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

// export const shopPromotionsRelations = relations(shopTable, ({ many }) => ({
//   promotions: many(promotionShops),
// }));
