/**
 * Calculates the distance between two geographic coordinates using the Haversine formula
 * @param lat1 Latitude of point 1 (in decimal degrees)
 * @param lon1 Longitude of point 1 (in decimal degrees)
 * @param lat2 Latitude of point 2 (in decimal degrees)
 * @param lon2 Longitude of point 2 (in decimal degrees)
 * @returns Distance between points in kilometers
 */
export { calculateHaversineDistance as calculateDistance } from "./shop.utils";

/**
 * Calculates the estimated travel time between two points
 * @param distanceKm Distance in kilometers
 * @param speedKmh Average speed in km/h
 * @returns Estimated travel time in minutes
 */
export function calculateTravelTime(
  distanceKm: number,
  speedKmh: number = 20
): number {
  return Math.round((distanceKm / speedKmh) * 60);
}
