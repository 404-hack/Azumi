import { text, integer } from "drizzle-orm/sqlite-core";

export const timestamps = {
  createdAt: integer("created_at", { mode: "timestamp" }).$default(
    () => new Date()
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$onUpdate(
    () => new Date()
  ),
};

export function array<T>() {
  return text("", { mode: "json" }).$type<T[]>();
}
