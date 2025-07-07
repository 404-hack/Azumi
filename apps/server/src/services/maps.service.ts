interface DistanceResult {
  distance: number;
  duration: number;
  distanceText: string;
  durationText: string;
}

interface MapsApiResponse {
  status: string;
  error_message?: string;
  routes?: Array<{
    legs: Array<{
      distance?: { value: number; text: string };
      duration?: { value: number; text: string };
    }>;
  }>;
}

interface DistanceMatrixResponse {
  status: string;
  error_message?: string;
  origin_addresses: string[];
  destination_addresses: string[];
  rows: Array<{
    elements: Array<{
      status: string;
      distance?: { value: number; text: string };
      duration?: { value: number; text: string };
    }>;
  }>;
}

class MapsService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getDistanceAndETA(
    originLat: number,
    originLng: number,
    destLat: number,
    destLng: number
  ): Promise<DistanceResult | null> {
    try {
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originLat},${originLng}&destination=${destLat},${destLng}&key=${this.apiKey}`;

      const response = await fetch(url);
      const data = (await response.json()) as MapsApiResponse;

      if (data.status !== "OK" || !data.routes?.[0]?.legs?.[0]) {
        console.warn(
          "Maps API request failed:",
          data.status,
          data.error_message || "No error message"
        );
        return null;
      }

      const leg = data.routes[0].legs[0];

      const drivingDurationSeconds = leg.duration?.value || 0;
      const cyclingDurationText = this.convertDrivingToCycling(
        drivingDurationSeconds
      );

      return {
        distance: leg.distance?.value || 0,
        duration: drivingDurationSeconds,
        distanceText: leg.distance?.text || "",
        durationText: cyclingDurationText,
      };
    } catch (error) {
      console.error("Error calling Maps API:", error);
      return null;
    }
  }

  async getBatchDistanceAndETA(
    origin: { lat: number; lng: number },
    destinations: Array<{ lat: number; lng: number; id: string }>
  ): Promise<Map<string, DistanceResult>> {
    const results = new Map<string, DistanceResult>();

    if (destinations.length === 0) {
      return results;
    }

    const destinationCoords = destinations
      .map((dest) => `${dest.lat},${dest.lng}`)
      .join("|");
    const originCoord = `${origin.lat},${origin.lng}`;

    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(originCoord)}&destinations=${encodeURIComponent(destinationCoords)}&units=metric&mode=driving&key=${this.apiKey}`;

    try {
      const response = await fetch(url);
      const data: DistanceMatrixResponse = await response.json();

      if (data.status !== "OK") {
        console.warn(
          "Distance Matrix API returned non-OK status:",
          data.status,
          data.error_message
        );
        return results;
      }

      if (!data.rows || data.rows.length === 0) {
        console.warn("Distance Matrix API returned no rows");
        return results;
      }

      const elements = data.rows[0].elements;

      destinations.forEach((dest, index) => {
        const element = elements[index];

        if (!element || element.status !== "OK") {
          console.warn(
            `Distance Matrix element ${index} failed:`,
            element?.status
          );
          return;
        }

        const drivingDurationSeconds = element.duration?.value || 0;
        const cyclingDurationText = this.convertDrivingToCycling(
          drivingDurationSeconds
        );

        results.set(dest.id, {
          distance: element.distance?.value || 0,
          duration: drivingDurationSeconds,
          distanceText: element.distance?.text || "",
          durationText: cyclingDurationText,
        });
      });

      return results;
    } catch (error) {
      console.error("Error calling Distance Matrix API:", error);
      return results;
    }
  }

  async getBatchDistanceAndETALarge(
    origin: { lat: number; lng: number },
    destinations: Array<{ lat: number; lng: number; id: string }>,
    maxDestinations: number = 25
  ): Promise<Map<string, DistanceResult>> {
    const allResults = new Map<string, DistanceResult>();

    if (destinations.length === 0) {
      return allResults;
    }

    const chunks = [];
    for (let i = 0; i < destinations.length; i += maxDestinations) {
      chunks.push(destinations.slice(i, i + maxDestinations));
    }

    console.log(
      `Processing ${destinations.length} destinations in ${chunks.length} chunks`
    );

    for (const [chunkIndex, chunk] of chunks.entries()) {
      try {
        console.log(
          `Processing chunk ${chunkIndex + 1}/${chunks.length} with ${chunk.length} destinations`
        );

        const chunkResults = await this.getBatchDistanceAndETA(origin, chunk);

        chunkResults.forEach((value, key) => {
          allResults.set(key, value);
        });

        if (chunkIndex < chunks.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.error(`Error processing chunk ${chunkIndex + 1}:`, error);
      }
    }

    return allResults;
  }

  private convertDrivingToCycling(drivingDurationSeconds: number): string {
    const drivingMinutes = drivingDurationSeconds / 60;

    const cyclingMultiplier = 2.5;
    const bufferMinutes = 6;
    const rangeHalfWidth = 5;
    const minimumEstimateCenter = 15;

    const baseCyclingMinutes = drivingMinutes * cyclingMultiplier;
    const totalEstimatedTime = baseCyclingMinutes + bufferMinutes;
    const centerRounded = Math.round(totalEstimatedTime / 5) * 5;
    const finalCenter = Math.max(minimumEstimateCenter, centerRounded);

    const lowerBound = finalCenter - rangeHalfWidth;
    const upperBound = finalCenter + rangeHalfWidth;

    return `${lowerBound}-${upperBound} min`;
  }
}

export { MapsService, type DistanceResult };
