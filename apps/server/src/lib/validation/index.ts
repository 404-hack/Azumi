// Menu related validations
export * from "./menu.validation";
export * from "./pack.validation";
export * from "./option.validation";

// Shop related validations
export * from "./shop.validation";

// Rider related validations
export * from "./rider.validation";

// address vaidations
export * from "./address.validation";
// Common types and utilities
import { z } from "zod";

const phoneRegex = /^\+?[1-9]\d{1,14}$/;

// export const createShopSchema = z.object({
//   shopName: z.string().min(3).max(30),
//   shopType: z.string().min(1, { message: "Business type is required" }),
//   address: z.string().min(1, { message: "Street address is required" }),
//   phoneNumber: z
//     .string()
//     .regex(phoneRegex, { message: "Invalid phone number format" }),
//   logo: z.string().optional(),
//   coverImage: z.string().optional(),

//   email: z.string().email({ message: "Invalid email format" }),
// });

export const createShopOperatingHoursSchema = z.object({
  shopId: z.string().min(1, { message: "Shop ID is required" }),
  day: z.string().min(1, { message: "Day is required" }),
  openTime: z.string().min(1, { message: "Open time is required" }),
  closeTime: z.string().min(1, { message: "Close time is required" }),
  isOpen: z.boolean().default(true),
});

export const updateShopOperatingHoursSchema =
  createShopOperatingHoursSchema.partial();

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

export const registerSchema = z
  .object({
    email: z.string().email(),
    firstName: z.string().min(3).max(20),
    lastName: z.string().min(3).max(20),
    password: z.string().min(8).max(100),
    confirmPassword: z.string().min(8).max(100),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
