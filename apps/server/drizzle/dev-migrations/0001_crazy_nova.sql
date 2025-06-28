ALTER TABLE "shop_table" RENAME TO "shop";--> statement-breakpoint
ALTER TABLE "menuCategory" RENAME TO "menu_category";--> statement-breakpoint
ALTER TABLE "menu_item_option_groups" RENAME TO "menu_opt_groups";--> statement-breakpoint
ALTER TABLE "menuItem" RENAME TO "menu_item";--> statement-breakpoint
ALTER TABLE "optionToOptionGroup" RENAME TO "opts_to_groups";--> statement-breakpoint
ALTER TABLE "shop" DROP CONSTRAINT "shop_table_slug_unique";--> statement-breakpoint
ALTER TABLE "user_activity" DROP CONSTRAINT "user_activity_item_id_menuItem_id_fk";
--> statement-breakpoint
ALTER TABLE "cart_items" DROP CONSTRAINT "cart_items_menu_item_id_menuItem_id_fk";
--> statement-breakpoint
ALTER TABLE "carts" DROP CONSTRAINT "carts_shop_id_shop_table_id_fk";
--> statement-breakpoint
ALTER TABLE "deliveryZones" DROP CONSTRAINT "deliveryZones_shop_id_shop_table_id_fk";
--> statement-breakpoint
ALTER TABLE "favorite_table" DROP CONSTRAINT "favorite_table_shop_id_shop_table_id_fk";
--> statement-breakpoint
ALTER TABLE "invitation" DROP CONSTRAINT "invitation_organization_id_shop_table_id_fk";
--> statement-breakpoint
ALTER TABLE "member" DROP CONSTRAINT "member_organization_id_shop_table_id_fk";
--> statement-breakpoint
ALTER TABLE "shopAgreements" DROP CONSTRAINT "shopAgreements_shop_id_shop_table_id_fk";
--> statement-breakpoint
ALTER TABLE "shopOperatingHours" DROP CONSTRAINT "shopOperatingHours_shop_id_shop_table_id_fk";
--> statement-breakpoint
ALTER TABLE "shopPaymentMethod" DROP CONSTRAINT "shopPaymentMethod_shop_id_shop_table_id_fk";
--> statement-breakpoint
ALTER TABLE "shop" DROP CONSTRAINT "shop_table_shop_type_shopType_id_fk";
--> statement-breakpoint
ALTER TABLE "shopTodo" DROP CONSTRAINT "shopTodo_shop_id_shop_table_id_fk";
--> statement-breakpoint
ALTER TABLE "menu_category" DROP CONSTRAINT "menuCategory_shop_id_shop_table_id_fk";
--> statement-breakpoint
ALTER TABLE "menu_opt_groups" DROP CONSTRAINT "menu_item_option_groups_menu_item_id_menuItem_id_fk";
--> statement-breakpoint
ALTER TABLE "menu_opt_groups" DROP CONSTRAINT "menu_item_option_groups_option_group_id_optionGroup_id_fk";
--> statement-breakpoint
ALTER TABLE "menu_item" DROP CONSTRAINT "menuItem_category_id_menuCategory_id_fk";
--> statement-breakpoint
ALTER TABLE "menu_item" DROP CONSTRAINT "menuItem_pack_id_pack_id_fk";
--> statement-breakpoint
ALTER TABLE "menu_item" DROP CONSTRAINT "menuItem_shop_id_shop_table_id_fk";
--> statement-breakpoint
ALTER TABLE "pack" DROP CONSTRAINT "pack_shop_id_shop_table_id_fk";
--> statement-breakpoint
ALTER TABLE "optionGroup" DROP CONSTRAINT "optionGroup_shop_id_shop_table_id_fk";
--> statement-breakpoint
ALTER TABLE "option" DROP CONSTRAINT "option_shop_id_shop_table_id_fk";
--> statement-breakpoint
ALTER TABLE "opts_to_groups" DROP CONSTRAINT "optionToOptionGroup_option_id_option_id_fk";
--> statement-breakpoint
ALTER TABLE "opts_to_groups" DROP CONSTRAINT "optionToOptionGroup_option_group_id_optionGroup_id_fk";
--> statement-breakpoint
ALTER TABLE "promotion_shops" DROP CONSTRAINT "promotion_shops_shop_id_shop_table_id_fk";
--> statement-breakpoint
ALTER TABLE "vendor_transaction" DROP CONSTRAINT "vendor_transaction_shop_id_shop_table_id_fk";
--> statement-breakpoint
ALTER TABLE "loyalty_points" DROP CONSTRAINT "loyalty_points_shop_id_shop_table_id_fk";
--> statement-breakpoint
ALTER TABLE "loyalty_program" DROP CONSTRAINT "loyalty_program_shop_id_shop_table_id_fk";
--> statement-breakpoint
ALTER TABLE "points_transaction" DROP CONSTRAINT "points_transaction_shop_id_shop_table_id_fk";
--> statement-breakpoint
ALTER TABLE "orderItem" DROP CONSTRAINT "orderItem_menu_item_id_menuItem_id_fk";
--> statement-breakpoint
ALTER TABLE "order" DROP CONSTRAINT "order_shop_id_shop_table_id_fk";
--> statement-breakpoint
ALTER TABLE "reviews" DROP CONSTRAINT "reviews_shop_id_shop_table_id_fk";
--> statement-breakpoint
ALTER TABLE "menu_opt_groups" DROP CONSTRAINT "menu_item_option_groups_menu_item_id_option_group_id_pk";--> statement-breakpoint
ALTER TABLE "opts_to_groups" DROP CONSTRAINT "optionToOptionGroup_option_id_option_group_id_pk";--> statement-breakpoint
ALTER TABLE "menu_opt_groups" ADD CONSTRAINT "menu_opt_groups_menu_item_id_option_group_id_pk" PRIMARY KEY("menu_item_id","option_group_id");--> statement-breakpoint
ALTER TABLE "opts_to_groups" ADD CONSTRAINT "opts_to_groups_option_id_option_group_id_pk" PRIMARY KEY("option_id","option_group_id");--> statement-breakpoint
ALTER TABLE "user_activity" ADD CONSTRAINT "user_activity_item_id_menu_item_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."menu_item"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_menu_item_id_menu_item_id_fk" FOREIGN KEY ("menu_item_id") REFERENCES "public"."menu_item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "carts" ADD CONSTRAINT "carts_shop_id_shop_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shop"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliveryZones" ADD CONSTRAINT "deliveryZones_shop_id_shop_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shop"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorite_table" ADD CONSTRAINT "favorite_table_shop_id_shop_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shop"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_organization_id_shop_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."shop"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_organization_id_shop_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."shop"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shopAgreements" ADD CONSTRAINT "shopAgreements_shop_id_shop_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shop"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shopOperatingHours" ADD CONSTRAINT "shopOperatingHours_shop_id_shop_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shop"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shopPaymentMethod" ADD CONSTRAINT "shopPaymentMethod_shop_id_shop_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shop"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop" ADD CONSTRAINT "shop_shop_type_shopType_id_fk" FOREIGN KEY ("shop_type") REFERENCES "public"."shopType"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shopTodo" ADD CONSTRAINT "shopTodo_shop_id_shop_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shop"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_category" ADD CONSTRAINT "menu_category_shop_id_shop_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shop"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_opt_groups" ADD CONSTRAINT "menu_opt_groups_menu_item_id_menu_item_id_fk" FOREIGN KEY ("menu_item_id") REFERENCES "public"."menu_item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_opt_groups" ADD CONSTRAINT "menu_opt_groups_option_group_id_optionGroup_id_fk" FOREIGN KEY ("option_group_id") REFERENCES "public"."optionGroup"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_item" ADD CONSTRAINT "menu_item_category_id_menu_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."menu_category"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_item" ADD CONSTRAINT "menu_item_pack_id_pack_id_fk" FOREIGN KEY ("pack_id") REFERENCES "public"."pack"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_item" ADD CONSTRAINT "menu_item_shop_id_shop_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shop"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pack" ADD CONSTRAINT "pack_shop_id_shop_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shop"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "optionGroup" ADD CONSTRAINT "optionGroup_shop_id_shop_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shop"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "option" ADD CONSTRAINT "option_shop_id_shop_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shop"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opts_to_groups" ADD CONSTRAINT "opts_to_groups_option_id_option_id_fk" FOREIGN KEY ("option_id") REFERENCES "public"."option"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opts_to_groups" ADD CONSTRAINT "opts_to_groups_option_group_id_optionGroup_id_fk" FOREIGN KEY ("option_group_id") REFERENCES "public"."optionGroup"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion_shops" ADD CONSTRAINT "promotion_shops_shop_id_shop_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shop"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_transaction" ADD CONSTRAINT "vendor_transaction_shop_id_shop_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shop"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loyalty_points" ADD CONSTRAINT "loyalty_points_shop_id_shop_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shop"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loyalty_program" ADD CONSTRAINT "loyalty_program_shop_id_shop_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shop"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "points_transaction" ADD CONSTRAINT "points_transaction_shop_id_shop_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shop"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orderItem" ADD CONSTRAINT "orderItem_menu_item_id_menu_item_id_fk" FOREIGN KEY ("menu_item_id") REFERENCES "public"."menu_item"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order" ADD CONSTRAINT "order_shop_id_shop_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shop"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_shop_id_shop_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shop"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop" ADD CONSTRAINT "shop_slug_unique" UNIQUE("slug");