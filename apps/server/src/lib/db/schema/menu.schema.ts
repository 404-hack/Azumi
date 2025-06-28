import {
  pgTable,
  text,
  integer,
  primaryKey,
  boolean,
} from "drizzle-orm/pg-core";
import { timestamps } from "./utils.schema";
import { nanoid } from "nanoid";
import { shopTable } from "./shop.schema";
import { relations } from "drizzle-orm";

import { optionGroupTable } from "./option.schema";
import { packTable } from "./pack.schema";

export const menuCategoryTable = pgTable("menu_category", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  name: text("name").notNull(),
  published: boolean("published").default(true).notNull(),
  shopId: text("shop_id")
    .references(() => shopTable.id)
    .notNull(),
  ...timestamps,
});

export const menuItemTable = pgTable("menu_item", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  name: text("name").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url"),
  price: integer("price").notNull(),
  priceDescription: text("price_description"),
  inStock: boolean("in_stock").default(true),
  categoryId: text("category_id")
    .references(() => menuCategoryTable.id, { onDelete: "cascade" })
    .notNull(),
  packId: text("pack_id").references(() => packTable.id),
  shopId: text("shop_id")
    .references(() => shopTable.id)
    .notNull(),
  ...timestamps,
});

export const menuItemOptionGroups = pgTable(
  "menu_item_option_groups",
  {
    menuItemId: text("menu_item_id")
      .notNull()
      .references(() => menuItemTable.id, { onDelete: "cascade" }),
    optionGroupId: text("option_group_id")
      .notNull()
      .references(() => optionGroupTable.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").default(0),
  },
  (t) => [primaryKey({ columns: [t.menuItemId, t.optionGroupId] })]
);

export const menuRelations = relations(menuItemTable, ({ one, many }) => ({
  category: one(menuCategoryTable, {
    fields: [menuItemTable.categoryId],
    references: [menuCategoryTable.id],
  }),
  pack: one(packTable, {
    fields: [menuItemTable.packId],
    references: [packTable.id],
  }),
  shop: one(shopTable, {
    fields: [menuItemTable.shopId],
    references: [shopTable.id],
  }),
  menuItemOptionGroups: many(menuItemOptionGroups),
}));

export const menuCategoryRelations = relations(
  menuCategoryTable,
  ({ many, one }) => ({
    menus: many(menuItemTable),
    shop: one(shopTable, {
      fields: [menuCategoryTable.shopId],
      references: [shopTable.id],
    }),
  })
);

export const menuItemOptionGroupsRelations = relations(
  menuItemOptionGroups,
  ({ one }) => ({
    menuItem: one(menuItemTable, {
      fields: [menuItemOptionGroups.menuItemId],
      references: [menuItemTable.id],
    }),
    optionGroup: one(optionGroupTable, {
      fields: [menuItemOptionGroups.optionGroupId],
      references: [optionGroupTable.id],
    }),
  })
);
