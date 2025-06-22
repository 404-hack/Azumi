import { z } from "zod";
import {
  RIDER_AVAILABILITY_STATUS,
  RIDER_DOCUMENTS,
  VEHICLE_TYPES,
  PAYMENT_METHODS,
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

// Update rider profile schema
export const updateRiderProfileSchema = z.object({
  firstName: z
    .string()
    .min(2, { message: "First name is required" })
    .optional(),
  lastName: z.string().min(2, { message: "Last name is required" }).optional(),
  email: z.string().email({ message: "Invalid email address" }).optional(),
  address: z.string().min(5, { message: "Address is required" }).optional(),
  longitude: z.number({ message: "Longitude is required" }).optional(),
  latitude: z.number({ message: "Latitude is required" }).optional(),
  addressName: z.string().optional(),
  vehicleType: z
    .enum(VEHICLE_TYPES, {
      message: "Please select a valid vehicle type",
    })
    .optional(),
  vehicleLicense: z.string().optional(),
  maxDeliveryDistance: z.number().min(1).max(50).optional(),
  active: z.boolean().optional(),
});

export const riderVerifyAccountSchema = z.object({
  accountNumber: z.string().min(10, { message: "Account number is required" }),
  bankCode: z.string().min(2, { message: "Bank code is required" }),
});

export const createRiderPaymentMethodSchema = z.object({
  type: z.enum(PAYMENT_METHODS).default("BANK_TRANSFER"),
  accountNumber: z.string().min(10, { message: "Account number is required" }),
  accountName: z.string().min(2, { message: "Account name is required" }),
  bankName: z.string().min(2, { message: "Bank name is required" }),
  bankCode: z.string().min(2, { message: "Bank code is required" }),
});

export const updateRiderPaymentMethodSchema = z.object({
  type: z.enum(PAYMENT_METHODS).optional(),
  accountNumber: z.string().min(10).optional(),
  accountName: z.string().min(2).optional(),
  bankName: z.string().min(2).optional(),
  bankCode: z.string().min(2).optional(),
});
