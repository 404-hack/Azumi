PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_riders` (
	`id` text PRIMARY KEY NOT NULL,
	`first_name` text,
	`last_name` text,
	`phone_number` text,
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
	`availability_status` text DEFAULT 'OFFLINE',
	`rating` real DEFAULT 0,
	`total_ratings` integer DEFAULT 0,
	`is_verified` integer DEFAULT false,
	`bank_info` text,
	`max_delivery_distance` integer DEFAULT 10000,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`id`) REFERENCES `user_table`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_riders`("id", "first_name", "last_name", "phone_number", "email", "address", "longitude", "latitude", "address_name", "vehicle_type", "vehicle_license", "identification_document", "application_status", "active", "availability_status", "rating", "total_ratings", "is_verified", "bank_info", "max_delivery_distance", "created_at", "updated_at") SELECT "id", "first_name", "last_name", "phone_number", "email", "address", "longitude", "latitude", "address_name", "vehicle_type", "vehicle_license", "identification_document", "application_status", "active", "availability_status", "rating", "total_ratings", "is_verified", "bank_info", "max_delivery_distance", "created_at", "updated_at" FROM `riders`;--> statement-breakpoint
DROP TABLE `riders`;--> statement-breakpoint
ALTER TABLE `__new_riders` RENAME TO `riders`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_shop_table` (
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
	`status` text DEFAULT 'DRAFT',
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
INSERT INTO `__new_shop_table`("id", "slug", "name", "email", "shop_type", "website", "description", "metadata", "phone_number", "address", "commission", "minimum_order_amount", "active", "status", "logo", "cover_image", "average_rating", "total_ratings", "featured_position", "tags", "bank_info", "delivery_type", "latitude", "longitude", "address_name", "is_verified", "created_at", "updated_at") SELECT "id", "slug", "name", "email", "shop_type", "website", "description", "metadata", "phone_number", "address", "commission", "minimum_order_amount", "active", "status", "logo", "cover_image", "average_rating", "total_ratings", "featured_position", "tags", "bank_info", "delivery_type", "latitude", "longitude", "address_name", "is_verified", "created_at", "updated_at" FROM `shop_table`;--> statement-breakpoint
DROP TABLE `shop_table`;--> statement-breakpoint
ALTER TABLE `__new_shop_table` RENAME TO `shop_table`;--> statement-breakpoint
CREATE UNIQUE INDEX `shop_table_slug_unique` ON `shop_table` (`slug`);--> statement-breakpoint
CREATE INDEX `location_idx` ON `shop_table` (`latitude`,`longitude`);--> statement-breakpoint
CREATE INDEX `shop_type_idx` ON `shop_table` (`shop_type`);--> statement-breakpoint
ALTER TABLE `session` ADD `impersonated_by` text;--> statement-breakpoint
ALTER TABLE `user_table` ADD `role` text DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `user_table` ADD `banned` integer DEFAULT false;--> statement-breakpoint
ALTER TABLE `user_table` ADD `ban_reason` text;--> statement-breakpoint
ALTER TABLE `user_table` ADD `ban_expires` integer;