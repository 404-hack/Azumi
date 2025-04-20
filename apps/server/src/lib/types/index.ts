import { DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "../db/schema";
import { ContextVariables } from "hono";

// Database Types
export type TUser = typeof schema.userTable.$inferSelect;

export type TSession = typeof schema.session.$inferSelect;

export type TMenuCategory = Omit<
  typeof schema.menuCategoryTable.$inferSelect,
  "createdAt" | "updatedAt"
>;

export type TMenu = typeof schema.menuItemTable.$inferSelect;

export type TShop = typeof schema.shopTable.$inferSelect;

export type TMenuCategoryWithItems = Omit<
  TMenuCategory,
  "createdAt" | "updatedAt"
> & { menus: Omit<TMenu, "createdAt" | "updatedAt">[] };

export type TAddress = Omit<
  typeof schema.addressTable.$inferSelect,
  "createdAt" | "updatedAt"
>;

export type TOption = typeof schema.optionTable.$inferSelect;

export type TOptionGroup = Omit<
  typeof schema.optionGroupTable.$inferSelect,
  "createdAt" | "updatedAt"
>;

// export type TAddress = Omit<
//   typeof schema.optionGroupTable.$inferSelect,
//   "createdAt" | "updatedAt"
// >;
export type TOptionToOptionGroup =
  typeof schema.optionToOptionGroupTable.$inferSelect;

export type TOptionGroupWithOptions = Omit<
  typeof schema.optionGroupTable.$inferSelect,
  "createdAt" | "updatedAt"
> & {
  optionsToOptionGroups: (TOptionToOptionGroup & { option: TOption })[];
};

export type TPack = Omit<
  typeof schema.packTable.$inferSelect,
  "createdAt" | "updatedAt"
>;

export type TShopTodo = typeof schema.shopTodoTable.$inferSelect;
export type TOperatingHours =
  typeof schema.shopOperatingHoursTable.$inferSelect;
// Hono Context Variables
export type Variables = {
  db: DrizzleD1Database<typeof schema>;
  user: TUser | null;
  session: TSession | null;
  orgId: string;
};

// Hono Context Type
export type Context = ContextVariables<{
  Variables: Variables;
}>;

// Shop Types
export type TShopMetadata = {
  phoneNumber: string;
  address: string;
  email: string;
  logo?: string;
  coverImage?: string;
  shopName: string;
  shopType: string;
};

export interface TCoordinates {
  lat: number;
  lng: number;
  name: string; // Optional: name of the location
  address: string; // Optional: formatted address
}
