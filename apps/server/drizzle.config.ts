import { defineConfig } from "drizzle-kit";
import { env } from "cloudflare:workers";

export default defineConfig({
  schema: "./src/lib/db/schema",
  dbCredentials: {
    url: env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
  dialect: "postgresql",
  out: "./drizzle/migrations",
  casing: "snake_case",
});
