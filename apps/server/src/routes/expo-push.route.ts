import { factory } from "../lib/factory";
import { ExpoPushService } from "../services/expo-push.service";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

const expoPushService = new ExpoPushService();

const registerTokenSchema = z.object({
  expoPushToken: z.string().min(1, "Expo push token is required"),
  deviceId: z.string().optional(),
});

const sendNotificationSchema = z.object({
  title: z.string().min(1, "Title is required"),
  body: z.string().min(1, "Body is required"),
  data: z.record(z.any()).optional(),
  sound: z.string().optional(),
  badge: z.number().optional(),
});

const expoPushRoute = factory
  .createApp()
  .post(
    "/register-token",
    zValidator("json", registerTokenSchema),
    async (c) => {
      const session = c.get("session");
      const user = c.get("user");

      if (!session || !user) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const { expoPushToken, deviceId } = c.req.valid("json");

      try {
        const success = await expoPushService.registerToken(
          user.id,
          expoPushToken,
          deviceId
        );

        if (success) {
          return c.json({
            success: true,
            message: "Expo push token registered successfully",
          });
        } else {
          return c.json({ error: "Failed to register token" }, 500);
        }
      } catch (error) {
        console.error("Error registering Expo token:", error);
        return c.json({ error: "Failed to register token" }, 500);
      }
    }
  )
  .post(
    "/send-notification",
    zValidator("json", sendNotificationSchema),
    async (c) => {
      const session = c.get("session");
      const user = c.get("user");

      if (!session || !user) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const payload = c.req.valid("json");

      try {
        const success = await expoPushService.sendToUser(user.id, payload);

        if (success) {
          return c.json({
            success: true,
            message: "Notification sent successfully",
          });
        } else {
          return c.json({ error: "Failed to send notification" }, 500);
        }
      } catch (error) {
        console.error("Error sending Expo notification:", error);
        return c.json({ error: "Failed to send notification" }, 500);
      }
    }
  );

export default expoPushRoute;
