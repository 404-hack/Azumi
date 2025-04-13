import {
  sqliteTable,
  AnySQLiteColumn,
  integer,
  text,
  numeric,
  blob,
  foreignKey,
  uniqueIndex,
  real,
  primaryKey,
  index,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const d1Migrations = sqliteTable("d1_migrations", {
  id: integer().primaryKey({ autoIncrement: true }),
  name: text(),
  appliedAt: numeric("applied_at")
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull(),
});

export const cfMetadata = sqliteTable("_cf_METADATA", {
  key: integer().primaryKey(),
  value: blob(),
});

export const addresses = sqliteTable("addresses", {
  id: text().primaryKey().notNull(),
  userId: text("user_id").references(() => userTable.id, {
    onDelete: "cascade",
  }),
  address: text().notNull(),
  latitude: integer().notNull(),
  longitude: integer().notNull(),
  isDefault: integer("is_default").default(false),
  createdAt: integer("created_at"),
  updatedAt: integer("updated_at"),
});

export const searchHistory = sqliteTable("search_history", {
  id: text().primaryKey().notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),
  query: text().notNull(),
  resultCount: integer("result_count").notNull(),
  filters: text(),
  metadata: text(),
  createdAt: integer("created_at"),
  updatedAt: integer("updated_at"),
});

export const userActivity = sqliteTable("user_activity", {
  id: text().primaryKey().notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),
  type: text().notNull(),
  itemId: text("item_id").references(() => menuItem.id, {
    onDelete: "set null",
  }),
  orderId: text("order_id").references(() => order.id, {
    onDelete: "set null",
  }),
  metadata: text(),
  createdAt: integer("created_at"),
  updatedAt: integer("updated_at"),
});

export const userMetrics = sqliteTable("user_metrics", {
  id: text().primaryKey().notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),
  totalOrders: integer("total_orders").default(0).notNull(),
  totalSpent: integer("total_spent").default(0).notNull(),
  averageOrderValue: integer("average_order_value").default(0).notNull(),
  lastOrderDate: integer("last_order_date"),
  favoriteCategories: text("favorite_categories"),
  metadata: text(),
  createdAt: integer("created_at"),
  updatedAt: integer("updated_at"),
});

