CREATE TABLE `addresses` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`address` text NOT NULL,
	`latitude` integer NOT NULL,
	`longitude` integer NOT NULL,
	`is_default` integer DEFAULT false,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `user_table`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `search_history` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`query` text NOT NULL,
	`result_count` integer NOT NULL,
	`filters` text,
	`metadata` text,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `user_table`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user_activity` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`item_id` text,
	`order_id` text,
	`metadata` text,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `user_table`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`item_id`) REFERENCES `menuItem`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`order_id`) REFERENCES `order`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `user_metrics` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`total_orders` integer DEFAULT 0 NOT NULL,
	`total_spent` integer DEFAULT 0 NOT NULL,
	`average_order_value` integer DEFAULT 0 NOT NULL,
	`last_order_date` integer,
	`favorite_categories` text,
	`metadata` text,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `user_table`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user_table`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	`active_organization_id` text,
	FOREIGN KEY (`user_id`) REFERENCES `user_table`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE TABLE `user_table` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer NOT NULL,
	`image` text,
	`tokens` integer,
	`credits` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_table_email_unique` ON `user_table` (`email`);--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `cart_item_options` (
	`id` text PRIMARY KEY NOT NULL,
	`cart_item_id` text,
	`option_id` text,
	`option_group_id` text,
	`quantity` integer DEFAULT 1,
	`price` integer NOT NULL,
	FOREIGN KEY (`cart_item_id`) REFERENCES `cart_items`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`option_id`) REFERENCES `option`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`option_group_id`) REFERENCES `optionGroup`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `cart_items` (
	`id` text PRIMARY KEY NOT NULL,
	`cart_id` text,
	`menu_item_id` text,
	`options_hash` text DEFAULT 'no-options' NOT NULL,
	`quantity` integer DEFAULT 1 NOT NULL,
	`special_instructions` text,
	`total_price` integer NOT NULL,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`cart_id`) REFERENCES `carts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`menu_item_id`) REFERENCES `menuItem`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `carts` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_id` text,
	`shop_id` text NOT NULL,
	`status` text DEFAULT 'ACTIVE',
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`customer_id`) REFERENCES `user_table`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`shop_id`) REFERENCES `shop_table`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `deliveries` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`rider_id` text,
	`zone_id` text,
	`status` text DEFAULT 'pending',
	`pickup_address` text NOT NULL,
	`delivery_address` text NOT NULL,
	`actual_delivery_fee` real NOT NULL,
	`pickup_time` integer,
	`delivery_time` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`notes` text,
	FOREIGN KEY (`zone_id`) REFERENCES `deliveryZones`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `deliveryZones` (
	`id` text PRIMARY KEY NOT NULL,
	`shop_id` text,
	`name` text NOT NULL,
	`coordinates` text NOT NULL,
	`base_delivery_fee` real NOT NULL,
	`minimum_order_value` real NOT NULL,
	`estimated_delivery_time` integer NOT NULL,
	`is_active` integer DEFAULT true,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`shop_id`) REFERENCES `shop_table`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `favorite_table` (
	`user_id` text NOT NULL,
	`shop_id` text NOT NULL,
	`created_at` integer,
	`updated_at` integer,
	PRIMARY KEY(`user_id`, `shop_id`),
	FOREIGN KEY (`user_id`) REFERENCES `user_table`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`shop_id`) REFERENCES `shop_table`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `invitation` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`email` text NOT NULL,
	`role` text,
	`status` text NOT NULL,
	`expires_at` integer NOT NULL,
	`inviter_id` text NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `shop_table`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`inviter_id`) REFERENCES `user_table`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `member` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `shop_table`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user_table`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `shopAgreements` (
	`id` text PRIMARY KEY NOT NULL,
	`shop_id` text NOT NULL,
	`agreement_type` text NOT NULL,
	`version` text NOT NULL,
	`accepted_by_id` text,
	`ip_address` text,
	`user_agent` text,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`shop_id`) REFERENCES `shop_table`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`accepted_by_id`) REFERENCES `user_table`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `shopOperatingHours` (
	`id` text NOT NULL,
	`shop_id` text NOT NULL,
	`day` text NOT NULL,
	`open_time` text NOT NULL,
	`close_time` text NOT NULL,
	`is_open` integer DEFAULT true,
	`created_at` integer,
	`updated_at` integer,
	PRIMARY KEY(`shop_id`, `day`),
	FOREIGN KEY (`shop_id`) REFERENCES `shop_table`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `shopPaymentMethod` (
	`id` text,
	`shop_id` text NOT NULL,
	`type` text NOT NULL,
	`account_number` text,
	`account_name` text,
	`bank_name` text,
	`paystack_recipient_code` text,
	`bank_code` text,
	`created_at` integer,
	`updated_at` integer,
	PRIMARY KEY(`account_number`, `shop_id`),
	FOREIGN KEY (`shop_id`) REFERENCES `shop_table`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `shop_table` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text,
	`name` text NOT NULL,
	`email` text,
	`shop_type` text,
	`website` text,
	`description` text,
	`metadata` text,
	`phone_number` text,
	`address` text,
	`commission` integer DEFAULT 10,
	`minimum_order_amount` integer DEFAULT 0,
	`active` integer DEFAULT false,
	`status` text DEFAULT 'PENDING',
	`logo` text,
	`cover_image` text,
	`average_rating` integer,
	`total_ratings` integer DEFAULT 0,
	`featured_position` integer,
	`tags` text,
	`bank_info` text,
	`delivery_type` text,
	`latitude` real,
	`longitude` real,
	`address_name` text,
	`is_verified` integer DEFAULT false,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`shop_type`) REFERENCES `shopType`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `shop_table_slug_unique` ON `shop_table` (`slug`);--> statement-breakpoint
CREATE INDEX `location_idx` ON `shop_table` (`latitude`,`longitude`);--> statement-breakpoint
CREATE INDEX `shop_type_idx` ON `shop_table` (`shop_type`);--> statement-breakpoint
CREATE TABLE `shopTodo` (
	`id` text PRIMARY KEY NOT NULL,
	`shop_id` text NOT NULL,
	`store_information_complete` integer DEFAULT false,
	`upload_at_least_one_menu` integer DEFAULT false,
	`set_up_payment_method` integer DEFAULT false,
	`review_terms_and_conditions` integer DEFAULT false,
	`set_up_operating_hours` integer DEFAULT false,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`shop_id`) REFERENCES `shop_table`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `shopType` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `menuCategory` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`published` integer DEFAULT true NOT NULL,
	`shop_id` text NOT NULL,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`shop_id`) REFERENCES `shop_table`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `menu_item_option_groups` (
	`menu_item_id` text NOT NULL,
	`option_group_id` text NOT NULL,
	`sort_order` integer DEFAULT 0,
	PRIMARY KEY(`menu_item_id`, `option_group_id`),
	FOREIGN KEY (`menu_item_id`) REFERENCES `menuItem`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`option_group_id`) REFERENCES `optionGroup`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `menuItem` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`image` text,
	`price` integer NOT NULL,
	`price_description` text,
	`in_stock` integer DEFAULT true,
	`category_id` text NOT NULL,
	`pack_id` text,
	`shop_id` text NOT NULL,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`category_id`) REFERENCES `menuCategory`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`pack_id`) REFERENCES `pack`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`shop_id`) REFERENCES `shop_table`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `pack` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`price` integer NOT NULL,
	`shop_id` text NOT NULL,
	`user_id` text,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`shop_id`) REFERENCES `shop_table`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `user_table`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `optionGroup` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`min_selections` integer DEFAULT 0 NOT NULL,
	`max_selections` integer,
	`shop_id` text NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`shop_id`) REFERENCES `shop_table`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `user_table`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `optionSelection` (
	`id` text PRIMARY KEY NOT NULL,
	`option_id` text NOT NULL,
	`option_group_id` text NOT NULL,
	`quantity` integer DEFAULT 1 NOT NULL,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`option_id`) REFERENCES `option`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`option_group_id`) REFERENCES `optionGroup`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `option` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`price` integer NOT NULL,
	`in_stock` integer DEFAULT true NOT NULL,
	`shop_id` text NOT NULL,
	`user_id` text,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`shop_id`) REFERENCES `shop_table`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `user_table`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `optionToOptionGroup` (
	`option_id` text NOT NULL,
	`option_group_id` text NOT NULL,
	`created_at` integer,
	`updated_at` integer,
	PRIMARY KEY(`option_id`, `option_group_id`),
	FOREIGN KEY (`option_id`) REFERENCES `option`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`option_group_id`) REFERENCES `optionGroup`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `promotion_products` (
	`id` text PRIMARY KEY NOT NULL,
	`promotion_id` text,
	`product_id` text NOT NULL,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`promotion_id`) REFERENCES `promotions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `promotions` (
	`id` text PRIMARY KEY NOT NULL,
	`shop_id` text,
	`name` text NOT NULL,
	`code` text NOT NULL,
	`description` text,
	`type` text NOT NULL,
	`value` real NOT NULL,
	`min_order_value` real,
	`max_discount` real,
	`buy_quantity` integer,
	`get_quantity` integer,
	`start_date` integer NOT NULL,
	`end_date` integer NOT NULL,
	`usage_limit` integer,
	`usage_count` integer DEFAULT 0,
	`is_active` integer DEFAULT true,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`shop_id`) REFERENCES `shop_table`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `promotions_code_unique` ON `promotions` (`code`);--> statement-breakpoint
CREATE TABLE `payment_method` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`provider` text,
	`account_number` text,
	`expiry_date` text,
	`is_default` integer DEFAULT false,
	`metadata` text,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `user_table`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `transaction` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`order_id` text,
	`payment_method_id` text,
	`amount` integer NOT NULL,
	`currency` text DEFAULT 'USD' NOT NULL,
	`status` text NOT NULL,
	`type` text NOT NULL,
	`reference` text,
	`description` text,
	`metadata` text,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `user_table`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`order_id`) REFERENCES `order`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`payment_method_id`) REFERENCES `payment_method`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `transaction_reference_unique` ON `transaction` (`reference`);--> statement-breakpoint
CREATE TABLE `loyalty_points` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`shop_id` text,
	`points` integer DEFAULT 0 NOT NULL,
	`lifetime_points` integer DEFAULT 0 NOT NULL,
	`tier` text DEFAULT 'bronze',
	`last_earned_at` integer,
	`metadata` text,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `user_table`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`shop_id`) REFERENCES `shop_table`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `loyalty_program` (
	`id` text PRIMARY KEY NOT NULL,
	`shop_id` text,
	`name` text NOT NULL,
	`description` text,
	`points_per_currency` integer DEFAULT 1 NOT NULL,
	`minimum_points` integer DEFAULT 0 NOT NULL,
	`active` integer DEFAULT true,
	`rules` text,
	`metadata` text,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`shop_id`) REFERENCES `shop_table`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `points_transaction` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`shop_id` text,
	`points` integer NOT NULL,
	`type` text NOT NULL,
	`description` text,
	`reference` text,
	`metadata` text,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `user_table`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`shop_id`) REFERENCES `shop_table`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `device_token` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token` text NOT NULL,
	`type` text NOT NULL,
	`device` text,
	`last_used_at` integer,
	`metadata` text,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `user_table`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `device_token_token_unique` ON `device_token` (`token`);--> statement-breakpoint
