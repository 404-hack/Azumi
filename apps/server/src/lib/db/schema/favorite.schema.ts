import { primaryKey, text } from "drizzle-orm/sqlite-core";
import { sqliteTable } from "drizzle-orm/sqlite-core";
import { shopTable } from "./shop.schema";
import { timestamps } from "./utils.schema";
import { userTable } from "./auth.schema";

export const favoriteTable = sqliteTable(
  "favorite_table",
  {
    userId: text("user_id")
      .references(() => userTable.id, { onDelete: "cascade" })
      .notNull(),
    shopId: text("shop_id")
      .references(() => shopTable.id, { onDelete: "cascade" })
      .notNull(),
    ...timestamps,
  },
  (table) => [primaryKey({ columns: [table.userId, table.shopId] })]
);
