import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  json,
} from "drizzle-orm/pg-core";
import { timestamps } from "./utils.schema";
import { nanoid } from "nanoid";
import { userTable } from "./auth.schema";

export const notificationTable = pgTable("notification", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  userId: text("user_id")
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  body: text("body").notNull(),
  type: text("type").notNull(),
  priority: text("priority").default("normal"),
  read: boolean("read").default(false),
  readAt: timestamp("read_at", { mode: "date" }),
  actionUrl: text("action_url"),
  image: text("image"),
  metadata: json("metadata"),
  ...timestamps,
});

export const deviceTokenTable = pgTable("device_token", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  userId: text("user_id")
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  type: text("type").notNull(),
  device: text("device"),
  lastUsedAt: timestamp("last_used_at", { mode: "date" }),
  metadata: json("metadata"),
  ...timestamps,
});