CREATE TABLE `notification_preference` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`channel` text NOT NULL,
	`enabled` integer DEFAULT true,
	`metadata` text,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `user_table`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `notification` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`type` text NOT NULL,
	`priority` text DEFAULT 'normal',
	`read` integer DEFAULT false,
	`read_at` integer,
	`action_url` text,
	`image` text,
	`metadata` text,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `user_table`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `orderItemOption` (
	`id` text PRIMARY KEY NOT NULL,
	`order_item_id` text NOT NULL,
	`option_id` text,
	`option_group_id` text,
	`option_name` text NOT NULL,
	`quantity` integer DEFAULT 1,
	`price` real NOT NULL,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`order_item_id`) REFERENCES `orderItem`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`option_id`) REFERENCES `option`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`option_group_id`) REFERENCES `optionGroup`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `orderItem` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`menu_item_id` text,
	`menu_item_name` text NOT NULL,
	`quantity` integer NOT NULL,
	`unit_price` real NOT NULL,
	`total_price` real NOT NULL,
	`special_instructions` text,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`order_id`) REFERENCES `order`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`menu_item_id`) REFERENCES `menuItem`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `order` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text,
	`customer_id` text,
	`shop_id` text NOT NULL,
	`rider_id` text,
	`rider_confirmation_code` integer NOT NULL,
	`status` text NOT NULL,
	`cart_id` text NOT NULL,
	`address_name` text DEFAULT '' NOT NULL,
	`longitude` real NOT NULL,
	`latitude` real NOT NULL,
	`delivery_notes` text,
	`vendor_notes` text,
	`contact_phone` text NOT NULL,
	`payment_method` text DEFAULT 'CARD' NOT NULL,
	`payment_status` text NOT NULL,
	`payment_transaction_id` text,
	`subtotal` real NOT NULL,
	`delivery_fee` real DEFAULT 0,
	`service_fee` real DEFAULT 0,
	`discount` real DEFAULT 0,
	`total` real NOT NULL,
	`accepted_at` text,
	`prepared_at` text,
	`picked_up_at` text,
	`delivered_at` text,
	`canceled_at` text,
	`cancel_reason` text,
	`refund_amount` real DEFAULT 0,
	`refund_reason` text,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`customer_id`) REFERENCES `user_table`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`shop_id`) REFERENCES `shop_table`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`rider_id`) REFERENCES `user_table`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`cart_id`) REFERENCES `carts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `riders` (
	`id` text PRIMARY KEY NOT NULL,
	`vehicle_type` text,
	`license_plate` text,
	`id_document` text,
	`current_location` text,
	`status` text DEFAULT 'offline',
	`rating` integer,
	`is_verified` integer DEFAULT false,
	`bank_info` text,
	`active_area` text,
	`max_delivery_distance` integer DEFAULT 10000,
	FOREIGN KEY (`id`) REFERENCES `user_table`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text,
	`user_id` text,
	`shop_id` text,
	`rider_id` text,
	`food_rating` integer,
	`delivery_rating` integer,
	`comment` text,
	`images` text,
	`reply` text,
	`reply_at` integer,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`order_id`) REFERENCES `order`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `user_table`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`shop_id`) REFERENCES `shop_table`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`rider_id`) REFERENCES `riders`(`id`) ON UPDATE no action ON DELETE no action
);
