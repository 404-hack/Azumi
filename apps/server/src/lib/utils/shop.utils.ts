import type { TOperatingHours } from "../types";
import { calculateDistance } from "./geo";

// Helper function to parse time string (HH:MM) into minutes from midnight
export const parseTimeStringToMinutes = (
  timeStr: string | null | undefined
): number => {
  if (!timeStr) return 0;
  try {
    const [hours, minutes] = timeStr.split(":").map(Number);
    return (hours || 0) * 60 + (minutes || 0);
  } catch {
    return 0; // Return 0 if parsing fails
  }
};

// Helper function to check if a shop is currently open (using frontend logic)
export const isShopCurrentlyOpen = (
  operatingHours: TOperatingHours[] | undefined | null,
  currentDayString: string, // e.g., "MONDAY"
  currentTimeMinutes: number // Minutes since midnight
): boolean => {
  if (!operatingHours || operatingHours.length === 0) return false;

  const todayHours = operatingHours.find(
    (h) => h.day.toUpperCase() === currentDayString.toUpperCase() // Case-insensitive comparison
  );

  // Check if hours exist for today, if the shop is marked as open, and if times are valid
  if (
    !todayHours ||
    todayHours.isOpen === false ||
    !todayHours.openTime ||
    !todayHours.closeTime
  ) {
    return false;
  }

  // Parse time strings to minutes for comparison
  const openTimeMinutes = parseTimeStringToMinutes(todayHours.openTime);
  const closeTimeMinutes = parseTimeStringToMinutes(todayHours.closeTime);

  // Check if current time is between opening and closing (exclusive of closing time)
  // Note: This does NOT handle overnight closing times like the previous backend logic did.
  return (
    currentTimeMinutes >= openTimeMinutes &&
    currentTimeMinutes < closeTimeMinutes
  );
};

export { calculateDistance as calculateHaversineDistance };

/**
 * Calculates the delivery fee based on distance in Nigerian Naira (NGN).
 * @param distanceKm The distance in kilometers.
 * @returns The calculated delivery fee, rounded to the nearest 50 NGN.
 */
export const calculateDeliveryFee = (distanceKm: number): number => {
  const baseFee = 350; // Base fee in NGN (covers first ~1km)
  const perKmFee = 150; // Fee per km after the first km in NGN
  const minimumDistanceForPerKm = 1; // Distance (km) included in the base fee

  let deliveryFee = baseFee;

  if (distanceKm > minimumDistanceForPerKm) {
    deliveryFee += (distanceKm - minimumDistanceForPerKm) * perKmFee;
  }

  // Ensure the fee is at least the base fee and round to nearest 50 Naira for cleaner pricing
  const finalFee = Math.max(baseFee, deliveryFee);
  return Math.round(finalFee / 50) * 50;
};

/**
 * Estimates the total delivery time range based on distance.
 * @param distanceKm The distance in kilometers.
 * @returns A string representing the estimated time range (e.g., "10-20 min").
 */
export const estimateTravelTime = (distanceKm: number): string => {
  const averageSpeedKmh = 17.5;
  const averageBufferMinutes = 6;
  const rangeHalfWidth = 5;
  const minimumEstimateCenter = 15;

  const baseTimeMinutes = (distanceKm / averageSpeedKmh) * 60;
  const totalEstimatedTime = baseTimeMinutes + averageBufferMinutes;
  const centerRounded = Math.round(totalEstimatedTime / 5) * 5;
  const finalCenter = Math.max(minimumEstimateCenter, centerRounded);

  const lowerBound = finalCenter - rangeHalfWidth;
  const upperBound = finalCenter + rangeHalfWidth;

  return `${lowerBound}-${upperBound} min`;
};
