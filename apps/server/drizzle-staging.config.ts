import { defineConfig } from "drizzle-kit";
import dotenv from "dotenv";
import { env } from "node:process";

// Configure dotenv with options
// dotenv.config();

export default defineConfig({
  schema: "./src/lib/db/schema",
  dbCredentials: {
    accountId: env.CLOUDFLARE_ACCOUNT_ID!,
    token: env.CLOUDFLARE_API_TOKEN!,
    databaseId: env.CLOUDFLARE_STAGING_DATABASE_ID!,
  },
  verbose: true,
  strict: true,
  dialect: "sqlite",
  out: "./drizzle/staging-migrations",
  driver: "d1-http",
  casing: "snake_case",
});
