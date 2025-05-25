import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { userTable } from "./auth.schema";
import { timestamps } from "./utils.schema";
import {
  RIDER_APPLICATION_STATUS,
  RIDER_AVAILABILITY_STATUS,
  RIDER_DOCUMENTS,
  VEHICLE_TYPES,
  PAYMENT_METHODS,
} from "../../constant";
import { nanoid } from "nanoid";
import { relations } from "drizzle-orm";

export const riderTable = sqliteTable("riders", {
  id: text("id")
    .primaryKey()
    .$default(() => nanoid()),
  userId: text("user_id")
    .references(() => userTable.id, {
      onDelete: "cascade",
    })
    .unique(),

  firstName: text("first_name"),
  lastName: text("last_name"),
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
  maxDeliveryDistance: integer("max_delivery_distance").default(10), // in km
  ...timestamps,
});

export const riderPaymentMethodTable = sqliteTable("rider_payment_methods", {
  id: text("id")
    .primaryKey()
    .$default(() => nanoid()),
  riderId: text("rider_id")
    .notNull()
    .references(() => riderTable.id, { onDelete: "cascade" })
    .unique(), // Ensure one rider can only have one payment method
  type: text("type", { enum: PAYMENT_METHODS }).default("BANK_TRANSFER"),
  accountNumber: text("account_number").notNull(),
  accountName: text("account_name").notNull(),
  bankName: text("bank_name").notNull(),
  bankCode: text("bank_code").notNull(),
  paystackRecipientCode: text("paystack_recipient_code"),
  ...timestamps,
});

export const riderRelations = relations(riderTable, ({ one, many }) => ({
  user: one(userTable, {
    fields: [riderTable.userId],
    references: [userTable.id],
  }),
  paymentMethod: one(riderPaymentMethodTable, {
    fields: [riderTable.id],
    references: [riderPaymentMethodTable.riderId],
  }),
}));

export const riderPaymentMethodRelations = relations(
  riderPaymentMethodTable,
  ({ one }) => ({
    rider: one(riderTable, {
      fields: [riderPaymentMethodTable.riderId],
      references: [riderTable.id],
    }),
  })
);
