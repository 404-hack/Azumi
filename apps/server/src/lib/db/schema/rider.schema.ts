import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { userTable } from "./auth.schema";

export const riders = sqliteTable("riders", {
  id: text("id")
    .primaryKey()
    .references(() => userTable.id, { onDelete: "cascade" }),
  vehicleType: text("vehicle_type"),
  licensePlate: text("license_plate"),
  idDocument: text("id_document"),
  currentLocation: text("current_location", { mode: "json" }),
  status: text("status", { enum: ["available", "busy", "offline"] }).default(
    "offline"
  ),
  rating: integer("rating"),
  isVerified: integer("is_verified", { mode: "boolean" }).default(false),
  bankInfo: text("bank_info", { mode: "json" }),
  activeArea: text("active_area", { mode: "json" }), // Geographic area where rider operates
  maxDeliveryDistance: integer("max_delivery_distance").default(10000), // in meters
});
