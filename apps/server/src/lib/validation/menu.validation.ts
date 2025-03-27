import { z } from "zod";

export const createMenuSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  description: z.string().min(1, { message: "Description is required" }),
  // image: z
  //   .instanceof(File, { message: "Image file is required" })
  //   .refine(
  //     (file) => file.size <= 30 * 1024 * 1024,
  //     "File size must be less than 2MB"
  //   )
  //   .refine(
  //     (file) => ["image/jpeg", "image/png", "image/webp"].includes(file.type),
  //     "Only .jpg, .png, and .webp formats are allowed"
  //   ),
  price: z.number().min(0, { message: "Price must be a positive number" }),
  priceDescription: z.string().optional(),
  inStock: z.boolean().default(true),
  categoryId: z.string({ message: "Category is required" }),
  // packId: z.string().optional(),
  optionGroupId: z.array(z.string()).optional(),
  // prepTime: z.number().optional(),
  // rating: z.number().optional(),
});

export const createMenuCategorySchema = z.object({
  name: z.string().min(1),
  published: z.boolean().default(true),
});

export const updateMenuSchema = createMenuSchema.partial();
export const updateMenuCategorySchema = createMenuCategorySchema.partial();
