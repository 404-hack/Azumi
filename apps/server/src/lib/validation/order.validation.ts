import { ORDER_STATUS } from "../constant";
import { z } from "zod";

export const createOrderSchema = z.object({
  cartId: z.string().min(1, "Cart ID is required"),
  deliveryNotes: z.string().optional(),
  vendorNotes: z.string().optional(),
  contactPhone: z.string().optional(),
  discount: z.number().nonnegative("Discount cannot be negative").default(0),
  userLatitude: z.number().min(-90).max(90),
  userLongitude: z.number().min(-180).max(180),
  addressName: z.string().min(1),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(ORDER_STATUS),
  reason: z.string().optional(),
});
