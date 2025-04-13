ALTER TABLE `optionToOptionGroup` ADD `created_at` integer;--> statement-breakpoint
ALTER TABLE `optionToOptionGroup` ADD `updated_at` integer;
ALTER TABLE `invitation` ADD `organization_Id`
ALTER TABLE `invitation` RENAME COLUMN `organizationId` TO `organization_id`;