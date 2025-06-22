CREATE TABLE `rider_payment_methods` (
	`id` text PRIMARY KEY NOT NULL,
	`rider_id` text NOT NULL,
	`type` text DEFAULT 'BANK_TRANSFER',
	`account_number` text NOT NULL,
	`account_name` text NOT NULL,
	`bank_name` text NOT NULL,
	`bank_code` text NOT NULL,
	`paystack_recipient_code` text,
	`is_default` integer DEFAULT false,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`rider_id`) REFERENCES `riders`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `riders` DROP COLUMN `bank_info`;