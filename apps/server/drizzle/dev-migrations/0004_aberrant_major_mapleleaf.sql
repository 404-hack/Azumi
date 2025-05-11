ALTER TABLE `favorite_shops` RENAME TO `favorite_table`;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_favorite_table` (
	`user_id` text NOT NULL,
	`shop_id` text NOT NULL,
	`created_at` integer,
	`updated_at` integer,
	PRIMARY KEY(`user_id`, `shop_id`),
	FOREIGN KEY (`user_id`) REFERENCES `user_table`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`shop_id`) REFERENCES `shop_table`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_favorite_table`("user_id", "shop_id", "created_at", "updated_at") SELECT "user_id", "shop_id", "created_at", "updated_at" FROM `favorite_table`;--> statement-breakpoint
DROP TABLE `favorite_table`;--> statement-breakpoint
ALTER TABLE `__new_favorite_table` RENAME TO `favorite_table`;--> statement-breakpoint
PRAGMA foreign_keys=ON;