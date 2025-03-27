import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/lib/db/schema",
  // verbose: true,
  strict: false,
  dialect: "sqlite",
  out: "./migrations",
  breakpoints: true,
  casing: "snake_case",
  dbCredentials: {
    url: ".wrangler/state/v3/d1/miniflare-D1DatabaseObject/309a5dbdd6cae06f65440af64f390b5f341c90b63177c10d057726327cc2f535.sqlite",
  },
});
