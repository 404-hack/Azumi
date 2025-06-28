import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export const createClient = (connectionString: string) => {
  const sql = postgres(connectionString);
  return drizzle({ schema, casing: "snake_case", client: sql });
};
