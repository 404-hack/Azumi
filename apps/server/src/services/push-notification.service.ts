import { messaging } from "../lib/firebase-admin";
import type {
  Message,
  MulticastMessage,
  TopicMessage,
} from "firebase-admin/messaging";

export interface NotificationData {
  title: string;
  body: string;
  icon?: string;
  image?: string;
  data?: Record<string, string>;
  clickAction?: string;
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

export class PushNotificationService {
  async sendToToken({
    token,
    title,
    body,
    icon,
    image,
    data,
    clickAction,
  }: SendToTokenOptions) {
    try {
      const message: Message = {
        notification: {
          title,
          body,
          imageUrl: image,
        },
        data: {
          ...data,
          click_action: clickAction || "/",
          icon: icon || "/favicon.png",
        },
        token,
        webpush: {
          notification: {
            title,
            body,
            icon: icon || "/favicon.png",
            image,
            click_action: clickAction || "/",
          },
          fcmOptions: {
            link: clickAction || "/",
          },
        },
      };

      const response = await messaging().send(message);
      console.log("Successfully sent message:", response);
      return { success: true, messageId: response };
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  }

  async sendToMultipleTokens({
    tokens,
    title,
    body,
    icon,
    image,
    data,
    clickAction,
  }: SendToMultipleTokensOptions) {
    try {
      const message: MulticastMessage = {
        notification: {
          title,
          body,
          imageUrl: image,
        },
        data: {
          ...data,
          click_action: clickAction || "/",
          icon: icon || "/favicon.png",
        },
        tokens,
        webpush: {
          notification: {
            title,
            body,
            icon: icon || "/favicon.png",
            image,
            click_action: clickAction || "/",
          },
          fcmOptions: {
            link: clickAction || "/",
          },
        },
      };

      const response = await messaging().sendEachForMulticast(message);
      console.log("Successfully sent messages:", response);

      return {
        success: true,
        successCount: response.successCount,
        failureCount: response.failureCount,
        responses: response.responses,
      };
    } catch (error) {
      console.error("Error sending messages:", error);
      throw error;
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
  }: SendToTopicOptions) {
    try {
      const message: TopicMessage = {
        notification: {
          title,
          body,
          imageUrl: image,
        },
        data: {
          ...data,
          click_action: clickAction || "/",
          icon: icon || "/favicon.png",
        },
        topic,
        webpush: {
          notification: {
            title,
            body,
            icon: icon || "/favicon.png",
            image,
            click_action: clickAction || "/",
          },
          fcmOptions: {
            link: clickAction || "/",
          },
        },
      };

      const response = await messaging().send(message);
      console.log("Successfully sent topic message:", response);
      return { success: true, messageId: response };
    } catch (error) {
      console.error("Error sending topic message:", error);
      throw error;
    }
  }

  async subscribeToTopic(tokens: string[], topic: string) {
    try {
      const response = await messaging().subscribeToTopic(tokens, topic);
      console.log("Successfully subscribed to topic:", response);
      return { success: true, response };
    } catch (error) {
      console.error("Error subscribing to topic:", error);
      throw error;
    }
  }

  async unsubscribeFromTopic(tokens: string[], topic: string) {
    try {
      const response = await messaging().unsubscribeFromTopic(tokens, topic);
      console.log("Successfully unsubscribed from topic:", response);
      return { success: true, response };
    } catch (error) {
      console.error("Error unsubscribing from topic:", error);
      throw error;
    }
  }

  async validateToken(token: string): Promise<boolean> {
    try {
      await messaging().send(
        {
          token,
          data: { test: "true" },
        },
        true
      );
      return true;
    } catch (error) {
      console.log("Token validation failed:", error);
      return false;
    }
  }
}

export const pushNotificationService = new PushNotificationService();
