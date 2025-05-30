import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { timestamps } from "./utils.schema";
import { nanoid } from "nanoid";
import { userTable } from "./auth.schema";

export const notificationTable = sqliteTable("notification", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  userId: text("user_id")
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  body: text("body").notNull(),
  type: text("type").notNull(), // order_update, promotion, system_alert, etc.
  priority: text("priority").default("normal"), // high, normal, low
  read: integer("read", { mode: "boolean" }).default(false),
  readAt: integer("read_at", { mode: "timestamp" }),
  actionUrl: text("action_url"),
  image: text("image"),
  metadata: text("metadata", { mode: "json" }),
  ...timestamps,
});

export const deviceTokenTable = sqliteTable("device_token", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  userId: text("user_id")
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  type: text("type").notNull(), // fcm, apn
  device: text("device"), // ios, android, web
  lastUsedAt: integer("last_used_at", { mode: "timestamp" }),
  metadata: text("metadata", { mode: "json" }),
  ...timestamps,
});
