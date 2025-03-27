import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { shopTable } from "./shop.schema";

export const deliveryZoneTable = sqliteTable("deliveryZones", {
  id: text("id").primaryKey(),
  shopId: text("shop_id").references(() => shopTable.id),
  name: text("name").notNull(),
  coordinates: text("coordinates", { mode: "json" }).notNull(), // Polygon coordinates
  baseDeliveryFee: real("base_delivery_fee").notNull(),
  minimumOrderValue: real("minimum_order_value").notNull(),
  estimatedDeliveryTime: integer("estimated_delivery_time").notNull(), // in minutes
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const deliveriesTable = sqliteTable("deliveries", {
  id: text("id").primaryKey(),
  orderId: text("order_id").notNull(),
  riderId: text("rider_id"),
  zoneId: text("zone_id").references(() => deliveryZoneTable.id),
  status: text("status", {
    enum: ["pending", "picked_up", "in_transit", "delivered", "failed"],
  }).default("pending"),
  pickupAddress: text("pickup_address").notNull(),
  deliveryAddress: text("delivery_address").notNull(),
  actualDeliveryFee: real("actual_delivery_fee").notNull(),
  pickupTime: integer("pickup_time", { mode: "timestamp" }),
  deliveryTime: integer("delivery_time", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  notes: text("notes"),
});
