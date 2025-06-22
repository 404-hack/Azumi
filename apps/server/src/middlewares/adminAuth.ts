import { createMiddleware } from "hono/factory";
import { factory } from "../lib/factory";

/**
 * Admin authentication middleware
 * Simple protection for admin routes
 */
const adminAuthMiddleware = factory.createMiddleware(async (c, next) => {
  // Get the session from context
  const session = c.get("session");

  // Basic check: is there a session?
  if (!session) {
    return c.json({ message: "Unauthorized" }, 401);
  }
  // Get the user from authentication context
  const user = c.get("user");

  // Simple admin check - using user data
  const isAdmin = user?.role === "admin";

  // Allow impersonation by admins
  const isImpersonating = !!session.impersonatedBy;

  if (isAdmin || isImpersonating) {
    await next();
    return;
  }

  // Access denied
  return c.json({ message: "Admin access required" }, 403);
});

export default adminAuthMiddleware;
