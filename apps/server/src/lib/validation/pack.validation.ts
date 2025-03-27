import { z } from "zod";

export const createPackSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  price: z.number().min(0),
});

export const updatePackSchema = createPackSchema.partial();