export const account = sqliteTable("account", {
  id: text().primaryKey().notNull(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at"),
  refreshTokenExpiresAt: integer("refresh_token_expires_at"),
  scope: text(),
  password: text(),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const session = sqliteTable(
  "session",
  {
    id: text().primaryKey().notNull(),
    expiresAt: integer("expires_at").notNull(),
    token: text().notNull(),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    activeOrganizationId: text("active_organization_id"),
  },
  (table) => [uniqueIndex("session_token_unique").on(table.token)]
);

export const userTable = sqliteTable(
  "user_table",
  {
    id: text().primaryKey().notNull(),
    name: text().notNull(),
    email: text().notNull(),
    emailVerified: integer("email_verified").notNull(),
    image: text(),
    tokens: integer(),
    credits: integer(),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [uniqueIndex("user_table_email_unique").on(table.email)]
);

export const verification = sqliteTable("verification", {
  id: text().primaryKey().notNull(),
  identifier: text().notNull(),
  value: text().notNull(),
  expiresAt: integer("expires_at").notNull(),
  createdAt: integer("created_at"),
  updatedAt: integer("updated_at"),
});

export const cartItemOptions = sqliteTable("cart_item_options", {
  id: text().primaryKey().notNull(),
  cartItemId: text("cart_item_id").references(() => cartItems.id, {
    onDelete: "cascade",
  }),
  optionId: text("option_id").references(() => option.id, {
    onDelete: "cascade",
  }),
  optionGroupId: text("option_group_id").references(() => optionGroup.id, {
    onDelete: "cascade",
  }),
  quantity: integer().default(1),
  price: integer().notNull(),
});

export const cartItems = sqliteTable("cart_items", {
  id: text().primaryKey().notNull(),
  cartId: text("cart_id").references(() => carts.id, { onDelete: "cascade" }),
  menuItemId: text("menu_item_id").references(() => menuItem.id, {
    onDelete: "cascade",
  }),
  quantity: integer().default(1).notNull(),
  specialInstructions: text("special_instructions"),
  totalPrice: integer("total_price").notNull(),
  createdAt: integer("created_at"),
  updatedAt: integer("updated_at"),
});

export const carts = sqliteTable("carts", {
  id: text().primaryKey().notNull(),
  customerId: text("customer_id").references(() => userTable.id, {
    onDelete: "cascade",
  }),
  shopId: text("shop_id")
    .notNull()
    .references(() => shopTable.id),
  status: text().default("ACTIVE"),
  createdAt: integer("created_at"),
  updatedAt: integer("updated_at"),
});

export const deliveries = sqliteTable("deliveries", {
  id: text().primaryKey().notNull(),
  orderId: text("order_id").notNull(),
  riderId: text("rider_id"),
  zoneId: text("zone_id").references(() => deliveryZones.id),
  status: text().default("pending"),
  pickupAddress: text("pickup_address").notNull(),
  deliveryAddress: text("delivery_address").notNull(),
  actualDeliveryFee: real("actual_delivery_fee").notNull(),
  pickupTime: integer("pickup_time"),
  deliveryTime: integer("delivery_time"),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
  notes: text(),
});

export const deliveryZones = sqliteTable("deliveryZones", {
  id: text().primaryKey().notNull(),
  shopId: text("shop_id").references(() => shopTable.id),
  name: text().notNull(),
  coordinates: text().notNull(),
  baseDeliveryFee: real("base_delivery_fee").notNull(),
  minimumOrderValue: real("minimum_order_value").notNull(),
  estimatedDeliveryTime: integer("estimated_delivery_time").notNull(),
  isActive: integer("is_active").default(true),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const invitation = sqliteTable("invitation", {
  id: text().primaryKey().notNull(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => shopTable.id, { onDelete: "cascade" }),
  email: text().notNull(),
  role: text(),
  status: text().notNull(),
  expiresAt: integer("expires_at").notNull(),
  inviterId: text("inviter_id")
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),
});

export const member = sqliteTable("member", {
  id: text().primaryKey().notNull(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => shopTable.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),
  role: text().notNull(),
  createdAt: integer("created_at").notNull(),
});

export const shopAgreements = sqliteTable("shopAgreements", {
  id: text().primaryKey().notNull(),
  shopId: text("shop_id")
    .notNull()
    .references(() => shopTable.id, { onDelete: "cascade" }),
  agreementType: text("agreement_type").notNull(),
  version: text().notNull(),
  acceptedById: text("accepted_by_id").references(() => userTable.id),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: integer("created_at"),
  updatedAt: integer("updated_at"),
});

export const shopOperatingHours = sqliteTable(
  "shopOperatingHours",
  {
    id: text().notNull(),
    shopId: text("shop_id")
      .notNull()
      .references(() => shopTable.id),
    day: text().notNull(),
    openTime: text("open_time").notNull(),
    closeTime: text("close_time").notNull(),
    isOpen: integer("is_open").default(true),
    createdAt: integer("created_at"),
    updatedAt: integer("updated_at"),
  },
  (table) => [
    primaryKey({
      columns: [table.shopId, table.day],
      name: "shopOperatingHours_shop_id_day_pk",
    }),
  ]
);

export const shopPaymentMethod = sqliteTable(
  "shopPaymentMethod",
  {
    id: text(),
    shopId: text("shop_id")
      .notNull()
      .references(() => shopTable.id, { onDelete: "cascade" }),
    type: text().notNull(),
    accountNumber: text("account_number"),
    accountName: text("account_name"),
    bankName: text("bank_name"),
    paystackRecipientCode: text("paystack_recipient_code"),
    bankCode: text("bank_code"),
    createdAt: integer("created_at"),
    updatedAt: integer("updated_at"),
  },
  (table) => [
    primaryKey({
      columns: [table.shopId, table.accountNumber],
      name: "shopPaymentMethod_shop_id_account_number_pk",
    }),
  ]
);

export const shopTodo = sqliteTable("shopTodo", {
  id: text().primaryKey().notNull(),
  shopId: text("shop_id")
    .notNull()
    .references(() => shopTable.id, { onDelete: "cascade" }),
  storeInformationComplete: integer("store_information_complete").default(
    false
  ),
  uploadAtLeastOneMenu: integer("upload_at_least_one_menu").default(false),
  setUpPaymentMethod: integer("set_up_payment_method").default(false),
  reviewTermsAndConditions: integer("review_terms_and_conditions").default(
    false
  ),
  setUpOperatingHours: integer("set_up_operating_hours").default(false),
  createdAt: integer("created_at"),
  updatedAt: integer("updated_at"),
});

export const shopType = sqliteTable("shopType", {
  id: text().primaryKey().notNull(),
  name: text().notNull(),
  createdAt: integer("created_at"),
  updatedAt: integer("updated_at"),
});

export const menuCategory = sqliteTable("menuCategory", {
  id: text().primaryKey().notNull(),
  name: text().notNull(),
  published: integer().default(true).notNull(),
  shopId: text("shop_id")
    .notNull()
    .references(() => shopTable.id),
  createdAt: integer("created_at"),
  updatedAt: integer("updated_at"),
});

export const menuItemOptionGroups = sqliteTable(
  "menu_item_option_groups",
  {
    menuItemId: text("menu_item_id")
      .notNull()
      .references(() => menuItem.id, { onDelete: "cascade" }),
    optionGroupId: text("option_group_id")
      .notNull()
      .references(() => optionGroup.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").default(0),
  },
  (table) => [
    primaryKey({
      columns: [table.menuItemId, table.optionGroupId],
      name: "menu_item_option_groups_menu_item_id_option_group_id_pk",
    }),
  ]
);

export const menuItem = sqliteTable("menuItem", {
  id: text().primaryKey().notNull(),
  name: text().notNull(),
  description: text().notNull(),
  image: text(),
  price: integer().notNull(),
  priceDescription: text("price_description"),
  inStock: integer("in_stock").default(true),
  categoryId: text("category_id")
    .notNull()
    .references(() => menuCategory.id, { onDelete: "cascade" }),
  packId: text("pack_id").references(() => pack.id),
  shopId: text("shop_id")
    .notNull()
    .references(() => shopTable.id),
  createdAt: integer("created_at"),
  updatedAt: integer("updated_at"),
});

export const pack = sqliteTable("pack", {
  id: text().primaryKey().notNull(),
  name: text().notNull(),
  description: text().notNull(),
  price: integer().notNull(),
  shopId: text("shop_id")
    .notNull()
    .references(() => shopTable.id),
  userId: text("user_id").references(() => userTable.id),
  createdAt: integer("created_at"),
  updatedAt: integer("updated_at"),
});

export const optionGroup = sqliteTable("optionGroup", {
  id: text().primaryKey().notNull(),
  name: text().notNull(),
  minSelections: integer("min_selections").default(0).notNull(),
  maxSelections: integer("max_selections"),
  shopId: text("shop_id")
    .notNull()
    .references(() => shopTable.id),
  userId: text()
    .notNull()
    .references(() => userTable.id),
  createdAt: integer("created_at"),
  updatedAt: integer("updated_at"),
});

export const optionSelection = sqliteTable("optionSelection", {
  id: text().primaryKey().notNull(),
  optionId: text("option_id")
    .notNull()
    .references(() => option.id, { onDelete: "cascade" }),
  optionGroupId: text("option_group_id")
    .notNull()
    .references(() => optionGroup.id, { onDelete: "cascade" }),
  quantity: integer().default(1).notNull(),
  createdAt: integer("created_at"),
  updatedAt: integer("updated_at"),
});

export const option = sqliteTable("option", {
  id: text().primaryKey().notNull(),
  name: text().notNull(),
  price: integer().notNull(),
  inStock: integer().default(true).notNull(),
  shopId: text("shop_id")
    .notNull()
    .references(() => shopTable.id),
  userId: text().references(() => userTable.id),
  createdAt: integer("created_at"),
  updatedAt: integer("updated_at"),
});

export const optionToOptionGroup = sqliteTable(
  "optionToOptionGroup",
  {
    optionId: text("option_id")
      .notNull()
      .references(() => option.id, { onDelete: "cascade" }),
    optionGroupId: text("option_group_id")
      .notNull()
      .references(() => optionGroup.id, { onDelete: "cascade" }),
    createdAt: integer("created_at"),
    updatedAt: integer("updated_at"),
  },
  (table) => [
    primaryKey({
      columns: [table.optionId, table.optionGroupId],
      name: "optionToOptionGroup_option_id_option_group_id_pk",
    }),
  ]
);

export const promotionProducts = sqliteTable("promotion_products", {
  id: text().primaryKey().notNull(),
  promotionId: text("promotion_id").references(() => promotions.id),
  productId: text("product_id").notNull(),
  createdAt: integer("created_at"),
  updatedAt: integer("updated_at"),
});

export const promotions = sqliteTable(
  "promotions",
  {
    id: text().primaryKey().notNull(),
    shopId: text("shop_id").references(() => shopTable.id),
    name: text().notNull(),
    code: text().notNull(),
    description: text(),
    type: text().notNull(),
    value: real().notNull(),
    minOrderValue: real("min_order_value"),
    maxDiscount: real("max_discount"),
    buyQuantity: integer("buy_quantity"),
    getQuantity: integer("get_quantity"),
    startDate: integer("start_date").notNull(),
    endDate: integer("end_date").notNull(),
    usageLimit: integer("usage_limit"),
    usageCount: integer("usage_count").default(0),
    isActive: integer("is_active").default(true),
    createdAt: integer("created_at"),
    updatedAt: integer("updated_at"),
  },
  (table) => [uniqueIndex("promotions_code_unique").on(table.code)]
);

export const paymentMethod = sqliteTable("payment_method", {
  id: text().primaryKey().notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),
  type: text().notNull(),
  provider: text(),
  accountNumber: text("account_number"),
  expiryDate: text("expiry_date"),
  isDefault: integer("is_default").default(false),
  metadata: text(),
  createdAt: integer("created_at"),
  updatedAt: integer("updated_at"),
});

export const transaction = sqliteTable(
  "transaction",
  {
    id: text().primaryKey().notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    orderId: text("order_id").references(() => order.id, {
      onDelete: "set null",
    }),
    paymentMethodId: text("payment_method_id").references(
      () => paymentMethod.id,
      { onDelete: "set null" }
    ),
    amount: integer().notNull(),
    currency: text().default("USD").notNull(),
    status: text().notNull(),
    type: text().notNull(),
    reference: text(),
    description: text(),
    metadata: text(),
    createdAt: integer("created_at"),
    updatedAt: integer("updated_at"),
  },
  (table) => [uniqueIndex("transaction_reference_unique").on(table.reference)]
);

export const loyaltyPoints = sqliteTable("loyalty_points", {
  id: text().primaryKey().notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),
  shopId: text("shop_id").references(() => shopTable.id, {
    onDelete: "cascade",
  }),
  points: integer().default(0).notNull(),
  lifetimePoints: integer("lifetime_points").default(0).notNull(),
  tier: text().default("bronze"),
  lastEarnedAt: integer("last_earned_at"),
  metadata: text(),
  createdAt: integer("created_at"),
  updatedAt: integer("updated_at"),
});

export const loyaltyProgram = sqliteTable("loyalty_program", {
  id: text().primaryKey().notNull(),
  shopId: text("shop_id").references(() => shopTable.id, {
    onDelete: "cascade",
  }),
  name: text().notNull(),
  description: text(),
  pointsPerCurrency: integer("points_per_currency").default(1).notNull(),
  minimumPoints: integer("minimum_points").default(0).notNull(),
  active: integer().default(true),
  rules: text(),
  metadata: text(),
  createdAt: integer("created_at"),
  updatedAt: integer("updated_at"),
});

export const pointsTransaction = sqliteTable("points_transaction", {
  id: text().primaryKey().notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),
  shopId: text("shop_id").references(() => shopTable.id, {
    onDelete: "cascade",
  }),
  points: integer().notNull(),
  type: text().notNull(),
  description: text(),
  reference: text(),
  metadata: text(),
  createdAt: integer("created_at"),
  updatedAt: integer("updated_at"),
});

export const deviceToken = sqliteTable(
  "device_token",
  {
    id: text().primaryKey().notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    token: text().notNull(),
    type: text().notNull(),
    device: text(),
    lastUsedAt: integer("last_used_at"),
    metadata: text(),
    createdAt: integer("created_at"),
    updatedAt: integer("updated_at"),
  },
  (table) => [uniqueIndex("device_token_token_unique").on(table.token)]
);

export const notificationPreference = sqliteTable("notification_preference", {
  id: text().primaryKey().notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),
  type: text().notNull(),
  channel: text().notNull(),
  enabled: integer().default(true),
  metadata: text(),
  createdAt: integer("created_at"),
  updatedAt: integer("updated_at"),
});

export const notification = sqliteTable("notification", {
  id: text().primaryKey().notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),
  title: text().notNull(),
  body: text().notNull(),
  type: text().notNull(),
  priority: text().default("normal"),
  read: integer().default(false),
  readAt: integer("read_at"),
  actionUrl: text("action_url"),
  image: text(),
  metadata: text(),
  createdAt: integer("created_at"),
  updatedAt: integer("updated_at"),
});

export const orderItemOption = sqliteTable("orderItemOption", {
  id: text().primaryKey().notNull(),
  orderItemId: text("order_item_id")
    .notNull()
    .references(() => orderItem.id, { onDelete: "cascade" }),
  optionId: text("option_id").references(() => option.id),
  optionGroupId: text("option_group_id").references(() => optionGroup.id),
  optionName: text("option_name").notNull(),
  quantity: integer().default(1),
  price: real().notNull(),
  createdAt: integer("created_at"),
  updatedAt: integer("updated_at"),
});

export const orderItem = sqliteTable("orderItem", {
  id: text().primaryKey().notNull(),
  orderId: text("order_id")
    .notNull()
    .references(() => order.id, { onDelete: "cascade" }),
  menuItemId: text("menu_item_id").references(() => menuItem.id),
  menuItemName: text("menu_item_name").notNull(),
  quantity: integer().notNull(),
  unitPrice: real("unit_price").notNull(),
  totalPrice: real("total_price").notNull(),
  specialInstructions: text("special_instructions"),
  createdAt: integer("created_at"),
  updatedAt: integer("updated_at"),
});

export const order = sqliteTable("order", {
  id: text().primaryKey().notNull(),
  code: text().notNull(),
  customerId: text("customer_id").references(() => userTable.id),
  shopId: text()
    .notNull()
    .references(() => shopTable.id),
  riderId: text("rider_id").references(() => userTable.id),
  status: text().notNull(),
  cartId: text("cart_id")
    .notNull()
    .references(() => carts.id),
  deliveryAddressId: text("delivery_address_id").references(() => addresses.id),
  deliveryNotes: text("delivery_notes"),
  vendorNotes: text("vendor_notes"),
  contactPhone: text("contact_phone"),
  paymentMethod: text("payment_method").default("CARD").notNull(),
  paymentStatus: text("payment_status").notNull(),
  paymentTransactionId: text("payment_transaction_id"),
  subtotal: real().notNull(),
  deliveryFee: real("delivery_fee"),
  serviceFee: real("service_fee"),
  discount: real(),
  total: real().notNull(),
  acceptedAt: text("accepted_at"),
  preparedAt: text("prepared_at"),
  pickedUpAt: text("picked_up_at"),
  deliveredAt: text("delivered_at"),
  canceledAt: text("canceled_at"),
  cancelReason: text("cancel_reason"),
  refundAmount: real("refund_amount"),
  refundReason: text("refund_reason"),
  createdAt: integer("created_at"),
  updatedAt: integer("updated_at"),
});

export const riders = sqliteTable("riders", {
  id: text()
    .primaryKey()
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),
  vehicleType: text("vehicle_type"),
  licensePlate: text("license_plate"),
  idDocument: text("id_document"),
  currentLocation: text("current_location"),
  status: text().default("offline"),
  rating: integer(),
  isVerified: integer("is_verified").default(false),
  bankInfo: text("bank_info"),
  activeArea: text("active_area"),
  maxDeliveryDistance: integer("max_delivery_distance").default(10000),
});

export const shopTable = sqliteTable(
  "shop_table",
  {
    id: text().primaryKey().notNull(),
    slug: text(),
    name: text().notNull(),
    email: text(),
    shopType: text("shop_type").references(() => shopType.id),
    website: text(),
    description: text(),
    metadata: text(),
    phoneNumber: text("phone_number"),
    address: text(),
    commission: integer().default(10),
    minimumOrderAmount: integer("minimum_order_amount").default(0),
    active: integer().default(false),
    status: text().default("PENDING"),
    logo: text(),
    coverImage: text("cover_image"),
    averageRating: integer("average_rating"),
    totalRatings: integer("total_ratings").default(0),
    featuredPosition: integer("featured_position"),
    tags: text(),
    bankInfo: text("bank_info"),
    deliveryType: text("delivery_type"),
    latitude: real(),
    longitude: real(),
    addressName: text("address_name"),
    isVerified: integer("is_verified").default(false),
    createdAt: integer("created_at"),
    updatedAt: integer("updated_at"),
  },
  (table) => [
    index("shop_type_idx").on(table.shopType),
    index("location_idx").on(table.latitude, table.longitude),
    uniqueIndex("shop_table_slug_unique").on(table.slug),
  ]
);
