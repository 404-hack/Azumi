ALTER TABLE `shop_table` RENAME COLUMN "addressName" TO "address_name";--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_invitation` (
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
INSERT INTO `__new_invitation`("id", "organization_id", "email", "role", "status", "expires_at", "inviter_id") SELECT "id", "organization_id", "email", "role", "status", "expires_at", "inviter_id" FROM `invitation`;--> statement-breakpoint
DROP TABLE `invitation`;--> statement-breakpoint
ALTER TABLE `__new_invitation` RENAME TO `invitation`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_optionGroup` (
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
INSERT INTO `__new_optionGroup`("id", "name", "min_selections", "max_selections", "shop_id", "user_id", "created_at", "updated_at") SELECT "id", "name", "min_selections", "max_selections", "shop_id", "user_id", "created_at", "updated_at" FROM `optionGroup`;--> statement-breakpoint
DROP TABLE `optionGroup`;--> statement-breakpoint
ALTER TABLE `__new_optionGroup` RENAME TO `optionGroup`;--> statement-breakpoint
CREATE TABLE `__new_option` (
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
INSERT INTO `__new_option`("id", "name", "price", "in_stock", "shop_id", "user_id", "created_at", "updated_at") SELECT "id", "name", "price", "in_stock", "shop_id", "user_id", "created_at", "updated_at" FROM `option`;--> statement-breakpoint
DROP TABLE `option`;--> statement-breakpoint
ALTER TABLE `__new_option` RENAME TO `option`;--> statement-breakpoint
CREATE TABLE `__new_order` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`customer_id` text,
	`shop_id` text NOT NULL,
	`rider_id` text,
	`status` text NOT NULL,
	`cart_id` text NOT NULL,
	`delivery_address_id` text,
	`delivery_notes` text,
	`vendor_notes` text,
	`contact_phone` text,
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
	FOREIGN KEY (`cart_id`) REFERENCES `carts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`delivery_address_id`) REFERENCES `addresses`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_order`("id", "code", "customer_id", "shop_id", "rider_id", "status", "cart_id", "delivery_address_id", "delivery_notes", "vendor_notes", "contact_phone", "payment_method", "payment_status", "payment_transaction_id", "subtotal", "delivery_fee", "service_fee", "discount", "total", "accepted_at", "prepared_at", "picked_up_at", "delivered_at", "canceled_at", "cancel_reason", "refund_amount", "refund_reason", "created_at", "updated_at") SELECT "id", "code", "customer_id", "shop_id", "rider_id", "status", "cart_id", "delivery_address_id", "delivery_notes", "vendor_notes", "contact_phone", "payment_method", "payment_status", "payment_transaction_id", "subtotal", "delivery_fee", "service_fee", "discount", "total", "accepted_at", "prepared_at", "picked_up_at", "delivered_at", "canceled_at", "cancel_reason", "refund_amount", "refund_reason", "created_at", "updated_at" FROM `order`;--> statement-breakpoint
DROP TABLE `order`;--> statement-breakpoint
ALTER TABLE `__new_order` RENAME TO `order`;