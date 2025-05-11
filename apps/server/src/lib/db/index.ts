import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export const createClient = (db: D1Database) => {
  return drizzle(db, { schema, casing: "snake_case" });
};
