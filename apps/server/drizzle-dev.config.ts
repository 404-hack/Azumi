import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/lib/db/schema",
  verbose: true,
  strict: false,
  dialect: "sqlite",
  out: "./migrations",
  casing: "snake_case",
  dbCredentials: {
    url: ".wrangler/state/v3/d1/miniflare-D1DatabaseObject/3437212e061cf1346ce4dd5f2802c4e1b2cda53c2c5277d81370f5d323a6c6a4.sqlite",
  },
});
