import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { userTable } from "./auth.schema";
import { timestamps } from "./utils.schema";

export const addressesTable = sqliteTable("addresses", {
  id: text("id").primaryKey().notNull(),
  userId: text("user_id").references(() => userTable.id, {
    onDelete: "cascade",
  }),
  address: text("address").notNull(),
  latitude: integer("latitude").notNull(),
  longitude: integer("longitude").notNull(),
  isDefault: integer("is_default", { mode: "boolean" }).default(false),
  ...timestamps,
});
