import { z } from "zod";
import { factory } from "../lib/factory";
import { zValidator } from "@hono/zod-validator";
import { createShopSchema } from "../lib/validation";
import { shopTable } from "../lib/db/schema";
import { createAuth } from "../lib/auth";
const userRoute = factory
  .createApp()

  .get("/", async (c) => {
    const session = c.get("session");
    const user = c.get("user");
    console.log("🚀 ~ userRoute.get ~ user:", user);

    if (!user) return c.body(null, 401);

    return c.json({
      session,
      user,
    });
  })
  .post(
    "/login",
    zValidator(
      "json",
      z.object({
        email: z.string(),
        password: z.string(),
      })
    ),
    async (c) => {
      const { email, password } = c.req.valid("json");
      const db = c.get("db");
      const auth = await createAuth(db);
      const loginResponse = await auth.api.signInEmail({
        headers: c.req.raw.headers,
        body: { email, password },
      });
      console.log("🚀 ~ .get ~ loginResponse:", loginResponse);
      return c.json({
        message: "success",
      });
    }
  );

export default userRoute;
