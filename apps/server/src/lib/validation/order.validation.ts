import { ORDER_STATUS, PAYMENT_METHODS } from "../constant";
import { z } from "zod";

export const createOrderSchema = z.object({
  cartId: z.string(), // Now required
  deliveryAddressId: z.string(),
  deliveryNotes: z.string().optional(),
  vendorNotes: z.string().optional(),
  contactPhone: z.string().optional(),
  deliveryFee: z.number().default(0),
  serviceFee: z.number().default(0),
  discount: z.number().default(0),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(ORDER_STATUS),
  reason: z.string().optional(),
});
