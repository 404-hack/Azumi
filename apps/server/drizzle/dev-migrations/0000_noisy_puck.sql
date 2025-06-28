CREATE TABLE "addresses" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"address" text NOT NULL,
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"is_default" boolean DEFAULT false,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "search_history" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"query" text NOT NULL,
	"result_count" integer NOT NULL,
	"filters" json,
	"metadata" json,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "user_activity" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"item_id" text,
	"order_id" text,
	"metadata" json,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "user_metrics" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"total_orders" integer DEFAULT 0 NOT NULL,
	"total_spent" integer DEFAULT 0 NOT NULL,
	"average_order_value" integer DEFAULT 0 NOT NULL,
	"last_order_date" timestamp,
	"favorite_categories" json,
	"metadata" json,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"active_organization_id" text,
	"impersonated_by" text,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user_table" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean NOT NULL,
	"image" text,
	"phone_number" text,
	"phone_number_verified" boolean,
	"tokens" integer,
	"credits" integer,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"role" text DEFAULT 'user',
	"banned" boolean DEFAULT false,
	"ban_reason" text,
	"ban_expires" timestamp,
	CONSTRAINT "user_table_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "cart_item_options" (
	"id" text PRIMARY KEY NOT NULL,
	"cart_item_id" text,
	"option_id" text,
	"option_group_id" text,
	"quantity" integer DEFAULT 1,
	"price" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cart_items" (
	"id" text PRIMARY KEY NOT NULL,
	"cart_id" text,
	"menu_item_id" text,
	"options_hash" text DEFAULT 'no-options' NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"special_instructions" text,
	"total_price" integer NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "carts" (
	"id" text PRIMARY KEY NOT NULL,
	"customer_id" text,
	"shop_id" text NOT NULL,
	"status" text DEFAULT 'ACTIVE',
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "deliveries" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"rider_id" text,
	"zone_id" text,
	"status" text DEFAULT 'pending',
	"pickup_address" text NOT NULL,
	"delivery_address" text NOT NULL,
	"actual_delivery_fee" integer NOT NULL,
	"pickup_time" timestamp,
	"delivery_time" timestamp,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "deliveryZones" (
	"id" text PRIMARY KEY NOT NULL,
	"shop_id" text,
	"name" text NOT NULL,
	"coordinates" json NOT NULL,
	"base_delivery_fee" integer NOT NULL,
	"minimum_order_value" integer NOT NULL,
	"estimated_delivery_time" integer NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "favorite_table" (
	"user_id" text NOT NULL,
	"shop_id" text NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp,
	CONSTRAINT "favorite_table_user_id_shop_id_pk" PRIMARY KEY("user_id","shop_id")
);
--> statement-breakpoint
CREATE TABLE "invitation" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"email" text NOT NULL,
	"role" text,
	"status" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"inviter_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "member" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shopAgreements" (
	"id" text PRIMARY KEY NOT NULL,
	"shop_id" text NOT NULL,
	"agreement_type" text NOT NULL,
	"version" text NOT NULL,
	"accepted_by_id" text,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "shopOperatingHours" (
	"id" text NOT NULL,
	"shop_id" text NOT NULL,
	"day" text NOT NULL,
	"open_time" text NOT NULL,
	"close_time" text NOT NULL,
	"is_open" boolean DEFAULT true,
	"created_at" timestamp,
	"updated_at" timestamp,
	CONSTRAINT "shopOperatingHours_shop_id_day_pk" PRIMARY KEY("shop_id","day")
);
--> statement-breakpoint
CREATE TABLE "shopPaymentMethod" (
	"id" text,
	"shop_id" text NOT NULL,
	"type" text NOT NULL,
	"account_number" text,
	"account_name" text,
	"bank_name" text,
	"paystack_recipient_code" text,
	"bank_code" text,
	"created_at" timestamp,
	"updated_at" timestamp,
	CONSTRAINT "shopPaymentMethod_account_number_shop_id_pk" PRIMARY KEY("account_number","shop_id")
);
--> statement-breakpoint
CREATE TABLE "shop_table" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text,
	"name" text NOT NULL,
	"email" text,
	"shop_type" text,
	"website" text,
	"description" text,
	"metadata" json,
	"phone_number" text,
	"address" text,
	"commission" integer DEFAULT 0,
	"minimum_order_amount" integer DEFAULT 500,
	"active" boolean DEFAULT false,
	"status" text DEFAULT 'DRAFT',
	"logo" text,
	"cover_image" text,
	"average_rating" integer,
	"total_ratings" integer DEFAULT 0,
	"featured_position" integer,
	"tags" text[],
	"bank_info" json,
	"delivery_type" text,
	"latitude" double precision,
	"longitude" double precision,
	"address_name" text,
	"is_verified" boolean DEFAULT false,
	"ownership_type" text DEFAULT 'OFFICIAL',
	"created_at" timestamp,
	"updated_at" timestamp,
	CONSTRAINT "shop_table_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "shopTodo" (
	"id" text PRIMARY KEY NOT NULL,
	"shop_id" text NOT NULL,
	"store_information_complete" boolean DEFAULT false,
	"upload_at_least_one_menu" boolean DEFAULT false,
	"set_up_payment_method" boolean DEFAULT false,
	"review_terms_and_conditions" boolean DEFAULT false,
	"set_up_operating_hours" boolean DEFAULT false,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "shopType" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "menuCategory" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"published" boolean DEFAULT true NOT NULL,
	"shop_id" text NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "menu_item_option_groups" (
	"menu_item_id" text NOT NULL,
	"option_group_id" text NOT NULL,
	"sort_order" integer DEFAULT 0,
	CONSTRAINT "menu_item_option_groups_menu_item_id_option_group_id_pk" PRIMARY KEY("menu_item_id","option_group_id")
);
--> statement-breakpoint
CREATE TABLE "menuItem" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"image_url" text,
	"price" integer NOT NULL,
	"price_description" text,
	"in_stock" boolean DEFAULT true,
	"category_id" text NOT NULL,
	"pack_id" text,
	"shop_id" text NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "pack" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"price" integer NOT NULL,
	"shop_id" text NOT NULL,
	"user_id" text,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "optionGroup" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"min_selections" integer DEFAULT 0 NOT NULL,
	"max_selections" integer,
	"shop_id" text NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "optionSelection" (
	"id" text PRIMARY KEY NOT NULL,
	"option_id" text NOT NULL,
	"option_group_id" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "option" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"price" integer NOT NULL,
	"in_stock" boolean DEFAULT true NOT NULL,
	"shop_id" text NOT NULL,
	"user_id" text,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "optionToOptionGroup" (
	"option_id" text NOT NULL,
	"option_group_id" text NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp,
	CONSTRAINT "optionToOptionGroup_option_id_option_group_id_pk" PRIMARY KEY("option_id","option_group_id")
);
--> statement-breakpoint
CREATE TABLE "promotion_products" (
	"id" text PRIMARY KEY NOT NULL,
	"promotion_id" text,
	"product_id" text NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "promotion_shops" (
	"id" text PRIMARY KEY NOT NULL,
	"promotion_id" text NOT NULL,
	"shop_id" text NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "promotions" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"description" text,
	"type" text NOT NULL,
	"value" integer NOT NULL,
	"min_order_value" integer,
	"max_discount" integer,
	"buy_quantity" integer,
	"get_quantity" integer,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"usage_limit" integer,
	"usage_count" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"is_first_order_only" boolean DEFAULT false,
	"applies_to_all_shops" boolean DEFAULT false,
	"cost_bearer" text DEFAULT 'PLATFORM' NOT NULL,
	"created_by" text NOT NULL,
	"creator_type" text NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp,
	CONSTRAINT "promotions_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "payment_method" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"provider" text,
	"account_number" text,
	"expiry_date" text,
	"is_default" boolean DEFAULT false,
	"metadata" json,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "rider_transaction" (
	"id" text PRIMARY KEY NOT NULL,
	"rider_id" text NOT NULL,
	"order_id" text,
	"delivery_fee" integer NOT NULL,
	"distance_bonus" integer DEFAULT 0,
	"peak_time_bonus" integer DEFAULT 0,
	"tip_amount" integer DEFAULT 0,
	"platform_fee" integer DEFAULT 0,
	"net_amount" integer NOT NULL,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'NGN' NOT NULL,
	"status" text NOT NULL,
	"type" text NOT NULL,
	"reference" text,
	"description" text,
	"metadata" json,
	"created_at" timestamp,
	"updated_at" timestamp,
	CONSTRAINT "rider_transaction_reference_unique" UNIQUE("reference")
);
--> statement-breakpoint
CREATE TABLE "vendor_transaction" (
	"id" text PRIMARY KEY NOT NULL,
	"shop_id" text NOT NULL,
	"order_id" text,
	"gross_amount" integer NOT NULL,
	"commission_rate" integer NOT NULL,
	"commission_amount" integer NOT NULL,
	"net_amount" integer NOT NULL,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'NGN' NOT NULL,
	"status" text NOT NULL,
	"type" text NOT NULL,
	"reference" text,
	"description" text,
	"metadata" json,
	"created_at" timestamp,
	"updated_at" timestamp,
	CONSTRAINT "vendor_transaction_reference_unique" UNIQUE("reference")
);
--> statement-breakpoint
CREATE TABLE "loyalty_points" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"shop_id" text,
	"points" integer DEFAULT 0 NOT NULL,
	"lifetime_points" integer DEFAULT 0 NOT NULL,
	"tier" text DEFAULT 'bronze',
	"last_earned_at" timestamp,
	"metadata" json,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "loyalty_program" (
	"id" text PRIMARY KEY NOT NULL,
	"shop_id" text,
	"name" text NOT NULL,
	"description" text,
	"points_per_currency" integer DEFAULT 1 NOT NULL,
	"minimum_points" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true,
	"rules" json,
	"metadata" json,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "points_transaction" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"shop_id" text,
	"points" integer NOT NULL,
	"type" text NOT NULL,
	"description" text,
	"reference" text,
	"metadata" json,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "device_token" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"token" text NOT NULL,
	"type" text NOT NULL,
	"device" text,
	"last_used_at" timestamp,
	"metadata" json,
	"created_at" timestamp,
	"updated_at" timestamp,
	CONSTRAINT "device_token_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "notification" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"type" text NOT NULL,
	"priority" text DEFAULT 'normal',
	"read" boolean DEFAULT false,
	"read_at" timestamp,
	"action_url" text,
	"image" text,
	"metadata" json,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "notification_log" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"token" text,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"data" json,
	"message_id" text,
	"status" text NOT NULL,
	"error_message" text,
	"sent_at" timestamp NOT NULL,
	"delivered_at" timestamp,
	"clicked_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "push_token" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"token" text NOT NULL,
	"device_id" text,
	"device_type" text,
	"user_agent" text,
	"provider" text DEFAULT 'fcm' NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"last_used_at" timestamp,
	CONSTRAINT "push_token_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "topic_subscription" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"topic" text NOT NULL,
	"is_subscribed" boolean DEFAULT true,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orderItemOption" (
	"id" text PRIMARY KEY NOT NULL,
	"order_item_id" text NOT NULL,
	"option_id" text,
	"option_group_id" text,
	"option_name" text NOT NULL,
	"quantity" integer DEFAULT 1,
	"price" integer NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "orderItem" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"menu_item_id" text,
	"menu_item_name" text NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price" integer NOT NULL,
	"total_price" integer NOT NULL,
	"special_instructions" text,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "order" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text,
	"customer_id" text,
	"shop_id" text NOT NULL,
	"rider_id" text,
	"rider_confirmation_code" integer NOT NULL,
	"status" text NOT NULL,
	"cart_id" text NOT NULL,
	"address_name" text DEFAULT '' NOT NULL,
	"longitude" double precision NOT NULL,
	"latitude" double precision NOT NULL,
	"delivery_notes" text,
	"vendor_notes" text,
	"payment_method" text DEFAULT 'CARD' NOT NULL,
	"payment_status" text NOT NULL,
	"payment_transaction_id" text,
	"subtotal" integer NOT NULL,
	"delivery_fee" integer DEFAULT 0,
	"service_fee" integer DEFAULT 0,
	"discount" integer DEFAULT 0,
	"total" integer NOT NULL,
	"payment_confirmed_at" text,
	"accepted_at" text,
	"prepared_at" text,
	"rider_assigned_at" text,
	"picked_up_at" text,
	"delivered_at" text,
	"canceled_at" text,
	"cancel_reason" text,
	"refund_amount" integer DEFAULT 0,
	"refund_reason" text,
	"refund_status" text,
	"refund_reference" text,
	"refunded_at" text,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "rider_payment_methods" (
	"id" text PRIMARY KEY NOT NULL,
	"rider_id" text NOT NULL,
	"type" text DEFAULT 'BANK_TRANSFER',
	"account_number" text NOT NULL,
	"account_name" text NOT NULL,
	"bank_name" text NOT NULL,
	"bank_code" text NOT NULL,
	"paystack_recipient_code" text,
	"created_at" timestamp,
	"updated_at" timestamp,
	CONSTRAINT "rider_payment_methods_rider_id_unique" UNIQUE("rider_id")
);
--> statement-breakpoint
CREATE TABLE "riders" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"first_name" text,
	"last_name" text,
	"email" text,
	"address" text,
	"longitude" double precision,
	"latitude" double precision,
	"address_name" text,
	"vehicle_type" text,
	"vehicle_license" text,
	"identification_document" text,
	"application_status" text DEFAULT 'DRAFT',
	"active" boolean DEFAULT false,
	"availability_status" text DEFAULT 'AVAILABLE',
	"rating" double precision DEFAULT 0,
	"total_ratings" integer DEFAULT 0,
	"max_delivery_distance" integer DEFAULT 10,
	"current_lat" double precision,
	"current_lng" double precision,
	"created_at" timestamp,
	"updated_at" timestamp,
	CONSTRAINT "riders_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text,
	"user_id" text,
	"shop_id" text,
	"rider_id" text,
	"food_rating" integer,
	"delivery_rating" integer,
	"comment" text,
	"images" json,
	"reply" text,
	"reply_at" timestamp,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_user_id_user_table_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_table"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "search_history" ADD CONSTRAINT "search_history_user_id_user_table_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_table"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_activity" ADD CONSTRAINT "user_activity_user_id_user_table_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_table"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_activity" ADD CONSTRAINT "user_activity_item_id_menuItem_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."menuItem"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_activity" ADD CONSTRAINT "user_activity_order_id_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."order"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_metrics" ADD CONSTRAINT "user_metrics_user_id_user_table_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_table"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_table_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_table"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_table_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_table"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_item_options" ADD CONSTRAINT "cart_item_options_cart_item_id_cart_items_id_fk" FOREIGN KEY ("cart_item_id") REFERENCES "public"."cart_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_item_options" ADD CONSTRAINT "cart_item_options_option_id_option_id_fk" FOREIGN KEY ("option_id") REFERENCES "public"."option"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_item_options" ADD CONSTRAINT "cart_item_options_option_group_id_optionGroup_id_fk" FOREIGN KEY ("option_group_id") REFERENCES "public"."optionGroup"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cart_id_carts_id_fk" FOREIGN KEY ("cart_id") REFERENCES "public"."carts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_menu_item_id_menuItem_id_fk" FOREIGN KEY ("menu_item_id") REFERENCES "public"."menuItem"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "carts" ADD CONSTRAINT "carts_customer_id_user_table_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."user_table"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "carts" ADD CONSTRAINT "carts_shop_id_shop_table_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shop_table"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_zone_id_deliveryZones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."deliveryZones"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliveryZones" ADD CONSTRAINT "deliveryZones_shop_id_shop_table_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shop_table"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorite_table" ADD CONSTRAINT "favorite_table_user_id_user_table_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_table"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorite_table" ADD CONSTRAINT "favorite_table_shop_id_shop_table_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shop_table"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_organization_id_shop_table_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."shop_table"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_inviter_id_user_table_id_fk" FOREIGN KEY ("inviter_id") REFERENCES "public"."user_table"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_organization_id_shop_table_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."shop_table"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_user_id_user_table_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_table"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shopAgreements" ADD CONSTRAINT "shopAgreements_shop_id_shop_table_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shop_table"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shopAgreements" ADD CONSTRAINT "shopAgreements_accepted_by_id_user_table_id_fk" FOREIGN KEY ("accepted_by_id") REFERENCES "public"."user_table"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shopOperatingHours" ADD CONSTRAINT "shopOperatingHours_shop_id_shop_table_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shop_table"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shopPaymentMethod" ADD CONSTRAINT "shopPaymentMethod_shop_id_shop_table_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shop_table"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_table" ADD CONSTRAINT "shop_table_shop_type_shopType_id_fk" FOREIGN KEY ("shop_type") REFERENCES "public"."shopType"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shopTodo" ADD CONSTRAINT "shopTodo_shop_id_shop_table_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shop_table"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menuCategory" ADD CONSTRAINT "menuCategory_shop_id_shop_table_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shop_table"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_item_option_groups" ADD CONSTRAINT "menu_item_option_groups_menu_item_id_menuItem_id_fk" FOREIGN KEY ("menu_item_id") REFERENCES "public"."menuItem"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_item_option_groups" ADD CONSTRAINT "menu_item_option_groups_option_group_id_optionGroup_id_fk" FOREIGN KEY ("option_group_id") REFERENCES "public"."optionGroup"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menuItem" ADD CONSTRAINT "menuItem_category_id_menuCategory_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."menuCategory"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menuItem" ADD CONSTRAINT "menuItem_pack_id_pack_id_fk" FOREIGN KEY ("pack_id") REFERENCES "public"."pack"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menuItem" ADD CONSTRAINT "menuItem_shop_id_shop_table_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shop_table"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pack" ADD CONSTRAINT "pack_shop_id_shop_table_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shop_table"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pack" ADD CONSTRAINT "pack_user_id_user_table_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_table"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "optionGroup" ADD CONSTRAINT "optionGroup_shop_id_shop_table_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shop_table"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "optionGroup" ADD CONSTRAINT "optionGroup_user_id_user_table_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_table"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "optionSelection" ADD CONSTRAINT "optionSelection_option_id_option_id_fk" FOREIGN KEY ("option_id") REFERENCES "public"."option"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "optionSelection" ADD CONSTRAINT "optionSelection_option_group_id_optionGroup_id_fk" FOREIGN KEY ("option_group_id") REFERENCES "public"."optionGroup"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "option" ADD CONSTRAINT "option_shop_id_shop_table_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shop_table"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "option" ADD CONSTRAINT "option_user_id_user_table_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_table"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "optionToOptionGroup" ADD CONSTRAINT "optionToOptionGroup_option_id_option_id_fk" FOREIGN KEY ("option_id") REFERENCES "public"."option"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "optionToOptionGroup" ADD CONSTRAINT "optionToOptionGroup_option_group_id_optionGroup_id_fk" FOREIGN KEY ("option_group_id") REFERENCES "public"."optionGroup"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion_products" ADD CONSTRAINT "promotion_products_promotion_id_promotions_id_fk" FOREIGN KEY ("promotion_id") REFERENCES "public"."promotions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion_shops" ADD CONSTRAINT "promotion_shops_promotion_id_promotions_id_fk" FOREIGN KEY ("promotion_id") REFERENCES "public"."promotions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion_shops" ADD CONSTRAINT "promotion_shops_shop_id_shop_table_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shop_table"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotions" ADD CONSTRAINT "promotions_created_by_user_table_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user_table"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_method" ADD CONSTRAINT "payment_method_user_id_user_table_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_table"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rider_transaction" ADD CONSTRAINT "rider_transaction_rider_id_user_table_id_fk" FOREIGN KEY ("rider_id") REFERENCES "public"."user_table"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rider_transaction" ADD CONSTRAINT "rider_transaction_order_id_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."order"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_transaction" ADD CONSTRAINT "vendor_transaction_shop_id_shop_table_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shop_table"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_transaction" ADD CONSTRAINT "vendor_transaction_order_id_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."order"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loyalty_points" ADD CONSTRAINT "loyalty_points_user_id_user_table_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_table"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loyalty_points" ADD CONSTRAINT "loyalty_points_shop_id_shop_table_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shop_table"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loyalty_program" ADD CONSTRAINT "loyalty_program_shop_id_shop_table_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shop_table"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "points_transaction" ADD CONSTRAINT "points_transaction_user_id_user_table_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_table"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "points_transaction" ADD CONSTRAINT "points_transaction_shop_id_shop_table_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shop_table"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "device_token" ADD CONSTRAINT "device_token_user_id_user_table_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_table"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_user_id_user_table_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_table"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_log" ADD CONSTRAINT "notification_log_user_id_user_table_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_table"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_token" ADD CONSTRAINT "push_token_user_id_user_table_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_table"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topic_subscription" ADD CONSTRAINT "topic_subscription_user_id_user_table_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_table"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orderItemOption" ADD CONSTRAINT "orderItemOption_order_item_id_orderItem_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "public"."orderItem"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orderItemOption" ADD CONSTRAINT "orderItemOption_option_id_option_id_fk" FOREIGN KEY ("option_id") REFERENCES "public"."option"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orderItemOption" ADD CONSTRAINT "orderItemOption_option_group_id_optionGroup_id_fk" FOREIGN KEY ("option_group_id") REFERENCES "public"."optionGroup"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orderItem" ADD CONSTRAINT "orderItem_order_id_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."order"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orderItem" ADD CONSTRAINT "orderItem_menu_item_id_menuItem_id_fk" FOREIGN KEY ("menu_item_id") REFERENCES "public"."menuItem"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order" ADD CONSTRAINT "order_customer_id_user_table_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."user_table"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order" ADD CONSTRAINT "order_shop_id_shop_table_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shop_table"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order" ADD CONSTRAINT "order_rider_id_user_table_id_fk" FOREIGN KEY ("rider_id") REFERENCES "public"."user_table"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order" ADD CONSTRAINT "order_cart_id_carts_id_fk" FOREIGN KEY ("cart_id") REFERENCES "public"."carts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rider_payment_methods" ADD CONSTRAINT "rider_payment_methods_rider_id_riders_id_fk" FOREIGN KEY ("rider_id") REFERENCES "public"."riders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "riders" ADD CONSTRAINT "riders_user_id_user_table_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_table"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_order_id_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."order"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_user_table_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_table"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_shop_id_shop_table_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shop_table"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_rider_id_riders_id_fk" FOREIGN KEY ("rider_id") REFERENCES "public"."riders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "location_idx" ON "shop_table" USING btree ("latitude","longitude");--> statement-breakpoint
CREATE INDEX "shop_type_idx" ON "shop_table" USING btree ("shop_type");--> statement-breakpoint
CREATE INDEX "notification_log_user_id_idx" ON "notification_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notification_log_status_idx" ON "notification_log" USING btree ("status");--> statement-breakpoint
CREATE INDEX "notification_log_sent_at_idx" ON "notification_log" USING btree ("sent_at");--> statement-breakpoint
CREATE INDEX "push_token_user_id_idx" ON "push_token" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "push_token_token_idx" ON "push_token" USING btree ("token");--> statement-breakpoint
CREATE INDEX "push_token_active_idx" ON "push_token" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "push_token_provider_idx" ON "push_token" USING btree ("provider");--> statement-breakpoint
CREATE INDEX "topic_subscription_user_topic_idx" ON "topic_subscription" USING btree ("user_id","topic");--> statement-breakpoint
CREATE INDEX "topic_subscription_topic_idx" ON "topic_subscription" USING btree ("topic");