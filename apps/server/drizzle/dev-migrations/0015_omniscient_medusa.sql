CREATE UNIQUE INDEX `rider_payment_methods_rider_id_unique` ON `rider_payment_methods` (`rider_id`);--> statement-breakpoint
ALTER TABLE `rider_payment_methods` DROP COLUMN `is_default`;--> statement-breakpoint
CREATE UNIQUE INDEX `riders_user_id_unique` ON `riders` (`user_id`);--> statement-breakpoint
ALTER TABLE `riders` DROP COLUMN `is_verified`;