import { sql } from "drizzle-orm";

export function createPoint(lng: number, lat: number) {
  return sql`ST_Point(${lng}, ${lat})`;
}

export function createPointWithSRID(
  lng: number,
  lat: number,
  srid: number = 4326
) {
  return sql`ST_SetSRID(ST_Point(${lng}, ${lat}), ${srid})`;
}

export function distanceInKm(point1: any, point2: any) {
  return sql`ST_Distance(${point1}::geography, ${point2}::geography) / 1000`;
}

export function withinRadius(
  centerPoint: any,
  targetPoint: any,
  radiusKm: number
) {
  return sql`ST_DWithin(${centerPoint}::geography, ${targetPoint}::geography, ${radiusKm * 1000})`;
}

export function orderByDistance(fromPoint: any, toPoint: any) {
  return sql`ST_Distance(${fromPoint}::geography, ${toPoint}::geography)`;
}

export function nearestNeighbors(
  centerPoint: any,
  locationColumn: any,
  limit: number = 10
) {
  return sql`${locationColumn} <-> ${centerPoint}`;
}

export function boundingBox(
  centerLng: number,
  centerLat: number,
  radiusKm: number
) {
  return sql`ST_MakeEnvelope(
    ${centerLng - radiusKm / 111.0}, 
    ${centerLat - radiusKm / 111.0}, 
    ${centerLng + radiusKm / 111.0}, 
    ${centerLat + radiusKm / 111.0}, 
    4326
  )`;
}

export const SpatialFunctions = {
  createPoint,
  createPointWithSRID,
  distanceInKm,
  withinRadius,
  orderByDistance,
  nearestNeighbors,
  boundingBox,
} as const;
