import { min } from "drizzle-orm";
import { z } from "zod";

export const createOptionSchema = z.object({
  name: z.string().min(1),
  price: z.number().min(0),
  inStock: z.boolean().default(true),
});

export const createOptionGroupSchema = z.object({
  name: z.string().min(1),
  minSelections: z.number().default(0),
  maxSelections: z.number().nullable(),
  optionsId: z.array(z.string()),
});

export const updateOptionGroupSchema = createOptionGroupSchema.partial();
export const updateOptionSchema = createOptionSchema.partial();
