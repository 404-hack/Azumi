ALTER TABLE `notification_preference` RENAME TO `promotion_shops`;--> statement-breakpoint
ALTER TABLE `promotion_shops` RENAME COLUMN "user_id" TO "promotion_id";--> statement-breakpoint
ALTER TABLE `promotion_shops` RENAME COLUMN "type" TO "shop_id";--> statement-breakpoint
CREATE TABLE `notification_log` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`token` text,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`data` text,
	`message_id` text,
	`status` text NOT NULL,
	`error_message` text,
	`sent_at` integer NOT NULL,
	`delivered_at` integer,
	`clicked_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `user_table`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `notification_log_user_id_idx` ON `notification_log` (`user_id`);--> statement-breakpoint
CREATE INDEX `notification_log_status_idx` ON `notification_log` (`status`);--> statement-breakpoint
CREATE INDEX `notification_log_sent_at_idx` ON `notification_log` (`sent_at`);--> statement-breakpoint
CREATE TABLE `push_token` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token` text NOT NULL,
	`device_id` text,
	`device_type` text,
	`user_agent` text,
	`provider` text DEFAULT 'fcm' NOT NULL,
	`is_active` integer DEFAULT true,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`last_used_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `user_table`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `push_token_token_unique` ON `push_token` (`token`);--> statement-breakpoint
CREATE INDEX `push_token_user_id_idx` ON `push_token` (`user_id`);--> statement-breakpoint
CREATE INDEX `push_token_token_idx` ON `push_token` (`token`);--> statement-breakpoint
CREATE INDEX `push_token_active_idx` ON `push_token` (`is_active`);--> statement-breakpoint
CREATE INDEX `push_token_provider_idx` ON `push_token` (`provider`);--> statement-breakpoint
CREATE TABLE `topic_subscription` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`topic` text NOT NULL,
	`is_subscribed` integer DEFAULT true,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user_table`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `topic_subscription_user_topic_idx` ON `topic_subscription` (`user_id`,`topic`);--> statement-breakpoint
CREATE INDEX `topic_subscription_topic_idx` ON `topic_subscription` (`topic`);--> statement-breakpoint
CREATE TABLE `rider_payment_methods` (
	`id` text PRIMARY KEY NOT NULL,
	`rider_id` text NOT NULL,
	`type` text DEFAULT 'BANK_TRANSFER',
	`account_number` text NOT NULL,
	`account_name` text NOT NULL,
	`bank_name` text NOT NULL,
	`bank_code` text NOT NULL,
	`paystack_recipient_code` text,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `rider_payment_methods_rider_id_unique` ON `rider_payment_methods` (`rider_id`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_promotion_shops` (
	`id` text PRIMARY KEY NOT NULL,
	`promotion_id` text NOT NULL,
	`shop_id` text NOT NULL,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`promotion_id`) REFERENCES `promotions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`shop_id`) REFERENCES `shop_table`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_promotion_shops`("id", "promotion_id", "shop_id", "created_at", "updated_at") SELECT "id", "promotion_id", "shop_id", "created_at", "updated_at" FROM `promotion_shops`;--> statement-breakpoint
DROP TABLE `promotion_shops`;--> statement-breakpoint
ALTER TABLE `__new_promotion_shops` RENAME TO `promotion_shops`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_promotions` (
	`id` text PRIMARY KEY NOT NULL,
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
	`is_first_order_only` integer DEFAULT false,
	`applies_to_all_shops` integer DEFAULT false,
	`cost_bearer` text DEFAULT 'PLATFORM' NOT NULL,
	`created_by` text NOT NULL,
	`creator_type` text NOT NULL,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`created_by`) REFERENCES `user_table`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_promotions`("id", "name", "code", "description", "type", "value", "min_order_value", "max_discount", "buy_quantity", "get_quantity", "start_date", "end_date", "usage_limit", "usage_count", "is_active", "is_first_order_only", "applies_to_all_shops", "cost_bearer", "created_by", "creator_type", "created_at", "updated_at") SELECT "id", "name", "code", "description", "type", "value", "min_order_value", "max_discount", "buy_quantity", "get_quantity", "start_date", "end_date", "usage_limit", "usage_count", "is_active", "is_first_order_only", "applies_to_all_shops", "cost_bearer", "created_by", "creator_type", "created_at", "updated_at" FROM `promotions`;--> statement-breakpoint
DROP TABLE `promotions`;--> statement-breakpoint
ALTER TABLE `__new_promotions` RENAME TO `promotions`;--> statement-breakpoint
CREATE UNIQUE INDEX `promotions_code_unique` ON `promotions` (`code`);--> statement-breakpoint
CREATE TABLE `__new_riders` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`first_name` text,
	`last_name` text,
	`email` text,
	`address` text,
	`longitude` real,
	`latitude` real,
	`address_name` text,
	`vehicle_type` text,
	`vehicle_license` text,
	`identification_document` text,
	`application_status` text DEFAULT 'DRAFT',
	`active` integer DEFAULT false,
	`availability_status` text DEFAULT 'AVAILABLE',
	`rating` real DEFAULT 0,
	`total_ratings` integer DEFAULT 0,
	`max_delivery_distance` integer DEFAULT 10,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `user_table`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_riders`("id", "user_id", "first_name", "last_name", "email", "address", "longitude", "latitude", "address_name", "vehicle_type", "vehicle_license", "identification_document", "application_status", "active", "availability_status", "rating", "total_ratings", "max_delivery_distance", "created_at", "updated_at") SELECT "id", "user_id", "first_name", "last_name", "email", "address", "longitude", "latitude", "address_name", "vehicle_type", "vehicle_license", "identification_document", "application_status", "active", "availability_status", "rating", "total_ratings", "max_delivery_distance", "created_at", "updated_at" FROM `riders`;--> statement-breakpoint
DROP TABLE `riders`;--> statement-breakpoint
ALTER TABLE `__new_riders` RENAME TO `riders`;--> statement-breakpoint
CREATE UNIQUE INDEX `riders_user_id_unique` ON `riders` (`user_id`);--> statement-breakpoint
ALTER TABLE `rider_payment_methods` ADD CONSTRAINT `rider_payment_methods_rider_id_riders_id_fk` FOREIGN KEY (`rider_id`) REFERENCES `riders`(`id`) ON UPDATE no action ON DELETE cascade;--> statement-breakpoint
ALTER TABLE `order` DROP COLUMN `contact_phone`;