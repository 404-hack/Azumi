import { factory } from "../lib/factory";
import { fcmService } from "../services/fcm.service";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { eq, and, desc } from "drizzle-orm";
import {
  pushTokenTable,
  topicSubscriptionTable,
  notificationLogTable,
} from "../lib/db/schema";
import { nanoid } from "nanoid";

const fcmRoute = factory.createApp();

const registerTokenSchema = z.object({
  token: z.string().min(1),
  deviceId: z.string().optional(),
  deviceType: z.string().optional(),
  userAgent: z.string().optional(),
});

const sendNotificationSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  icon: z.string().optional(),
  image: z.string().optional(),
  data: z.record(z.string()).optional(),
  clickAction: z.string().optional(),
  token: z.string().optional(),
  userId: z.string().optional(),
  topic: z.string().optional(),
});

const topicSubscriptionSchema = z.object({
  topic: z.string().min(1),
  subscribe: z.boolean(),
});

fcmRoute.post(
  "/register-token",
  zValidator("json", registerTokenSchema),
  async (c) => {
    const session = c.get("session");
    if (!session) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { token, deviceId, deviceType, userAgent } = c.req.valid("json");
    const db = c.get("db");

    try {
      const existingToken = await db
        .select()
        .from(pushTokenTable)
        .where(
          and(
            eq(pushTokenTable.userId, session.userId),
            eq(pushTokenTable.token, token)
          )
        )
        .get();

      if (existingToken) {
        await db
          .update(pushTokenTable)
          .set({
            isActive: true,
            lastUsedAt: new Date(),
            updatedAt: new Date(),
            deviceId,
            deviceType,
            userAgent,
          })
          .where(eq(pushTokenTable.id, existingToken.id));

        return c.json({ success: true, message: "Token updated successfully" });
      }

      await db.insert(pushTokenTable).values({
        id: nanoid(),
        userId: session.userId,
        token,
        deviceId,
        deviceType,
        userAgent,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastUsedAt: new Date(),
      });

      return c.json({
        success: true,
        message: "Token registered successfully",
      });
    } catch (error) {
      console.error("Error registering FCM token:", error);
      return c.json({ error: "Failed to register token" }, 500);
    }
  }
);

fcmRoute.delete("/unregister-token/:token", async (c) => {
  const session = c.get("session");
  if (!session) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const token = c.req.param("token");
  const db = c.get("db");

  try {
    await db
      .update(pushTokenTable)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(pushTokenTable.userId, session.userId),
          eq(pushTokenTable.token, token)
        )
      );

    return c.json({
      success: true,
      message: "Token unregistered successfully",
    });
  } catch (error) {
    console.error("Error unregistering FCM token:", error);
    return c.json({ error: "Failed to unregister token" }, 500);
  }
});

