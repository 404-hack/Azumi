import { eq, and } from "drizzle-orm";
import { createClient } from "../lib/db";
import { pushTokenTable, member } from "../lib/db/schema";
import {
  sendFirebaseMessage,
  sendToMultipleTokens,
  subscribeToTopic,
  unsubscribeFromTopic,
  type FirebaseMessage,
} from "../lib/firebase-admin";
import { env } from "cloudflare:workers";

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

export interface NotificationData {
  title: string;
  body: string;
  icon?: string;
  image?: string;
  data?: Record<string, string>;
  clickAction?: string;
}

export interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  backoffMultiplier: number;
  maxDelayMs: number;
}

export interface SendToTokenOptions extends NotificationData {
  token: string;
}

export interface SendToTopicOptions extends NotificationData {
  topic: string;
}

export interface SendToMultipleTokensOptions extends NotificationData {
  tokens: string[];
}

export interface SendToTokenResult {
  success: boolean;
  messageId?: string;
  error?: string;
  invalidToken?: boolean;
}

export class PushNotificationService {
  private defaultRetryConfig: RetryConfig = {
    maxRetries: 3,
    initialDelayMs: 1000,
    backoffMultiplier: 2,
    maxDelayMs: 10000,
  };
  private getFirebaseConfig() {
    console.log('🔥 [PUSH] Getting Firebase config...');
    console.log('🔥 [PUSH] PROJECT_ID exists:', !!env.FIREBASE_PROJECT_ID);
    console.log('🔥 [PUSH] CLIENT_EMAIL exists:', !!env.FIREBASE_CLIENT_EMAIL);
    console.log('🔥 [PUSH] PRIVATE_KEY exists:', !!env.FIREBASE_PRIVATE_KEY);
    console.log('🔥 [PUSH] PROJECT_ID value:', env.FIREBASE_PROJECT_ID);
    console.log('🔥 [PUSH] CLIENT_EMAIL value:', env.FIREBASE_CLIENT_EMAIL);
    console.log('🔥 [PUSH] PRIVATE_KEY length:', env.FIREBASE_PRIVATE_KEY?.length || 0);
    
    const config = {
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: env.FIREBASE_PRIVATE_KEY,
    };
    
    console.log('🔥 [PUSH] Firebase config created:', {
      projectId: config.projectId,
      clientEmail: config.clientEmail,
      privateKeyLength: config.privateKey?.length || 0
    });
    
    return config;
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private shouldRetry(error: Error): boolean {
    const retryableErrors = [
      "unavailable",
      "internal-error",
      "timeout",
      "server-error",
      "rate-limited",
    ];
    return retryableErrors.some((retryable) =>
      error.message.toLowerCase().includes(retryable)
    );
  }
  private async retryOperation<T>(
    operation: () => Promise<T>,
    retryConfig: RetryConfig = this.defaultRetryConfig
  ): Promise<T> {
    let lastError: Error = new Error("Operation failed after all retries");
    let delay = retryConfig.initialDelayMs;

    for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt === retryConfig.maxRetries) {
          break;
        }

        const shouldRetry = this.shouldRetry(lastError);
        if (!shouldRetry) {
          throw lastError;
        }

        console.warn(
          `Notification attempt ${attempt + 1} failed, retrying in ${delay}ms:`,
          lastError.message
        );
        await this.sleep(delay);

        delay = Math.min(
          delay * retryConfig.backoffMultiplier,
          retryConfig.maxDelayMs
        );
      }
    }

    throw lastError;
  }
  async sendNotification(
    token: string,
    payload: NotificationPayload
  ): Promise<boolean> {
    console.log('📢 [NOTIFICATION] sendNotification called:', {
      tokenLength: token?.length || 0,
      title: payload.title,
      body: payload.body,
      hasData: !!payload.data,
      dataKeys: payload.data ? Object.keys(payload.data) : []
    });
    
    try {
      const message: FirebaseMessage = {
        token,
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: payload.data || {},
      };

      console.log('📢 [NOTIFICATION] Calling sendFirebaseMessage...');
      await sendFirebaseMessage(this.getFirebaseConfig(), message);
      console.log('📢 [NOTIFICATION] sendFirebaseMessage successful');
      return true;
    } catch (error) {
      console.error("📢 [NOTIFICATION] Failed to send FCM notification:", error);
      console.error("📢 [NOTIFICATION] Error type:", typeof error);
      console.error("📢 [NOTIFICATION] Error constructor:", error?.constructor?.name);
      return false;
    }
  }
  async sendToToken({
    token,
    title,
    body,
    icon,
    image,
    data,
    clickAction,
  }: SendToTokenOptions): Promise<SendToTokenResult> {
    console.log('🔥 [PUSH] sendToToken called with:', {
      tokenLength: token?.length || 0,
      title,
      body,
      hasData: !!data,
      dataKeys: data ? Object.keys(data) : []
    });
    
    try {
      console.log('🔥 [PUSH] Creating Firebase message...');
      const message: FirebaseMessage = {
        token,
        notification: {
          title,
          body,
          image,
        },
        data: data || {},
      };
      
      console.log('🔥 [PUSH] Message created:', {
        hasToken: !!message.token,
        notificationTitle: message.notification?.title,
        dataKeys: Object.keys(message.data || {})
      });

      console.log('🔥 [PUSH] Calling sendFirebaseMessage...');
      const result = await sendFirebaseMessage(
        this.getFirebaseConfig(),
        message
      );
      
      console.log('🔥 [PUSH] sendFirebaseMessage result:', result);

      return {
        success: true,
        messageId: result.name,
      };
    } catch (error) {
      console.error('🔥 [PUSH] Error in sendToToken:', error);
      console.error('🔥 [PUSH] Error type:', typeof error);
      console.error('🔥 [PUSH] Error constructor:', error?.constructor?.name);
      
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const isInvalidToken =
        errorMessage.includes("invalid-registration-token") ||
        errorMessage.includes("registration-token-not-registered");

      console.log('🔥 [PUSH] Returning error result:', {
        success: false,
        error: errorMessage,
        invalidToken: isInvalidToken
      });

      return {
        success: false,
        error: errorMessage,
        invalidToken: isInvalidToken,
      };
    }
  }

  async sendToTokenWithRetry({
    token,
    title,
    body,
    icon,
    image,
    data,
    clickAction,
    retryConfig,
  }: SendToTokenOptions & {
    retryConfig?: RetryConfig;
  }): Promise<SendToTokenResult> {
    return this.retryOperation(
      () =>
        this.sendToToken({
          token,
          title,
          body,
          icon,
          image,
          data,
          clickAction,
        }),
      retryConfig
    );
  }

  async sendToMultipleTokens({
    tokens,
    title,
    body,
    icon,
    image,
    data,
    clickAction,
  }: SendToMultipleTokensOptions): Promise<{
    successCount: number;
    failureCount: number;
    responses: SendToTokenResult[];
  }> {
    const message = {
      notification: {
        title,
        body,
        image,
      },
      data: data || {},
      tokens,
    };

    try {
      const result = await sendToMultipleTokens(
        this.getFirebaseConfig(),
        message
      );

      return {
        successCount: result.successCount,
        failureCount: result.failureCount,
        responses: result.responses.map((response) => ({
          success: !response.error,
          messageId: response.name,
          error: response.error?.message,
          invalidToken:
            response.error?.code === "invalid-registration-token" ||
            response.error?.code === "registration-token-not-registered",
        })),
      };
    } catch (error) {
      console.error("Failed to send to multiple tokens:", error);
      return {
        successCount: 0,
        failureCount: tokens.length,
        responses: tokens.map(() => ({
          success: false,
          error: error instanceof Error ? error.message : String(error),
        })),
      };
    }
  }

  async sendToTopic({
    topic,
    title,
    body,
    icon,
    image,
    data,
    clickAction,
  }: SendToTopicOptions): Promise<SendToTokenResult> {
    try {
      const message: FirebaseMessage = {
        topic,
        notification: {
          title,
          body,
          image,
        },
        data: data || {},
      };

      const result = await sendFirebaseMessage(
        this.getFirebaseConfig(),
        message
      );

      return {
        success: true,
        messageId: result.name,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async subscribeToTopic(tokens: string[], topic: string) {
    try {
      const result = await subscribeToTopic(
        this.getFirebaseConfig(),
        tokens,
        topic
      );
      return {
        success: true,
        successCount: result.successCount,
        failureCount: result.failureCount,
      };
    } catch (error) {
      console.error("Failed to subscribe to topic:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async unsubscribeFromTopic(tokens: string[], topic: string) {
    try {
      const result = await unsubscribeFromTopic(
        this.getFirebaseConfig(),
        tokens,
        topic
      );
      return {
        success: true,
        successCount: result.successCount,
        failureCount: result.failureCount,
      };
    } catch (error) {
      console.error("Failed to unsubscribe from topic:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }  async sendNotificationToUser(
    userId: string,
    payload: NotificationPayload
  ): Promise<boolean> {
    console.log('👤 [USER_NOTIFICATION] Sending notification to user:', {
      userId,
      title: payload.title,
      body: payload.body,
      hasData: !!payload.data,
      dataKeys: payload.data ? Object.keys(payload.data) : []
    });
    
    try {
      const db = createClient(env.DB);
      console.log('👤 [USER_NOTIFICATION] Querying push tokens for user...');
      
      const tokenRecords = await db
        .select({ token: pushTokenTable.token })
        .from(pushTokenTable)
        .where(
          and(
            eq(pushTokenTable.userId, userId),
            eq(pushTokenTable.isActive, true)
          )
        );

      console.log('👤 [USER_NOTIFICATION] Found tokens:', {
        userId,
        tokenCount: tokenRecords.length,
        tokens: tokenRecords.map(r => ({ length: r.token.length, prefix: r.token.substring(0, 20) }))
      });

      if (tokenRecords.length === 0) {
        console.log(`👤 [USER_NOTIFICATION] No active push tokens found for user: ${userId}`);
        return false;
      }

      console.log('👤 [USER_NOTIFICATION] Sending to individual tokens...');
      const sendPromises = tokenRecords.map(async (record, index) => {
        console.log(`👤 [USER_NOTIFICATION] Sending to token ${index + 1}/${tokenRecords.length}...`);
        
        try {
          const success = await this.sendNotification(record.token, payload);
          console.log(`👤 [USER_NOTIFICATION] Token ${index + 1} result:`, success);
          
          if (success) {
            console.log(`👤 [USER_NOTIFICATION] Updating lastUsedAt for successful token...`);
            await db
              .update(pushTokenTable)
              .set({ lastUsedAt: new Date() })
              .where(eq(pushTokenTable.token, record.token));
          } else {
            console.log(`👤 [USER_NOTIFICATION] Marking failed token as inactive...`);
            await db
              .update(pushTokenTable)
              .set({ isActive: false })
              .where(eq(pushTokenTable.token, record.token));
            console.log(`👤 [USER_NOTIFICATION] Marked token as inactive for user: ${userId}`);
          }
          return success;
        } catch (error) {
          console.error(`👤 [USER_NOTIFICATION] Error sending to token ${index + 1}:`, error);
          console.log(`👤 [USER_NOTIFICATION] Marking error token as inactive...`);
          await db
            .update(pushTokenTable)
            .set({ isActive: false })
            .where(eq(pushTokenTable.token, record.token));
          console.log(`👤 [USER_NOTIFICATION] Marked failed token as inactive for user: ${userId}`);
          return false;
        }
      });

      const results = await Promise.allSettled(sendPromises);
      const successCount = results.filter(
        (result) => result.status === "fulfilled" && result.value === true
      ).length;

      console.log(`👤 [USER_NOTIFICATION] Final results:`, {
        userId,
        successCount,
        totalTokens: tokenRecords.length,
        successRate: `${successCount}/${tokenRecords.length}`,
        overallSuccess: successCount > 0
      });

      console.log(
        `👤 [USER_NOTIFICATION] Sent notifications to ${successCount}/${tokenRecords.length} active devices for user: ${userId}`
      );
      return successCount > 0;
    } catch (error) {
      console.error("👤 [USER_NOTIFICATION] Failed to send notification to user:", error);
      console.error("👤 [USER_NOTIFICATION] Error type:", typeof error);
      console.error("👤 [USER_NOTIFICATION] Error message:", error instanceof Error ? error.message : String(error));
    }
    return false;
  }

  async sendNotificationToShop(
    shopId: string,
    payload: NotificationPayload
  ): Promise<boolean> {
    try {
      const db = createClient(env.DB);
      const shopMembers = await db
        .select({ userId: member.userId })
        .from(member)
        .where(eq(member.organizationId, shopId));

      let success = false;
      for (const shopMember of shopMembers) {
        const sent = await this.sendNotificationToUser(
          shopMember.userId,
          payload
        );
        if (sent) success = true;
      }
      return success;
    } catch (error) {
      console.error("Failed to send notification to shop:", error);
    }
    return false;
  }
}

export const pushNotificationService = new PushNotificationService();
