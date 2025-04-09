import { ALLOWED_ORIGINS } from "../lib/constant";
import { factory } from "../lib/factory";
import { cors } from "hono/cors";

// factory also has `createMiddleware()`

const customCors = factory.createMiddleware(async (c, next) => {
  const origin = c.req.header("Origin");

  const corsMiddlewareHandler = cors({
    origin: ALLOWED_ORIGINS, // Use specific origin instead of wildcard
    allowMethods: ["POST", "GET", "OPTIONS", "PUT", "DELETE", "PATCH"],
    allowHeaders: ["Content-Type", "Authorization"], // Allow needed headers
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
    credentials: true, // Enable credentials support
  });

  return corsMiddlewareHandler(c, next);
});

export default customCors;
