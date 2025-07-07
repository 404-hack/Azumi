import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { createClient } from "../lib/db";
import { pushTokenTable, notificationLogTable } from "../lib/db/schema";
import { db } from "../lib/db/index";
export interface ExpoNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: string;
  badge?: number;
}

export class ExpoPushService {
  private readonly EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

  async sendToUser(
    userId: string,
    payload: ExpoNotificationPayload
  ): Promise<boolean> {
    try {
      console.log(`📱 [EXPO] Sending notification to user: ${userId}`);

      const tokens = await db.query.pushTokenTable.findMany({
        where: and(
          eq(pushTokenTable.userId, userId),
          eq(pushTokenTable.provider, "expo"),
          eq(pushTokenTable.isActive, true)
        ),
        columns: {
          token: true,
        },
      });

      if (tokens.length === 0) {
        console.warn(
          `⚠️ [EXPO] No active Expo tokens found for user: ${userId}`
        );
        return false;
      }

      const messages = tokens.map(({ token }) => ({
        to: token,
        title: payload.title,
        body: payload.body,
        data: payload.data || {},
        sound: payload.sound || "default",
        badge: payload.badge,
      }));

      const response = await fetch(this.EXPO_PUSH_URL, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messages),
      });

      if (!response.ok) {
        throw new Error(`Expo API error: ${response.status}`);
      }

      console.log(
        `✅ [EXPO] Sent to ${tokens.length} tokens for user ${userId}`
      );

      await db.insert(notificationLogTable).values({
        id: nanoid(),
        userId,
        title: payload.title,
        body: payload.body,
        data: payload.data,
        status: "success",
        sentAt: new Date(),
      });

      return true;
    } catch (error) {
      console.error(`❌ [EXPO] Error sending to user ${userId}:`, error);

      await db.insert(notificationLogTable).values({
        id: nanoid(),
        userId,
        title: payload.title,
        body: payload.body,
        data: payload.data,
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        sentAt: new Date(),
      });

      return false;
    }
  }

  async registerToken(
    userId: string,
    expoPushToken: string,
    deviceId?: string
  ): Promise<boolean> {
    try {
      if (!expoPushToken.startsWith("ExponentPushToken[")) {
        console.error("Invalid Expo push token format");
        return false;
      }

      console.log(`📝 [EXPO] Registering token for user ${userId}`);

      if (deviceId) {
        await db
          .update(pushTokenTable)
          .set({ isActive: false, updatedAt: new Date() })
          .where(
            and(
              eq(pushTokenTable.userId, userId),
              eq(pushTokenTable.deviceId, deviceId),
              eq(pushTokenTable.provider, "expo")
            )
          );
      }

      const now = new Date();
      await db.insert(pushTokenTable).values({
        id: nanoid(),
        userId,
        token: expoPushToken,
        deviceId: deviceId || nanoid(),
        provider: "expo",
        isActive: true,
        createdAt: now,
        updatedAt: now,
        lastUsedAt: now,
      });

      console.log(`✅ [EXPO] Successfully registered token for user ${userId}`);
      return true;
    } catch (error) {
      console.error(`❌ [EXPO] Failed to register token:`, error);
      return false;
    }
  }
}
