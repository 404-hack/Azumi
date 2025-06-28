import { primaryKey, text } from "drizzle-orm/pg-core";
import { pgTable } from "drizzle-orm/pg-core";
import { shopTable } from "./shop.schema";
import { timestamps } from "./utils.schema";
import { userTable } from "./auth.schema";

export const favoriteTable = pgTable(
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
