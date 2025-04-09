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
    url: ".wrangler/state/v3/d1/miniflare-D1DatabaseObject/291cfbd401dd3bd50acd8b1193e58ad777e8f8bec56704c71b950fe77f90f8d6.sqlite",
  },
});
