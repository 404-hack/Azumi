import { Hono } from "hono";
import { factory } from "./lib/factory";
import customCors from "./middlewares/cors";
import shopRoute from "./routes/shop.route";
// import { auth } from "./lib/auth";
import { logger } from "hono/logger";
import { createAuth } from "./lib/auth";
import userRoute from "./routes/user.route";
// import authRoute from "./lib/auth";
import { cors } from "hono/cors";
import menuRoute from "./routes/menu.route";
import optionRoute from "./routes/option.route";
import packRoute from "./routes/pack.route";
import orderRoute from "./routes/order.route";
// import riderRoute from "./routes/rider.route";
// import cartRoute from "./routes/cart.route";
// import addressRoute from "./routes/address.route";
// import promotionRoute from "./routes/promotion.route";
import bucketRoute from "./routes/bucket.route";
import vendorRoute from "./routes/vendor.route";
import cartRoute from "./routes/cart.route";
import addressRoute from "./routes/address.route";
import paystackWebhookRoute from "./routes/paystack-webhook.route";

// Create app instance using factory
const app = factory
  .createApp()
  .basePath("/api")
  // Add global middleware
  .use("*", customCors);
app.on(["POST", "GET"], "/auth/*", async (c) => {
  const db = c.get("db");
  const auth = await createAuth(db);
  return auth.handler(c.req.raw);
});
// Mount routes
export const routes = app
  .route("/user", userRoute)
  .route("/shop", shopRoute)
  .route("/vendor", vendorRoute)
  .route("/order", orderRoute)
  .route("/menu", menuRoute)
  .route("/pack", packRoute)
  .route("/option", optionRoute)
  .route("/cart", cartRoute)
  .route("/address", addressRoute)
  .route("/webhook/paystack", paystackWebhookRoute)
  // .route("/rider", riderRoute)
  .route("/", bucketRoute)
  // app.route("/auth", authRoute);
  .get("/love", (c) => {
    return c.json({ message: "Welcome to the API" });
  });
export default app;
