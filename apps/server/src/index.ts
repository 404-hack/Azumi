import { factory } from "./lib/factory";
import customCors from "./middlewares/cors";
import shopRoute from "./routes/shop.route";
import { createAuth } from "./lib/auth";
import userRoute from "./routes/user.route";
import menuRoute from "./routes/menu.route";
import optionRoute from "./routes/option.route";
import packRoute from "./routes/pack.route";
import orderRoute from "./routes/order.route";
import bucketRoute from "./routes/bucket.route";
import vendorRoute from "./routes/vendor.route";
import cartRoute from "./routes/cart.route";
import addressRoute from "./routes/address.route";
import paystackWebhookRoute from "./routes/paystack-webhook.route";
import favoriteRoute from "./routes/favorite.route";
import deliveryFeeRoute from "./routes/fee.route";
import wsRoute from "./routes/ws.route";
import adminRoute from "./routes/admin.route";
import riderRoute from "./routes/rider.route";
import promotionRoute from "./routes/promotion.route";

// Create app instance using factory
const app = factory
  .createApp({ strict: false })
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
  .route("/admin", adminRoute)
  .route("/favorite", favoriteRoute)
  .route("/order", orderRoute)
  .route("/menu", menuRoute)
  .route("/pack", packRoute)
  .route("/option", optionRoute)
  .route("/cart", cartRoute)
  .route("/address", addressRoute)
  .route("/delivery-fee", deliveryFeeRoute)
  .route("/webhook/paystack", paystackWebhookRoute)
  .route("/rider", riderRoute)
  .route("promotions", promotionRoute)
  .route("/", bucketRoute)
  .route("/ws", wsRoute)
  .get("/love", (c) => {
    return c.json({ message: "Welcome to the API" });
  });

export { OrderNotification } from "./durable-objects/order-notification.do";
export { OrderWorkflow } from "./workflows/order.workflow";

export default app;
