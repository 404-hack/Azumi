CREATE TABLE `favorite_shops` (
	`user_id` text NOT NULL,
	`shop_id` text NOT NULL,
	`created_at` integer,
	`updated_at` integer,
	PRIMARY KEY(`user_id`, `shop_id`),
	FOREIGN KEY (`user_id`) REFERENCES `user_table`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`shop_id`) REFERENCES `shop_table`(`id`) ON UPDATE no action ON DELETE cascade
);
