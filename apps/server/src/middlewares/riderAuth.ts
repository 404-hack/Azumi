import { createMiddleware } from "hono/factory";
import { factory } from "../lib/factory";
import { riderTable } from "../lib/db/schema/rider.schema";
import { eq } from "drizzle-orm";
import { except } from "hono/combine";

/**
 * Combined rider authentication middleware
 * 1. Always checks if user is authenticated
 * 2. For non-apply endpoints, also verifies the user is a registered rider
 */
const riderAuthMiddleware = factory.createMiddleware(async (c, next) => {
  const session = c.get("session");
  const user = c.get("user");

  // Check if user is authenticated
  if (!session || !user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  // Store the user ID in context for easy access in route handlers
  c.set("userId", user.id);

  // Check if it's the /apply endpoint - skip rider verification
  if (c.req.path.endsWith("/apply")) {
    await next();
    return;
  }

  // For all other endpoints, verify the user is a registered rider
  const db = c.get("db");
  const riderProfile = await db.query.riderTable.findFirst({
    where: eq(riderTable.userId, user.id),
  });

  if (!riderProfile) {
    return c.json({ message: "Not registered as a rider" }, 403);
    console.log("error 1");
  }

  // Store rider profile in context for easy access
  c.set("rider", riderProfile);

  await next();
});

export default riderAuthMiddleware;
