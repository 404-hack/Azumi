import { createMiddleware } from "hono/factory";
import { factory } from "../lib/factory";

/**
 * Vendor authentication middleware
 * Protects vendor routes by checking if a valid organization ID exists in the session
 * Stores the orgId in context for easy access in route handlers
 */
const vendorAuthMiddleware = factory.createMiddleware(async (c, next) => {
  const session = c.get("session");
  const orgId = session?.activeOrganizationId;

  if (!orgId) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  // Store the orgId in context for easy access in route handlers
  c.set("orgId", orgId);
  await next();
});

export default vendorAuthMiddleware;
