CREATE TABLE `promotion_shops` (
	`id` text PRIMARY KEY NOT NULL,
	`promotion_id` text NOT NULL,
	`shop_id` text NOT NULL,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`promotion_id`) REFERENCES `promotions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`shop_id`) REFERENCES `shop_table`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
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
INSERT INTO `__new_promotions`("id", "name", "code", "description", "type", "value", "min_order_value", "max_discount", "buy_quantity", "get_quantity", "start_date", "end_date", "usage_limit", "usage_count", "is_active", "is_first_order_only", "applies_to_all_shops", "cost_bearer", "created_by", "creator_type", "created_at", "updated_at") 
SELECT 
  "id", "name", "code", "description", "type", "value", "min_order_value", "max_discount", 
  "buy_quantity", "get_quantity", "start_date", "end_date", "usage_limit", "usage_count", "is_active", 
  false AS "is_first_order_only", 
  false AS "applies_to_all_shops", 
  "cost_bearer",
  'system' AS "created_by", 
  'SYSTEM' AS "creator_type", 
  "created_at", "updated_at" 
FROM `promotions`;--> statement-breakpoint
DROP TABLE `promotions`;--> statement-breakpoint
ALTER TABLE `__new_promotions` RENAME TO `promotions`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `promotions_code_unique` ON `promotions` (`code`);--> statement-breakpoint
ALTER TABLE `order` DROP COLUMN `contact_phone`;