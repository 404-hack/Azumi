import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { Context } from "../lib/types";
import { riders } from "../lib/db/schema/rider.schema";
import { factory } from "../lib/factory";
import { eq } from "drizzle-orm";
import { createAuth } from "../lib/auth";
import { nanoid } from "nanoid";
import {
  riderApplicationSchema,
  updateRiderStatusSchema,
  updateLocationSchema,
} from "../lib/validation/rider.validation";

const riderRoute = factory
  .createApp()
  .post("/apply", zValidator("json", riderApplicationSchema), async (c) => {
    try {
      const db = c.get("db");
      const data = c.req.valid("json");
      const auth = await createAuth(db);

      const registerResponse = await auth.api.signUpEmail({
        body: {
          email: data.email,
          password: nanoid(12),
          name: `${data.firstName} ${data.lastName}`,
        },
      });

      if (!registerResponse) {
        return c.json({ error: "Failed to create user account" }, 400);
      }

      const rider = await db
        .insert(riders)
        .values({
          id: registerResponse.user.id,
          vehicleType: data.vehicleType,
          licensePlate: data.licensePlate,
          idDocument: data.idDocument,
          status: "offline",
          isVerified: false,
          currentLocation: null,
          activeArea: { city: data.city, address: data.address },
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

      const rider = await db.query.riders.findFirst({
        where: eq(riders.id, id),
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
      const user = c.get("user");
      const { status, currentLocation } = c.req.valid("json");

      if (!user) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const updatedRider = await db
        .update(riders)
        .set({ status, currentLocation: currentLocation })
        .where(eq(riders.id, user.id))
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
      const user = c.get("user");
      const { latitude, longitude } = c.req.valid("json");

      if (!user) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const updatedRider = await db
        .update(riders)
        .set({ currentLocation: { latitude, longitude } })
        .where(eq(riders.id, user.id))
        .returning()
        .get();

      return c.json({ data: updatedRider });
    } catch (error) {
      console.error("Error updating location:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  });

export default riderRoute;
