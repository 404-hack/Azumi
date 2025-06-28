ALTER TABLE "menu_opt_groups" RENAME TO "menu_item_option_groups";--> statement-breakpoint
ALTER TABLE "opts_to_groups" RENAME TO "option_to_option_group";--> statement-breakpoint
ALTER TABLE "menu_item_option_groups" DROP CONSTRAINT "menu_opt_groups_menu_item_id_menu_item_id_fk";
--> statement-breakpoint
ALTER TABLE "menu_item_option_groups" DROP CONSTRAINT "menu_opt_groups_option_group_id_optionGroup_id_fk";
--> statement-breakpoint
ALTER TABLE "option_to_option_group" DROP CONSTRAINT "opts_to_groups_option_id_option_id_fk";
--> statement-breakpoint
ALTER TABLE "option_to_option_group" DROP CONSTRAINT "opts_to_groups_option_group_id_optionGroup_id_fk";
--> statement-breakpoint
ALTER TABLE "menu_item_option_groups" DROP CONSTRAINT "menu_opt_groups_menu_item_id_option_group_id_pk";--> statement-breakpoint
ALTER TABLE "option_to_option_group" DROP CONSTRAINT "opts_to_groups_option_id_option_group_id_pk";--> statement-breakpoint
ALTER TABLE "menu_item_option_groups" ADD CONSTRAINT "menu_item_option_groups_menu_item_id_option_group_id_pk" PRIMARY KEY("menu_item_id","option_group_id");--> statement-breakpoint
ALTER TABLE "option_to_option_group" ADD CONSTRAINT "option_to_option_group_option_id_option_group_id_pk" PRIMARY KEY("option_id","option_group_id");--> statement-breakpoint
ALTER TABLE "menu_item_option_groups" ADD CONSTRAINT "menu_item_option_groups_menu_item_id_menu_item_id_fk" FOREIGN KEY ("menu_item_id") REFERENCES "public"."menu_item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_item_option_groups" ADD CONSTRAINT "menu_item_option_groups_option_group_id_optionGroup_id_fk" FOREIGN KEY ("option_group_id") REFERENCES "public"."optionGroup"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "option_to_option_group" ADD CONSTRAINT "option_to_option_group_option_id_option_id_fk" FOREIGN KEY ("option_id") REFERENCES "public"."option"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "option_to_option_group" ADD CONSTRAINT "option_to_option_group_option_group_id_optionGroup_id_fk" FOREIGN KEY ("option_group_id") REFERENCES "public"."optionGroup"("id") ON DELETE cascade ON UPDATE no action;