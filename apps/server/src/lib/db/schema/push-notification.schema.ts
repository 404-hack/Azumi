import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { userTable } from "./auth.schema";

export const pushTokenTable = sqliteTable(
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
    isActive: integer("is_active", { mode: "boolean" }).default(true),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
    lastUsedAt: integer("last_used_at", { mode: "timestamp" }),
  },
  (table) => [
    index("push_token_user_id_idx").on(table.userId),
    index("push_token_token_idx").on(table.token),
    index("push_token_active_idx").on(table.isActive),
    index("push_token_provider_idx").on(table.provider),
  ]
);

export const topicSubscriptionTable = sqliteTable(
  "topic_subscription",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    topic: text("topic").notNull(),
    isSubscribed: integer("is_subscribed", { mode: "boolean" }).default(true),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [
    index("topic_subscription_user_topic_idx").on(table.userId, table.topic),
    index("topic_subscription_topic_idx").on(table.topic),
  ]
);

export const notificationLogTable = sqliteTable(
  "notification_log",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").references(() => userTable.id, {
      onDelete: "set null",
    }),
    token: text("token"),
    title: text("title").notNull(),
    body: text("body").notNull(),
    data: text("data", { mode: "json" }),
    messageId: text("message_id"),
    status: text("status").notNull(),
    errorMessage: text("error_message"),
    sentAt: integer("sent_at", { mode: "timestamp" }).notNull(),
    deliveredAt: integer("delivered_at", { mode: "timestamp" }),
    clickedAt: integer("clicked_at", { mode: "timestamp" }),
  },
  (table) => [
    index("notification_log_user_id_idx").on(table.userId),
    index("notification_log_status_idx").on(table.status),
    index("notification_log_sent_at_idx").on(table.sentAt),
  ]
);
