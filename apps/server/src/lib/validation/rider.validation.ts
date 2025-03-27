import { z } from "zod";
export const riderApplicationSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(6),
  vehicleType: z.enum(["MOTORCYCLE", "BICYCLE", "CAR", "SCOOTER"]),
  licensePlate: z.string().optional(),
  address: z.string(),
  city: z.string(),
  idDocument: z.string(), // URL of uploaded ID
});

// Rider status update schema
export const updateRiderStatusSchema = z.object({
  status: z.enum(["available", "busy", "offline"]),
  currentLocation: z
    .object({
      latitude: z.number(),
      longitude: z.number(),
    })
    .optional(),
});

// Update rider location schema
export const updateLocationSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
});
