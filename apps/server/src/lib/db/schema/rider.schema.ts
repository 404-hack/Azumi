import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { userTable } from "./auth.schema";
import { timestamps } from "./utils.schema";
import {
  RIDER_APPLICATION_STATUS,
  RIDER_AVAILABILITY_STATUS,
  RIDER_DOCUMENTS,
  VEHICLE_TYPES,
} from "../../constant";

export const riderTable = sqliteTable("riders", {
  id: text("id")
    .primaryKey()
    .references(() => userTable.id, { onDelete: "cascade" }),
  firstName: text("first_name"),
  lastName: text("last_name"),
  phoneNumber: text("phone_number"),
  email: text("email"),
  address: text("address"),
  longitude: real("longitude"),
  latitude: real("latitude"),
  addressName: text("address_name"),
  vehicleType: text("vehicle_type", {
    enum: VEHICLE_TYPES,
  }),
  vehicleLicense: text("vehicle_license"),
  identificationDocument: text("identification_document"),
  applicationStatus: text("application_status", {
    enum: RIDER_APPLICATION_STATUS,
  }).default("DRAFT"),
  active: integer("active", { mode: "boolean" }).default(false),
  availabilityStatus: text("availability_status", {
    enum: RIDER_AVAILABILITY_STATUS,
  }).default("OFFLINE"),
  rating: real("rating").default(0),
  totalRatings: integer("total_ratings").default(0),
  isVerified: integer("is_verified", { mode: "boolean" }).default(false),
  bankInfo: text("bank_info", { mode: "json" }),
  maxDeliveryDistance: integer("max_delivery_distance").default(10000), // in meters
  ...timestamps,
});
