import {
  pgTable,
  text,
  integer,
  index,
  boolean,
  timestamp,
  json,
} from "drizzle-orm/pg-core";
import { userTable } from "./auth.schema";

export const pushTokenTable = pgTable(
  "push_token",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    deviceId: text("device_id"),
    deviceType: text("device_type"),
    userAgent: text("user_agent"),
    provider: text("provider").notNull().default("fcm"),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at", { mode: "date" }).notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull(),
    lastUsedAt: timestamp("last_used_at", { mode: "date" }),
  },
  (table) => [
    index("push_token_user_id_idx").on(table.userId),
    index("push_token_token_idx").on(table.token),
    index("push_token_active_idx").on(table.isActive),
    index("push_token_provider_idx").on(table.provider),
  ]
);

export const topicSubscriptionTable = pgTable(
  "topic_subscription",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    topic: text("topic").notNull(),
    isSubscribed: boolean("is_subscribed").default(true),
    createdAt: timestamp("created_at", { mode: "date" }).notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull(),
  },
  (table) => [
    index("topic_subscription_user_topic_idx").on(table.userId, table.topic),
    index("topic_subscription_topic_idx").on(table.topic),
  ]
);

export const notificationLogTable = pgTable(
  "notification_log",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").references(() => userTable.id, {
      onDelete: "set null",
    }),
    token: text("token"),
    title: text("title").notNull(),
    body: text("body").notNull(),
    data: json("data"),
    messageId: text("message_id"),
    status: text("status").notNull(),
    errorMessage: text("error_message"),
    sentAt: timestamp("sent_at", { mode: "date" }).notNull(),
    deliveredAt: timestamp("delivered_at", { mode: "date" }),
    clickedAt: timestamp("clicked_at", { mode: "date" }),
  },
  (table) => [
    index("notification_log_user_id_idx").on(table.userId),
    index("notification_log_status_idx").on(table.status),
    index("notification_log_sent_at_idx").on(table.sentAt),
  ]
);
