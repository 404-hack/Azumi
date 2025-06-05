import { z } from "zod";
import { factory } from "../lib/factory";
import { zValidator } from "@hono/zod-validator";
import { calculateDistance } from "../lib/utils/geo";
import { calculateDeliveryFee } from "../lib/utils/shop.utils";

const deliveryFeeQuerySchema = z.object({
  userLat: z.coerce.number().min(-90).max(90),
  userLng: z.coerce.number().min(-180).max(180),
  shopLat: z.coerce.number().min(-90).max(90),
  shopLng: z.coerce.number().min(-180).max(180),
});

const deliveryFeeRoute = factory
  .createApp()
  .get("/", zValidator("query", deliveryFeeQuerySchema), async (c) => {
    try {
      const { userLat, userLng, shopLat, shopLng } = c.req.valid("query");
      const distanceKm = calculateDistance(userLat, userLng, shopLat, shopLng);
      const fee = calculateDeliveryFee(distanceKm);

      return c.json({ data: { deliveryFee: fee } });
    } catch (error) {
      console.error("Error calculating delivery fee:", error);
      return c.json({ error: "Failed to calculate delivery fee" }, 500);
    }
  });

export default deliveryFeeRoute;
