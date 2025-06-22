CREATE TABLE `notification_log` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`token` text,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`data` text,
	`message_id` text,
	`status` text NOT NULL,
	`error_message` text,
	`sent_at` integer NOT NULL,
	`delivered_at` integer,
	`clicked_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `user_table`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `notification_log_user_id_idx` ON `notification_log` (`user_id`);--> statement-breakpoint
CREATE INDEX `notification_log_status_idx` ON `notification_log` (`status`);--> statement-breakpoint
CREATE INDEX `notification_log_sent_at_idx` ON `notification_log` (`sent_at`);--> statement-breakpoint
CREATE TABLE `push_token` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token` text NOT NULL,
	`device_id` text,
	`device_type` text,
	`user_agent` text,
	`provider` text DEFAULT 'fcm' NOT NULL,
	`is_active` integer DEFAULT true,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`last_used_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `user_table`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `push_token_token_unique` ON `push_token` (`token`);--> statement-breakpoint
CREATE INDEX `push_token_user_id_idx` ON `push_token` (`user_id`);--> statement-breakpoint
CREATE INDEX `push_token_token_idx` ON `push_token` (`token`);--> statement-breakpoint
CREATE INDEX `push_token_active_idx` ON `push_token` (`is_active`);--> statement-breakpoint
CREATE INDEX `push_token_provider_idx` ON `push_token` (`provider`);--> statement-breakpoint
CREATE TABLE `topic_subscription` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`topic` text NOT NULL,
	`is_subscribed` integer DEFAULT true,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user_table`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `topic_subscription_user_topic_idx` ON `topic_subscription` (`user_id`,`topic`);--> statement-breakpoint
CREATE INDEX `topic_subscription_topic_idx` ON `topic_subscription` (`topic`);