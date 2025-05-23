PRAGMA foreign_keys=OFF;--> statement-breakpoint
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
	`availability_status` text DEFAULT 'OFFLINE',
	`rating` real DEFAULT 0,
	`total_ratings` integer DEFAULT 0,
	`is_verified` integer DEFAULT false,
	`bank_info` text,
	`max_delivery_distance` integer DEFAULT 10,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `user_table`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_riders`("id", "user_id", "first_name", "last_name", "email", "address", "longitude", "latitude", "address_name", "vehicle_type", "vehicle_license", "identification_document", "application_status", "active", "availability_status", "rating", "total_ratings", "is_verified", "bank_info", "max_delivery_distance", "created_at", "updated_at") SELECT "id", "user_id", "first_name", "last_name", "email", "address", "longitude", "latitude", "address_name", "vehicle_type", "vehicle_license", "identification_document", "application_status", "active", "availability_status", "rating", "total_ratings", "is_verified", "bank_info", "max_delivery_distance", "created_at", "updated_at" FROM `riders`;--> statement-breakpoint
DROP TABLE `riders`;--> statement-breakpoint
ALTER TABLE `__new_riders` RENAME TO `riders`;--> statement-breakpoint
PRAGMA foreign_keys=ON;