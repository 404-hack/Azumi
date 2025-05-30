import { createMiddleware } from "hono/factory";
import { env } from "cloudflare:workers";
export const firebaseAdminMiddleware = createMiddleware(async (c, next) => {
  try {
    const projectId = env.FIREBASE_PROJECT_ID || "azumi-ed6f3";
    const clientEmail = env.FIREBASE_CLIENT_EMAIL;
    const privateKey = env.FIREBASE_PRIVATE_KEY;

    if (!clientEmail || !privateKey) {
      console.warn(
        "Firebase Admin credentials not configured. FCM features will be disabled."
      );
    }

    return next();
  } catch (error) {
    console.error("Error checking Firebase configuration:", error);
    return next();
  }
});
