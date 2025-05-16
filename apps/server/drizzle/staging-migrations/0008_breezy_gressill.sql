ALTER TABLE `session` ADD `impersonated_by` text;--> statement-breakpoint
ALTER TABLE `user_table` ADD `role` text DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `user_table` ADD `banned` integer DEFAULT false;--> statement-breakpoint
ALTER TABLE `user_table` ADD `ban_reason` text;--> statement-breakpoint
ALTER TABLE `user_table` ADD `ban_expires` integer;