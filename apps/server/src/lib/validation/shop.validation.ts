import { z } from "zod";
import { DELIVERY_TYPE, DAYS_OF_WEEK } from "../constant";

export const coordinatesSchema = z.object({
  lat: z.number({ message: "Latitude must be a number" }),
  lng: z.number({ message: "Longitude must be a number" }),
  name: z.string().min(1, { message: "Location name is required" }),
  address: z.string().min(1, { message: "Location address is required" }),
});

export const createShopSchema = z.object({
  name: z.string().min(1, { message: "Shop name is required" }),
  address: z.string().min(1, { message: "Address is required" }),
  phone: z
    .string()
    .min(1, { message: "Phone number is required" })
    .regex(/^(?:\+?234|0)[789][01]\d{8}$/, {
      message: "Please enter a valid Nigerian phone number",
    })
    .transform((val) => {
      // Normalize to international format
      if (val.startsWith("0")) {
        return "+234" + val.slice(1);
      }
      if (val.startsWith("234")) {
        return "+" + val;
      }
      return val;
    }),
  email: z.string().email({ message: "Invalid email format" }),
  type: z.string().min(1, { message: "Business type is required" }),
  active: z.boolean().default(false),
  description: z.string().optional(),
  website: z.string().optional(),
  deliveryType: z.enum(DELIVERY_TYPE).nullable().optional(),
  coordinates: coordinatesSchema.required(),
});

export const timeSchema = z
  .string()
  .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "Invalid time format. Use HH:mm format",
  });

export const dayScheduleSchema = z
  .object({
    day: z.string(),
    isOpen: z.boolean(),
    openTime: timeSchema,
    closeTime: timeSchema,
  })
  .refine(
    (data) => {
      if (!data.isOpen) return true;
      const [openHour, openMin] = data.openTime.split(":").map(Number);
      const [closeHour, closeMin] = data.closeTime.split(":").map(Number);
      const openingMinutes = openHour * 60 + openMin;
      const closingMinutes = closeHour * 60 + closeMin;
      return closingMinutes > openingMinutes;
    },
    {
      message: "Closing time must be after opening time",
      path: ["closingTime"],
    }
  );

export const updateShopSchema = createShopSchema.partial();
