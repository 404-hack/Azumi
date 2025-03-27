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

export const SHOP_AGREEMENTS_TYPE = [
  "TERMS_OF_SERVICE",
  "PRIVACY_POLICY",
  "REFUND_POLICY",
  "DELIVERY_POLICY",
  "RETURN_POLICY",
] as const;