fcmRoute.post(
  "/send-notification",
  zValidator("json", sendNotificationSchema),
  async (c) => {
    const session = c.get("session");
    if (!session || session.role !== "admin") {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const {
      title,
      body,
      icon,
      image,
      data,
      clickAction,
      token,
      userId,
      topic,
    } = c.req.valid("json");
    const db = c.get("db");

    try {
      let targetTokens: string[] = [];
      let targetUserIds: string[] = [];

      if (token) {
        targetTokens = [token];
      } else if (userId) {
        const userTokens = await db
          .select({ token: pushTokenTable.token })
          .from(pushTokenTable)
          .where(
            and(
              eq(pushTokenTable.userId, userId),
              eq(pushTokenTable.isActive, true)
            )
          );

        targetTokens = userTokens.map((t) => t.token);
        targetUserIds = [userId];
      } else if (topic) {
        const result = await fcmService.sendToTopic({
          topic,
          title,
          body,
          icon,
          image,
          data,
          clickAction,
        });

        await db.insert(notificationLogTable).values({
          id: nanoid(),
          title,
          body,
          data: data ? JSON.stringify(data) : null,
          messageId: result.messageId,
          status: "sent",
          sentAt: new Date(),
        });

        return c.json({ success: true, messageId: result.messageId });
      }

      if (targetTokens.length === 0) {
        return c.json({ error: "No valid tokens found" }, 400);
      }

      let result;
      if (targetTokens.length === 1) {
        result = await fcmService.sendToToken({
          token: targetTokens[0],
          title,
          body,
          icon,
          image,
          data,
          clickAction,
        });

        await db.insert(notificationLogTable).values({
          id: nanoid(),
          userId: targetUserIds[0] || null,
          token: targetTokens[0],
          title,
          body,
          data: data ? JSON.stringify(data) : null,
          messageId: result.messageId,
          status: "sent",
          sentAt: new Date(),
        });
      } else {
        result = await fcmService.sendToMultipleTokens({
          tokens: targetTokens,
          title,
          body,
          icon,
          image,
          data,
          clickAction,
        });

        for (let i = 0; i < targetTokens.length; i++) {
          const response = result.responses[i];
          await db.insert(notificationLogTable).values({
            id: nanoid(),
            userId: targetUserIds[0] || null,
            token: targetTokens[i],
            title,
            body,
            data: data ? JSON.stringify(data) : null,
            messageId: response.messageId || null,
            status: response.success ? "sent" : "failed",
            errorMessage: response.error?.message || null,
            sentAt: new Date(),
          });
        }
      }

      return c.json({ success: true, result });
    } catch (error) {
      console.error("Error sending notification:", error);
      return c.json({ error: "Failed to send notification" }, 500);
    }
  }
);

fcmRoute.post(
  "/demo-notification",
  zValidator(
    "json",
    z.object({
      title: z.string().default("Demo Notification"),
      body: z.string().default("This is a test notification from your app!"),
      icon: z.string().optional(),
      data: z.record(z.string()).optional(),
    })
  ),
  async (c) => {
    const session = c.get("session");
    if (!session) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { title, body, icon, data } = c.req.valid("json");
    const db = c.get("db");

    try {
      const userTokens = await db
        .select({ token: pushTokenTable.token })
        .from(pushTokenTable)
        .where(
          and(
            eq(pushTokenTable.userId, session.userId),
            eq(pushTokenTable.isActive, true)
          )
        );

      if (userTokens.length === 0) {
        return c.json({ error: "No active FCM tokens found for user" }, 400);
      }

      const results = [];
      for (const { token } of userTokens) {
        try {
          const result = await fcmService.sendToToken({
            token,
            title,
            body,
            icon: icon || "/favicon.png",
            data: {
              ...data,
              demo: "true",
              timestamp: new Date().toISOString(),
            },
            clickAction: "/",
          });

          await db.insert(notificationLogTable).values({
            id: nanoid(),
            userId: session.userId,
            token,
            title,
            body,
            data: JSON.stringify({ ...data, demo: "true" }),
            messageId: result.messageId,
            status: "sent",
            sentAt: new Date(),
          });

          results.push({ token, success: true, messageId: result.messageId });
        } catch (error) {
          console.error("Error sending to token:", token, error);

          await db.insert(notificationLogTable).values({
            id: nanoid(),
            userId: session.userId,
            token,
            title,
            body,
            data: JSON.stringify({ ...data, demo: "true" }),
            status: "failed",
            errorMessage:
              error instanceof Error ? error.message : "Unknown error",
            sentAt: new Date(),
          });

          results.push({
            token,
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      return c.json({ success: true, results, totalTokens: userTokens.length });
    } catch (error) {
      console.error("Error sending demo notification:", error);
      return c.json({ error: "Failed to send demo notification" }, 500);
    }
  }
);

fcmRoute.post(
  "/subscribe-topic",
  zValidator("json", topicSubscriptionSchema),
  async (c) => {
    const session = c.get("session");
    if (!session) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { topic, subscribe } = c.req.valid("json");
    const db = c.get("db");

    try {
      const userTokens = await db
        .select({ token: pushTokenTable.token })
        .from(pushTokenTable)
        .where(
          and(
            eq(pushTokenTable.userId, session.userId),
            eq(pushTokenTable.isActive, true)
          )
        );

      if (userTokens.length === 0) {
        return c.json({ error: "No active FCM tokens found" }, 400);
      }

      const tokens = userTokens.map((t) => t.token);

      let result;
      if (subscribe) {
        result = await fcmService.subscribeToTopic(tokens, topic);
      } else {
        result = await fcmService.unsubscribeFromTopic(tokens, topic);
      }

      const existingSubscription = await db
        .select()
        .from(topicSubscriptionTable)
        .where(
          and(
            eq(topicSubscriptionTable.userId, session.userId),
            eq(topicSubscriptionTable.topic, topic)
          )
        )
        .get();

      if (existingSubscription) {
        await db
          .update(topicSubscriptionTable)
          .set({
            isSubscribed: subscribe,
            updatedAt: new Date(),
          })
          .where(eq(topicSubscriptionTable.id, existingSubscription.id));
      } else {
        await db.insert(topicSubscriptionTable).values({
          id: nanoid(),
          userId: session.userId,
          topic,
          isSubscribed: subscribe,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      return c.json({ success: true, result });
    } catch (error) {
      console.error("Error managing topic subscription:", error);
      return c.json({ error: "Failed to manage topic subscription" }, 500);
    }
  }
);

fcmRoute.get("/tokens", async (c) => {
  const session = c.get("session");
  if (!session) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const db = c.get("db");

  try {
    const tokens = await db
      .select()
      .from(pushTokenTable)
      .where(eq(pushTokenTable.userId, session.userId))
      .orderBy(desc(pushTokenTable.createdAt));

    return c.json({ tokens });
  } catch (error) {
    console.error("Error fetching FCM tokens:", error);
    return c.json({ error: "Failed to fetch tokens" }, 500);
  }
});

fcmRoute.get("/notifications", async (c) => {
  const session = c.get("session");
  if (!session) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const db = c.get("db");
  const limit = parseInt(c.req.query("limit") || "20");
  const offset = parseInt(c.req.query("offset") || "0");

  try {
    const notifications = await db
      .select()
      .from(notificationLogTable)
      .where(eq(notificationLogTable.userId, session.userId))
      .orderBy(desc(notificationLogTable.sentAt))
      .limit(limit)
      .offset(offset);

    return c.json({ notifications });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return c.json({ error: "Failed to fetch notifications" }, 500);
  }
});

export default fcmRoute;
