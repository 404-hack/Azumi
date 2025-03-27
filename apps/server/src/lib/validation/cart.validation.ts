import { z } from "zod";

// Add item to cart schema
export const addCartItemSchema = z.object({
  menuItemId: z.string(),
  quantity: z.number().int().positive().default(1),
  specialInstructions: z.string().optional(),
  options: z
    .array(
      z.object({
        optionId: z.string(),
        optionGroupId: z.string(),
        quantity: z.number().int().positive().default(1),
      })
    )
    .optional(),
});

// Update cart item quantity schema
export const updateCartItemSchema = z.object({
  quantity: z.number().int().positive(),
});
