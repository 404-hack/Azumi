import type { TOperatingHours } from "../types";

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

/**
 * Calculates the great-circle distance between two points
 * on the Earth (specified in decimal degrees) using the Haversine formula.
 * @param lat1 Latitude of the first point.
 * @param lon1 Longitude of the first point.
 * @param lat2 Latitude of the second point.
 * @param lon2 Longitude of the second point.
 * @returns The distance in kilometers.
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
}

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
