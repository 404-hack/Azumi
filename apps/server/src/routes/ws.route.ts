import { upgradeWebSocket } from "hono/cloudflare-workers";
import { factory } from "../lib/factory";
import vendorAuthMiddleware from "../middlewares/vendorAuth";

const wsRoute = factory
  .createApp()
  .use("*", vendorAuthMiddleware)
  .get("/", async (c) => {
    const orgId = c.get("orgId");
    console.log(`WebSocket connection established for orgId: ${orgId}`);
    return c.json("WebSocket connection established");
  });

export default wsRoute;
