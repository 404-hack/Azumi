import { z } from "zod";
import { PROMOTION_TYPES, PROMOTION_COST_BEARER } from "../constant";

export const createPromotionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(3, "Code must be at least 3 characters").toUpperCase(),
  description: z.string().optional(),
  type: z.enum(PROMOTION_TYPES),
  value: z.number().positive("Value must be positive"),
  minOrderValue: z.number().nonnegative().optional(),
  maxDiscount: z.number().nonnegative().optional(),
  buyQuantity: z.number().int().positive().optional(),
  getQuantity: z.number().int().positive().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  usageLimit: z.number().int().nonnegative().optional(),
  isActive: z.boolean().default(true),
  isFirstOrderOnly: z.boolean().default(false),
  appliesToAllShops: z.boolean().default(false),
  productIds: z.array(z.string()).optional(),
  shopIds: z.array(z.string()).min(1, "At least one shop must be selected"),
  creatorType: z.enum(["superAdmin", "vendor"]),
  costBearer: z.enum(PROMOTION_COST_BEARER).default("VENDOR"),
});

export const updatePromotionSchema = createPromotionSchema.partial();

export const validateCouponSchema = z.object({
  code: z.string().min(1, "Code is required"),
  shopId: z.string(),
  cartTotal: z.number().positive(),
  userId: z.string().optional(),
});
