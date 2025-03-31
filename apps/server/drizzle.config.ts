import { defineConfig } from "drizzle-kit";
export default defineConfig({
  schema: "./src/lib/server/db/schema",
  dbCredentials: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
    token: process.env.CLOUDFLARE_TOKEN!,
    databaseId: process.env.CLOUDFLARE_DATABASE_ID!,
  },
  verbose: true,
  strict: true,
  dialect: "sqlite",
  out: "./migrations",
  driver: "d1-http",
});
