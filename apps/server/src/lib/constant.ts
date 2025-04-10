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
  "PREPARING",
  "READY",
  "IN_TRANSIT",
  "DELIVERED",
  "COMPLETED",
  "CANCELLED",
] as const;

export const PAYMENT_STATUS = [
  "PENDING",
  "COMPLETED",
  "FAILED",
  "REFUNDED",
  "DISPUTED",
  "REVERSED",
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
  "PENDING",
  "APPROVED",
  "REJECTED",
  "SUSPENDED",
] as const;

export const SHOP_AGREEMENTS_TYPE = ["VENDOR_TERMS"] as const;

export const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://staging.azumi.pages.dev",
  "https://azumi-server-staging.sphade012.workers.dev",
  "https://azumi.pages.dev",
  // Add your production origins here
];
