import { z } from 'zod';

export const menuSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  categoryId: z.string().min(1),
  image: z.string().min(1),
  price: z.number().min(0.01),
  priceDescription: z.string().optional(),
  packId: z.string().optional(),
  optionGroupId: z.string().optional(),
  inStock: z.boolean(),
  shopId: z.string().min(1),
});

export const menuCategorySchema = z.object({
  name: z.string().min(1),
  published: z.boolean(),
  shopId: z.string().min(1),
});

export const menuPackSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  price: z.number().min(0.01),
  shopId: z.string().min(1),
});

export const menuOptionSchema = z.object({
  name: z.string().min(1),
  price: z.number().min(0),
});

export const menuOptionGroupSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  required: z.boolean(),
  multiSelect: z.boolean(),
  shopId: z.string().min(1),
  options: z.array(menuOptionSchema),
});

export type CreateMenuInput = z.infer<typeof menuSchema>;
export type CreateMenuCategoryInput = z.infer<typeof menuCategorySchema>;
export type CreateMenuPackInput = z.infer<typeof menuPackSchema>;
export type CreateMenuOptionGroupInput = z.infer<typeof menuOptionGroupSchema>;
