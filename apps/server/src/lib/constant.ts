export const DAYS_OF_WEEK = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

export const SHOP_TYPES = ["restaurant", "cafe", "bar"] as const;

export const ORDER_STATUS = [
  "PENDING",
  "PAYMENT_CONFIRMED",
  "CONFIRMED",
  "READY",
  "RIDER_ASSIGNED",
  "IN_TRANSIT",
  "DELIVERED",
  "COMPLETED",
  "CANCELLED",
] as const;

export type OrderStatus = (typeof ORDER_STATUS)[number];

export const PAYMENT_STATUS = [
  "PENDING",
  "COMPLETED",
  "FAILED",
  "REFUNDED",
  "DISPUTED",
  "REVERSED",
] as const;

export const REFUND_STATUS = [
  "PENDING",
  "PROCESSING",
  "COMPLETED",
  "FAILED",
] as const;

export const RIDER_APPLICATION_STATUS = [
  "DRAFT",
  "PENDING",
  "DOCUMENT_VERIFICATION",
  "BACKGROUND_CHECK",
  "TRAINING",
  "APPROVED",
  "REJECTED",
  "SUSPENDED",
] as const;

export const RIDER_AVAILABILITY_STATUS = [
  "AVAILABLE",
  "UNAVAILABLE",
  "BUSY",
] as const;

export const VEHICLE_TYPES = [
  "MOTORCYCLE",
  "CAR",
  "BICYCLE",
  "TRICYCLE",
  "FOOT",
] as const;

export const RIDER_DOCUMENTS = [
  "NATIONAL_ID",
  "DRIVERS_LICENSE",
  "INTERNATIONAL_PASSPORT",
  "NIN",
] as const;

export const PAYMENT_METHODS = [
  "CARD",
  "CASH",
  "WALLET",
  "BANK_TRANSFER",
  "MOBILE_MONEY",
] as const;

export const DELIVERY_TYPE = ["INSTANT", "PRE_ORDER"] as const;

export const SHOP_STATUS = [
  "DRAFT",
  "PENDING",
  "APPROVED",
  "REJECTED",
  "SUSPENDED",
] as const;

export const SHOP_OWNERSHIP_TYPE = ["OFFICIAL", "SPECIAL"] as const;

export const SHOP_AGREEMENTS_TYPE = ["VENDOR_TERMS"] as const;

export const PROMOTION_TYPES = [
  "percentage",
  "fixed",
  "bogo",
  "minimum_spend",
] as const;

export const PROMOTION_COST_BEARER = ["VENDOR", "PLATFORM", "SHARED"] as const;

export const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://staging.azumi.pages.dev",
  "https://azumi-server-staging.sphade012.workers.dev",
  "https://azumi.pages.dev",
  "https://azumi.com.ng",
  // Add your production origins here
];
