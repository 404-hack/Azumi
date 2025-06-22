PRAGMA foreign_keys=OFF;

CREATE TABLE IF NOT EXISTS `rider_transaction` (
    `id` text PRIMARY KEY NOT NULL,
    `rider_id` text NOT NULL,
    `order_id` text,
    `delivery_fee` integer NOT NULL,
    `distance_bonus` integer DEFAULT 0,
    `peak_time_bonus` integer DEFAULT 0,
    `tip_amount` integer DEFAULT 0,
    `platform_fee` integer DEFAULT 0,
    `net_amount` integer NOT NULL,
    `amount` integer NOT NULL,
    `currency` text DEFAULT 'NGN' NOT NULL,
    `status` text NOT NULL,
    `type` text NOT NULL,
    `reference` text,
    `description` text,
    `metadata` text,
    `created_at` integer,
    `updated_at` integer
);

CREATE TABLE IF NOT EXISTS `vendor_transaction` (
    `id` text PRIMARY KEY NOT NULL,
    `shop_id` text NOT NULL,
    `order_id` text,
    `gross_amount` integer NOT NULL,
    `commission_rate` integer NOT NULL,
    `commission_amount` integer NOT NULL,
    `net_amount` integer NOT NULL,
    `amount` integer NOT NULL,
    `currency` text DEFAULT 'NGN' NOT NULL,
    `status` text NOT NULL,
    `type` text NOT NULL,
    `reference` text,
    `description` text,
    `metadata` text,
    `created_at` integer,
    `updated_at` integer
);

CREATE UNIQUE INDEX IF NOT EXISTS `rider_transaction_reference_unique` ON `rider_transaction` (`reference`);
CREATE UNIQUE INDEX IF NOT EXISTS `vendor_transaction_reference_unique` ON `vendor_transaction` (`reference`);

DROP TABLE IF EXISTS `transaction`;

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
    `minimum_order_amount` integer DEFAULT 500,
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
    `updated_at` integer
);

INSERT INTO `__new_shop_table` SELECT * FROM `shop_table`;
DROP TABLE `shop_table`;
ALTER TABLE `__new_shop_table` RENAME TO `shop_table`;

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
    `current_lat` real,
    `current_lng` real,
    `current_order_id` text,
    `created_at` integer,
    `updated_at` integer
);

INSERT INTO `__new_riders` SELECT * FROM `riders`;
DROP TABLE `riders`;
ALTER TABLE `__new_riders` RENAME TO `riders`;

ALTER TABLE `order` ADD COLUMN `payment_confirmed_at` text;
ALTER TABLE `order` ADD COLUMN `rider_assigned_at` text;
ALTER TABLE `order` ADD COLUMN `refund_status` text;
ALTER TABLE `order` ADD COLUMN `refund_reference` text;
ALTER TABLE `order` ADD COLUMN `refunded_at` text;

PRAGMA foreign_keys=ON;

CREATE UNIQUE INDEX IF NOT EXISTS `shop_table_slug_unique` ON `shop_table` (`slug`);
CREATE INDEX IF NOT EXISTS `location_idx` ON `shop_table` (`latitude`,`longitude`);
CREATE INDEX IF NOT EXISTS `shop_type_idx` ON `shop_table` (`shop_type`);
CREATE UNIQUE INDEX IF NOT EXISTS `riders_user_id_unique` ON `riders` (`user_id`);