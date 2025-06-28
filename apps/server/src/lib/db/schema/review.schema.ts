import { pgTable, text, integer, json, timestamp } from "drizzle-orm/pg-core";
import { timestamps } from "./utils.schema";
import { orderTable } from "./order.schema";
import { userTable } from "./auth.schema";
import { shopTable } from "./shop.schema";
import { riderTable } from "./rider.schema";

export const reviews = pgTable("reviews", {
  id: text("id").primaryKey(),
  orderId: text("order_id").references(() => orderTable.id),
  userId: text("user_id").references(() => userTable.id),
  shopId: text("shop_id").references(() => shopTable.id),
  riderId: text("rider_id").references(() => riderTable.id),
  foodRating: integer("food_rating"),
  deliveryRating: integer("delivery_rating"),
  comment: text("comment"),
  images: json("images"),
  reply: text("reply"),
  replyAt: timestamp("reply_at", { mode: "date" }),
  ...timestamps,
});
