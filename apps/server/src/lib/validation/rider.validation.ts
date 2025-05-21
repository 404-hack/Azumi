import { z } from "zod";
import {
  RIDER_AVAILABILITY_STATUS,
  RIDER_DOCUMENTS,
  VEHICLE_TYPES,
} from "../constant";

export const createRiderSchema = z.object({
  firstName: z.string().min(2, { message: "First name is required" }),
  lastName: z.string().min(2, { message: "Last name is required" }),
  email: z.string().email({ message: "Invalid email address" }),

  address: z.string().min(5, { message: "Address is required" }),
  longitude: z.number({ message: "Longitude is required" }),
  latitude: z.number({ message: "Latitude is required" }),
  addressName: z.string().optional(),
  vehicleType: z.enum(VEHICLE_TYPES, {
    message: "Please select a valid vehicle type",
  }),
  vehicleLicense: z.string().optional(),
});

// Legacy rider application schema (kept for compatibility)
export const riderApplicationSchema = createRiderSchema;

// Rider admin status update schema
export const updateRiderAdminStatusSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "SUSPENDED"], {
    message: "Status must be PENDING, APPROVED, REJECTED, or SUSPENDED",
  }),
  active: z.boolean().optional(),
});

// Rider availability status update schema
export const updateRiderStatusSchema = z.object({
  status: z.enum(RIDER_AVAILABILITY_STATUS),
  latitude: z.number(),
  longitude: z.number(),
});

// Update rider location schema
export const updateLocationSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
});
