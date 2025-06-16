CREATE TABLE `rider_transaction` (
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
	`updated_at` integer,
	FOREIGN KEY (`rider_id`) REFERENCES `user_table`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`order_id`) REFERENCES `order`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `rider_transaction_reference_unique` ON `rider_transaction` (`reference`);--> statement-breakpoint
CREATE TABLE `vendor_transaction` (
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
	`updated_at` integer,
	FOREIGN KEY (`shop_id`) REFERENCES `shop_table`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`order_id`) REFERENCES `order`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `vendor_transaction_reference_unique` ON `vendor_transaction` (`reference`);--> statement-breakpoint
DROP TABLE `transaction`;