import {
  pgTable,
  text,
  integer,
  boolean,
  doublePrecision,
} from "drizzle-orm/pg-core";
import { userTable } from "./auth.schema";
import { timestamps } from "./utils.schema";

export const addressesTable = pgTable("addresses", {
  id: text("id").primaryKey().notNull(),
  userId: text("user_id").references(() => userTable.id, {
    onDelete: "cascade",
  }),
  address: text("address").notNull(),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  isDefault: boolean("is_default").default(false),
  ...timestamps,
});
