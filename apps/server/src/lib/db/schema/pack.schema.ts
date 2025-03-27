import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { timestamps } from "./utils.schema";
import { nanoid } from "nanoid";
import { shopTable } from "./shop.schema";
import { relations } from "drizzle-orm";
import { menuItemTable } from "./menu.schema";
import { userTable } from "./auth.schema";

export const packTable = sqliteTable("pack", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: integer("price").notNull(),
  shopId: text("shop_id")
    .references(() => shopTable.id)
    .notNull(),
  userId: text("user_id").references(() => userTable.id),
  ...timestamps,
});

export const packRelations = relations(packTable, ({ many }) => ({
  menus: many(menuItemTable),
}));
