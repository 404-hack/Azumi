import {
  integer,
  pgTable,
  text,
  boolean,
  timestamp,
  json,
} from "drizzle-orm/pg-core";
import { shopTable } from "./shop.schema";

export const deliveryZoneTable = pgTable("deliveryZones", {
  id: text("id").primaryKey(),
  shopId: text("shop_id").references(() => shopTable.id),
  name: text("name").notNull(),
  coordinates: json("coordinates").notNull(),
  baseDeliveryFee: integer("base_delivery_fee").notNull(),
  minimumOrderValue: integer("minimum_order_value").notNull(),
  estimatedDeliveryTime: integer("estimated_delivery_time").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { mode: "date" }).notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull(),
});

export const deliveriesTable = pgTable("deliveries", {
  id: text("id").primaryKey(),
  orderId: text("order_id").notNull(),
  riderId: text("rider_id"),
  zoneId: text("zone_id").references(() => deliveryZoneTable.id),
  status: text("status", {
    enum: ["pending", "picked_up", "in_transit", "delivered", "failed"],
  }).default("pending"),
  pickupAddress: text("pickup_address").notNull(),
  deliveryAddress: text("delivery_address").notNull(),
  actualDeliveryFee: integer("actual_delivery_fee").notNull(),
  pickupTime: timestamp("pickup_time", { mode: "date" }),
  deliveryTime: timestamp("delivery_time", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull(),
  notes: text("notes"),
});
