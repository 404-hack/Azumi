import { z } from "zod";
import { factory } from "../lib/factory";
import { zValidator } from "@hono/zod-validator";
import { loginSchema, registerSchema } from "../lib/validation";
import { createAuth } from "../lib/auth";

const authRoute = factory.createApp();

authRoute.post("/login", zValidator("json", loginSchema), async (c) => {
  const { email, password } = c.req.valid("json");
  console.log({ email, password });
  const db = c.get("db");
  const auth = await createAuth(db);
  const loginResponse = await auth.api.signInEmail({
    headers: c.req.raw.headers,
    body: { email, password },
  });
  return c.json({
    message: "success",
  });
});
authRoute.post("/register", zValidator("json", registerSchema), async (c) => {
  const { email, firstName, lastName, password, confirmPassword } =
    c.req.valid("json");
  console.log({ email, firstName, lastName, password });
  const db = c.get("db");
  const auth = await createAuth(db);
  const registerResponse = await auth.api.signUpEmail({
    body: { email, password, name: lastName + " " + firstName },
  });
  console.log("🚀 ~ authRoute.post ~ registerResponse:", registerResponse);
  return c.json({
    message: "success",
  });
});

export default authRoute;
