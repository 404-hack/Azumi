/**
 * Calculates the distance between two geographic coordinates using the Haversine formula
 * @param lat1 Latitude of point 1 (in decimal degrees)
 * @param lon1 Longitude of point 1 (in decimal degrees)
 * @param lat2 Latitude of point 2 (in decimal degrees)
 * @param lon2 Longitude of point 2 (in decimal degrees)
 * @returns Distance between points in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export { calculateDistance as calculateHaversineDistance };

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
