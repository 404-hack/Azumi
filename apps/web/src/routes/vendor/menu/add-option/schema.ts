import { z } from 'zod';

export const optionSchema = z.object({
	name: z.string().min(1, 'Name is required'),
	price: z.number().min(0, 'Price must be 0 or greater'),
	createFromMenuItem: z.string().optional(),
	inStock: z.boolean().default(true)
});

export type OptionSchema = typeof optionSchema;
