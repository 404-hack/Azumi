import { z } from "zod";

export const nearbyShopsQuerySchema = z.object({
  latitude: z
    .string()
    .refine(
      (val) => {
        const num = Number(val);
        return !isNaN(num) && num >= -90 && num <= 90;
      },
      { message: "Latitude must be a number between -90 and 90" }
    )
    .transform((val) => Number(val)),
  longitude: z
    .string()
    .refine(
      (val) => {
        const num = Number(val);
        return !isNaN(num) && num >= -180 && num <= 180;
      },
      { message: "Longitude must be a number between -180 and 180" }
    )
    .transform((val) => Number(val)),
  distance: z
    .string()
    .optional()
    .refine(
      (val) => val === undefined || (!isNaN(Number(val)) && Number(val) > 0),
      { message: "Distance must be a positive number" }
    )
    .transform((val) => (val ? Number(val) : 10)), // Default to 10km
  maxDistance: z
    .string()
    .optional()
    .refine(
      (val) => val === undefined || (!isNaN(Number(val)) && Number(val) > 0),
      { message: "Max distance must be a positive number" }
    )
    .transform((val) => (val ? Number(val) : 10)), // Default to 10km
  shopType: z.string().optional(),

  // Named filter parameters
  openNow: z
    .string()
    .optional()
    .transform((val) => val === "true"), // Transform "true"/"false" string to boolean

  feeMin: z
    .string()
    .optional()
    .transform((val) => (val ? Number(val) : 300)), // Default minimum fee

  feeMax: z
    .string()
    .optional()
    .transform((val) => (val ? Number(val) : 3000)), // Default maximum fee

  // Single rating parameter (stores the minimum rating value)
  rating: z
    .string()
    .optional()
    .transform((val) => (val ? Number(val) : null)),

  // Single discount parameter (stores the discount value or "any")
  discount: z.string().optional(),

  sort: z.string().optional().default("recommended"),
});

export type NearbyShopsQueryParams = z.infer<typeof nearbyShopsQuerySchema>;
