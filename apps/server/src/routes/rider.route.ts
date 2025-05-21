import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { Context } from "../lib/types";
import { riderTable } from "../lib/db/schema/rider.schema";
import { factory } from "../lib/factory";
import { eq } from "drizzle-orm";
import riderAuthMiddleware from "../middlewares/riderAuth";
import {
  riderApplicationSchema, // Keep for backward compatibility
  createRiderSchema,
  updateRiderStatusSchema,
  updateLocationSchema,
} from "../lib/validation/rider.validation";

const riderRoute = factory
  .createApp()
  .use(riderAuthMiddleware)
  .post("/apply", zValidator("json", riderApplicationSchema), async (c) => {
    try {
      const db = c.get("db");
      const data = c.req.valid("json");
      const userId = c.get("userId");

      // Check if user already has a rider profile
      const existingRider = await db.query.riderTable.findFirst({
        where: eq(riderTable.id, userId),
      });

      if (existingRider) {
        return c.json({ error: "You are already registered as a rider" }, 400);
      }

      const rider = await db
        .insert(riderTable)
        .values({
          userId: userId, // Use the authenticated user's ID
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email, // Prefer user's email from auth
          address: data.address,
          longitude: data.longitude,
          latitude: data.latitude,
          vehicleType: data.vehicleType,
          vehicleLicense: data.vehicleLicense,
          isVerified: false,
        })
        .returning()
        .get();

      return c.json(
        { message: "Application submitted successfully", data: rider },
        201
      );
    } catch (error) {
      console.error("Error submitting application:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  })

  .get("/profile/:id", async (c) => {
    try {
      const db = c.get("db");
      const { id } = c.req.param();

      const rider = await db.query.riderTable.findFirst({
        where: eq(riderTable.id, id),
      });

      if (!rider) {
        return c.json({ error: "Rider not found" }, 404);
      }

      return c.json({ data: rider });
    } catch (error) {
      console.error("Error fetching rider:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  })
  .patch("/status", zValidator("json", updateRiderStatusSchema), async (c) => {
    try {
      const db = c.get("db");
      const userId = c.get("userId");
      const { status, latitude, longitude } = c.req.valid("json");

      const updatedRider = await db
        .update(riderTable)
        .set({
          availabilityStatus: status,
          longitude,
          latitude,
        })
        .where(eq(riderTable.id, userId))
        .returning()
        .get();

      return c.json({ data: updatedRider });
    } catch (error) {
      console.error("Error updating status:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  })
  .patch("/location", zValidator("json", updateLocationSchema), async (c) => {
    try {
      const db = c.get("db");
      const userId = c.get("userId");
      const { latitude, longitude } = c.req.valid("json");

      const updatedRider = await db
        .update(riderTable)
        .set({ latitude, longitude })
        .where(eq(riderTable.id, userId))
        .returning()
        .get();

      return c.json({ data: updatedRider });
    } catch (error) {
      console.error("Error updating location:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  });

export default riderRoute;
