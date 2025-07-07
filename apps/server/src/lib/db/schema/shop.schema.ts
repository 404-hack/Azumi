import {
  pgTable,
  text,
  integer,
  primaryKey,
  doublePrecision,
  index,
  boolean,
  json,
  timestamp,
  varchar,
  geometry,
} from "drizzle-orm/pg-core";
import { array, timestamps } from "./utils.schema";
import { nanoid } from "nanoid";
import {
  DAYS_OF_WEEK,
  DELIVERY_TYPE,
  SHOP_AGREEMENTS_TYPE,
  SHOP_STATUS,
  SHOP_OWNERSHIP_TYPE,
  PAYMENT_METHODS,
} from "../../constant";
import { userTable } from "./auth.schema";
import { relations } from "drizzle-orm";
import { menuItemTable, menuCategoryTable } from "./menu.schema";
import { TCoordinates } from "../../types";
import { promotions, promotionShops } from "./promotion.schema";

export const shopTypeTable = pgTable("shopType", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  name: text("name").notNull(),
  ...timestamps,
});

export const shopTable = pgTable(
  "shop",
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
    metadata: json("metadata"),
    phoneNumber: text("phone_number"),
    address: text("address"),
    commission: integer("commission").default(0),
    minimumOrderAmount: integer("minimum_order_amount").default(500),
    active: boolean("active").default(false),
    status: text("status", { enum: SHOP_STATUS }).default("DRAFT"),
    logo: text("logo"),
    coverImage: text("cover_image"),
    averageRating: integer("average_rating"),
    totalRatings: integer("total_ratings").default(0),
    featuredPosition: integer("featured_position"),
    tags: text("tags").array(),
    bankInfo: json("bank_info"),
    deliveryType: text("delivery_type", { enum: DELIVERY_TYPE }),
    latitude: doublePrecision("latitude").notNull(),
    longitude: doublePrecision("longitude").notNull(),
    location: geometry("location", { type: "point", srid: 4326 }),
    addressName: text("address_name"),
    ownershipType: text("ownership_type", {
      enum: SHOP_OWNERSHIP_TYPE,
    }).default("OFFICIAL"),

    ...timestamps,
  },
  (table) => [
    index("location_idx").on(table.latitude, table.longitude),
    index("shop_type_idx").on(table.shopType),
    index("shop_location_gist_idx").using("gist", table.location),
  ]
);

export const member = pgTable("member", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => shopTable.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).notNull(),
});

export const invitation = pgTable("invitation", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => shopTable.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  role: text("role"),
  status: text("status").notNull(),
  expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
  inviterId: text("inviter_id")
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),
});

export const shopOperatingHoursTable = pgTable(
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
    isOpen: boolean("is_open").default(true),
    ...timestamps,
  },
  (table) => [primaryKey({ columns: [table.shopId, table.day] })]
);

export const shopTodoTable = pgTable("shopTodo", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  shopId: text("shop_id")
    .notNull()
    .references(() => shopTable.id, { onDelete: "cascade" }),
  storeInformationComplete: boolean("store_information_complete").default(
    false
  ),
  uploadAtLeastOneMenu: boolean("upload_at_least_one_menu").default(false),
  setUpPaymentMethod: boolean("set_up_payment_method").default(false),
  reviewTermsAndConditions: boolean("review_terms_and_conditions").default(
    false
  ),
  setUpOperatingHours: boolean("set_up_operating_hours").default(false),
  ...timestamps,
});

export const shopAgreementsTable = pgTable("shopAgreements", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  shopId: text("shop_id")
    .notNull()
    .references(() => shopTable.id, { onDelete: "cascade" }),
  agreementType: text("agreement_type", {
    enum: SHOP_AGREEMENTS_TYPE,
  }).notNull(),
  version: text("version").notNull(),
  acceptedById: text("accepted_by_id").references(() => userTable.id),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  ...timestamps,
});

export const shopPaymentMethodTable = pgTable(
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
  promotions: many(promotionShops),
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
