import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/lib/db/schema",
  verbose: true,
  strict: false,
  dialect: "sqlite",
  out: "./drizzle/dev-migrations",
  breakpoints: true,
  casing: "snake_case",
  dbCredentials: {
    url: ".wrangler/state/v3/d1/miniflare-D1DatabaseObject/72ed3b9b80a5a675d309a239c4b086794ee5a7834ba3fb77b45caaa8b2d0f53c.sqlite",
  },
});
