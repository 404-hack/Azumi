import {
  sqliteTable,
  text,
  integer,
  primaryKey,
  real, // Import real for floating-point numbers
  index, // Import index for creating indexes
} from "drizzle-orm/sqlite-core";
import { array, timestamps } from "./utils.schema";
import { nanoid } from "nanoid";
import {
  DAYS_OF_WEEK,
  DELIVERY_TYPE,
  SHOP_AGREEMENTS_TYPE,
  SHOP_STATUS,
  PAYMENT_METHODS,
} from "../../constant";
import { userTable } from "./auth.schema";
import { relations } from "drizzle-orm";
import { menuItemTable, menuCategoryTable } from "./menu.schema";
import { TCoordinates } from "../../types";
import { promotions } from "./promotion.schema";

export const shopTypeTable = sqliteTable("shopType", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  name: text("name").notNull(),
  ...timestamps,
});

// Define the coordinates type

export const shopTable = sqliteTable(
  "shop_table",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => nanoid()),
    slug: text("slug").unique(),
    name: text("name").notNull(),
    email: text("email"),
    shopType: text("shop_type").references(() => shopTypeTable.id),
    website: text("website"),
    description: text("description"),
    metadata: text("metadata", { mode: "json" }),
    phoneNumber: text("phone_number"),
    address: text("address"),
    commission: integer("commission").default(0),
    minimumOrderAmount: integer("minimum_order_amount").default(500),
    active: integer("active", { mode: "boolean" }).default(false),
    status: text("status", { enum: SHOP_STATUS }).default("DRAFT"),
    logo: text("logo"),
    coverImage: text("cover_image"),
    averageRating: integer("average_rating"),
    totalRatings: integer("total_ratings").default(0),
    featuredPosition: integer("featured_position"),
    tags: array<string>(),
    bankInfo: text("bank_info", { mode: "json" }),
    deliveryType: text("delivery_type", { enum: DELIVERY_TYPE }),
    latitude: real("latitude"), // Add latitude column
    longitude: real("longitude"), // Add longitude column
    addressName: text("address_name"), // Add address name column
    isVerified: integer("is_verified", { mode: "boolean" }).default(false),

    ...timestamps,
  },
  // Add indexes for location columns
  (table) => [
    index("location_idx").on(table.latitude, table.longitude),
    index("shop_type_idx").on(table.shopType), // Index shopType if frequently filtered
  ]
);

export const member = sqliteTable("member", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => shopTable.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const invitation = sqliteTable("invitation", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => shopTable.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  role: text("role"),
  status: text("status").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  inviterId: text("inviter_id")
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),
});

export const shopOperatingHoursTable = sqliteTable(
  "shopOperatingHours",
  {
    id: text("id")
      .$defaultFn(() => nanoid())
      .notNull(),
    shopId: text("shop_id")
      .references(() => shopTable.id)
      .notNull(),
    day: text("day").notNull(),
    openTime: text("open_time").notNull(),
    closeTime: text("close_time").notNull(),
    isOpen: integer("is_open", { mode: "boolean" }).default(true),
    ...timestamps,
  },
  (table) => [primaryKey({ columns: [table.shopId, table.day] })]
);

export const shopTodoTable = sqliteTable("shopTodo", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  shopId: text("shop_id")
    .notNull()
    .references(() => shopTable.id, { onDelete: "cascade" }),
  storeInformationComplete: integer("store_information_complete", {
    mode: "boolean",
  }).default(false),
  uploadAtLeastOneMenu: integer("upload_at_least_one_menu", {
    mode: "boolean",
  }).default(false),
  setUpPaymentMethod: integer("set_up_payment_method", {
    mode: "boolean",
  }).default(false),
  reviewTermsAndConditions: integer("review_terms_and_conditions", {
    mode: "boolean",
  }).default(false),
  setUpOperatingHours: integer("set_up_operating_hours", {
    mode: "boolean",
  }).default(false),
  ...timestamps,
});

export const shopAgreementsTable = sqliteTable("shopAgreements", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  shopId: text("shop_id")
    .notNull()
    .references(() => shopTable.id, { onDelete: "cascade" }),
  agreementType: text("agreement_type", {
    enum: SHOP_AGREEMENTS_TYPE,
  }).notNull(),
  version: text("version").notNull(), // e.g., "1.0", "2023-05-01"
  acceptedById: text("accepted_by_id").references(() => userTable.id),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  ...timestamps,
});

export const shopPaymentMethodTable = sqliteTable(
  "shopPaymentMethod",
  {
    id: text("id").$defaultFn(() => nanoid()),
    shopId: text("shop_id")
      .notNull()
      .references(() => shopTable.id, { onDelete: "cascade" }),
    type: text("type", {
      enum: PAYMENT_METHODS,
    }).notNull(),
    accountNumber: text("account_number"),
    accountName: text("account_name"),
    bankName: text("bank_name"),
    paystackRecipientCode: text("paystack_recipient_code"),
    bankCode: text("bank_code"),
    ...timestamps,
  },
  (table) => [primaryKey({ columns: [table.accountNumber, table.shopId] })]
);
export const memberRelations = relations(member, ({ one }) => ({
  shop: one(shopTable, {
    fields: [member.organizationId],
    references: [shopTable.id],
    relationName: "shopOfMember",
  }),
  user: one(userTable, {
    fields: [member.userId],
    references: [userTable.id],
  }),
}));
export const shopRelations = relations(shopTable, ({ one, many }) => ({
  members: many(member),
  todo: one(shopTodoTable, {
    fields: [shopTable.id],
    references: [shopTodoTable.shopId],
  }),
  menu: many(menuItemTable),
  menuCategories: many(menuCategoryTable),
  agreements: many(shopAgreementsTable),
  paymentMethods: many(shopPaymentMethodTable),
  operatingHours: many(shopOperatingHoursTable),
  promotions: many(promotions),
}));
export const shopAgreementRelations = relations(
  shopAgreementsTable,
  ({ one }) => ({
    shop: one(shopTable, {
      fields: [shopAgreementsTable.shopId],
      references: [shopTable.id],
    }),
  })
);

export const shopTodoRelations = relations(shopTodoTable, ({ one }) => ({
  shop: one(shopTable, {
    fields: [shopTodoTable.shopId],
    references: [shopTable.id],
  }),
}));

// Define the relations
export const shopPaymentMethodRelations = relations(
  shopPaymentMethodTable,
  ({ one }) => ({
    shop: one(shopTable, {
      fields: [shopPaymentMethodTable.shopId],
      references: [shopTable.id],
    }),
  })
);
export const shopOperatingHoursRelations = relations(
  shopOperatingHoursTable,
  ({ one }) => ({
    shop: one(shopTable, {
      fields: [shopOperatingHoursTable.shopId],
      references: [shopTable.id],
    }),
  })
);
