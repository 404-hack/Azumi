import { z } from "zod";

export const createMenuSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  description: z.string().min(1, { message: "Description is required" }),
  image: z
    .instanceof(File, { message: "Image file is required" })
    .refine(
      (file) => file.size <= 5 * 1024 * 1024,
      "File size must be less than 5MB"
    )
    .refine(
      (file) => ["image/jpeg", "image/png", "image/webp"].includes(file.type),
      "Only .jpg, .png, and .webp formats are allowed"
    ),
  price: z.preprocess(
    (val) => (typeof val === "string" ? parseFloat(val) : val),
    z.number().min(0, { message: "Price must be a positive number" })
  ),
  priceDescription: z.string(),
  // inStock: z.boolean().default(true),
  inStock: z.preprocess(
    (val) => (typeof val === "string" ? val === "true" : val),
    z.boolean().default(true)
  ),
  categoryId: z.string({ message: "Category is required" }),

  packId: z.string().optional(),
  optionGroupId: z.preprocess((val) => {
    if (typeof val === "string") {
      const trimmedVal = val.trim();
      if (trimmedVal === "") return undefined; // Handled by .optional()
      return trimmedVal
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s !== "");
    }
    return val; // Pass through if already an array or undefined/null
  }, z.array(z.string()).optional()),
  // prepTime: z.number().optional(),
  // rating: z.number().optional(),
});

export const createMenuCategorySchema = z.object({
  name: z.string().min(1),
  published: z.boolean().default(true),
});

export const updateMenuSchema = createMenuSchema
  .extend({
    image: z.union([z.instanceof(File), z.string().url(), z.null()]).optional(),
  })
  .partial();
export const updateMenuCategorySchema = createMenuCategorySchema.partial();
