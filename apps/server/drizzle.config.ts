import { defineConfig } from "drizzle-kit";
import dotenv from "dotenv";

// Configure dotenv with options
// dotenv.config();

export default defineConfig({
  schema: "./src/lib/db/schema",
  dbCredentials: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
    token: process.env.CLOUDFLARE_API_TOKEN!,
    databaseId: process.env.CLOUDFLARE_DATABASE_ID!,
  },
  verbose: true,
  strict: true,
  dialect: "sqlite",
  out: "./migrations",
  driver: "d1-http",
});
