import { factory } from "../lib/factory";
import { cors } from "hono/cors";
// factory also has `createMiddleware()`
const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  // Add your production origins here
];
const customCors = factory.createMiddleware(async (c, next) => {
  const origin = c.req.header("Origin");
  const corsMiddlewareHandler = cors({
    origin: ["http://localhost:5173", "https://azumi.pages.dev"],
    allowMethods: ["POST", "GET", "OPTIONS", "PUT", "DELETE", "PATCH"],
    allowHeaders: ["Content-Type", "Authorization"], // Allow needed headers
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
    credentials: true,
  });
  return corsMiddlewareHandler(c, next);
});
export default customCors;
