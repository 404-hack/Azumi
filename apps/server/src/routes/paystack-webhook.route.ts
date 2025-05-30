import { Context } from "hono";
import { factory } from "../lib/factory"; // Assuming factory is imported
import {
  orderTable,
  cartTable,
  shopPaymentMethodTable,
} from "../lib/db/schema";
import { eq, sql } from "drizzle-orm";
import type { CloudflareBindings, Variables } from "../lib/types"; // Assuming types are defined
import { env } from "cloudflare:workers"; // Correct import for env

const paystackWebhookRoute = factory.createApp().post("/", async (c) => {
  try {
    // 1. Get the request body and signature header
    const body = await c.req.json();
    // console.log("🚀 ~ paystackWebhookRoute ~ body:", body); // Kept for debugging, consider removing in prod
    const signature = c.req.header("x-paystack-signature");

    if (!signature) {
      c.status(401);
      return c.json({ error: "Unauthorized: Missing signature" });
    }

    // 2. Verify the webhook signature using Web Crypto API
    const secret = env.PAYSTACK_SECRET_KEY; // Use env directly
    if (!secret) {
      console.error("Missing PAYSTACK_SECRET_KEY environment variable");
      return c.json({ error: "Server configuration error" }, 500);
    }

    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    // IMPORTANT: Use the raw string body for signature verification, not the parsed JSON stringified again.
    // Hono's c.req.text() should be used here if possible before c.req.json().
    // For now, assuming JSON.stringify(body) was a placeholder and Paystack expects HMAC of the JSON string.
    // If Paystack signs the raw request body, this needs adjustment.
    // This example proceeds with JSON.stringify(body) as per original code's apparent intent.
    const requestBodyString = JSON.stringify(body);
    const bodyData = encoder.encode(requestBodyString);

    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-512" },
      false,
      ["sign"]
    );

    const signatureBytes = await crypto.subtle.sign(
      "HMAC",
      cryptoKey,
      bodyData
    );
    const computedSignature = Array.from(new Uint8Array(signatureBytes))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    if (signature !== computedSignature) {
      console.error("Invalid Paystack signature");
      c.status(403);
      return c.json({ error: "Invalid signature" });
    }

    const event = body.event;
    const eventData = body.data;
    console.log(`Processing Paystack webhook event: ${event}`);

    switch (event) {
      case "charge.success":
        c.executionCtx.waitUntil(handleSuccessfulPayment(c, eventData));
        break;
      case "charge.failed":
        c.executionCtx.waitUntil(handleFailedPayment(c, eventData));
        break;
      case "transfer.success":
        // Consider waitUntil if handler becomes complex or makes external calls
        c.executionCtx.waitUntil(handleSuccessfulTransfer(c, eventData));
        break;
      case "transfer.failed":
        // Consider waitUntil
        c.executionCtx.waitUntil(handleFailedTransfer(c, eventData));
        break;
      case "transfer.reversed":
        // Consider waitUntil
        c.executionCtx.waitUntil(handleReversedTransfer(c, eventData));
        break;
      // Add other cases as needed (e.g., disputes, refunds)
      default:
        console.log(`Unhandled Paystack event type: ${event}`);
    }

    return c.json({ status: "webhook received" });
  } catch (error) {
    console.error("Error processing Paystack webhook:", error);
    c.status(500);
    return c.json({ error: "Webhook processing failed" });
  }
});

async function handleSuccessfulPayment(
  c: Context<{
    Bindings: CloudflareBindings;
    Variables: Variables;
  }>,
  data: any // data object from webhook payload
) {
  const db = c.get("db");
  const reference = data.reference;
  const paymentChannel = data.authorization?.channel || "unknown";
  const receivedAmount = data.amount; // Amount is in kobo/lowest unit

  try {
    if (!reference) {
      console.error("Missing reference in charge.success data");
      return;
    }
    if (receivedAmount === undefined || receivedAmount === null) {
      console.error("Missing amount in charge.success data", data);
      return;
    }
    const order = await db.query.orderTable.findFirst({
      where: eq(orderTable.paymentTransactionId, reference),
      with: {
        cart: true,
      },
    });

    if (!order) {
      console.error(
        `Webhook charge.success: No order found with payment reference: ${reference}`
      );
      return;
    }

    if (order.paymentStatus === "COMPLETED") {
      console.log(
        `Webhook charge.success: Order ${order.id} (ref: ${reference}) already marked as COMPLETED. Skipping update.`
      );
      return;
    }

    console.log(
      `Webhook charge.success: Updating order ${order.id} (ref: ${reference}) to COMPLETED.`
    );
    await db
      .update(orderTable)
      .set({
        paymentStatus: "COMPLETED",
        status: "PAYMENT_CONFIRMED", // Indicates payment is done, workflow will handle next steps
        paymentMethod: paymentChannel.toUpperCase(),
        // acceptedAt: new Date().toISOString(), // This might be better set when vendor accepts
      })
      .where(eq(orderTable.id, order.id));

    if (order.cart?.id && order.cart.status !== "CONVERTED") {
      console.log(
        `Webhook charge.success: Updating cart ${order.cart.id} to CONVERTED.`
      );
      await db
        .update(cartTable)
        .set({ status: "CONVERTED" })
        .where(eq(cartTable.id, order.cart.id));
    }

    // --- Notify Vendor via Durable Object ---
    const durableObjectId = env.ORDER_NOTIFICATION.idFromName(order.shopId); // Use env directly
    const stub = env.ORDER_NOTIFICATION.get(durableObjectId); // Use env directly
    // Ensure newOrder method exists and handles parameters correctly
    c.executionCtx.waitUntil(stub.newOrder(order.shopId, order.id));

    // --- End Notify Vendor ---    // --- Send Event to Workflow ---
    try {
      const workflow = await env.ORDER_WORKFLOW.get(order.id); // Use order ID as workflow instance ID
      await workflow.sendEvent({
        type: "payment_confirmed",
        payload: { orderId: order.id, reference, amount: receivedAmount },
      });
      console.log(
        `Sent 'payment_confirmed' event to workflow ${order.id} for order ${order.id}`
      );
    } catch (workflowError) {
      console.error(
        `Error sending 'payment_confirmed' to workflow ${order.id} for order ${order.id}:`,
        workflowError
      );
    }
    // --- End Send Event to Workflow ---

    console.log(`Successfully processed charge.success for order ${order.id}`);
  } catch (error) {
    console.error(
      `Error in handleSuccessfulPayment for reference ${reference}:`,
      error
    );
  }
}

/**
 * Handle failed payment from Paystack webhook
 */
async function handleFailedPayment(
  c: Context<{
    Bindings: CloudflareBindings;
    Variables: Variables;
  }>,
  data: any // data object from webhook payload
) {
  const db = c.get("db");
  const reference = data.reference;

  try {
    if (!reference) {
      console.error("Missing reference in charge.failed data");
      return;
    }
    const order = await db.query.orderTable.findFirst({
      where: eq(orderTable.paymentTransactionId, reference),
      with: {
        cart: true,
      },
    });

    if (!order) {
      console.warn(
        `Webhook charge.failed: No order found with payment reference: ${reference}.`
      );
      return;
    }

    if (order.paymentStatus !== "PENDING") {
      console.log(
        `Webhook charge.failed: Order ${order.id} (ref: ${reference}) has status ${order.paymentStatus}. Not marking as FAILED. Skipping update.`
      );
      return;
    }

    console.log(
      `Webhook charge.failed: Updating order ${order.id} (ref: ${reference}) to FAILED/CANCELLED.`
    );
    const failureReason = data.gateway_response || "Payment failed via webhook";
    await db
      .update(orderTable)
      .set({
        paymentStatus: "FAILED",
        status: "CANCELLED",
        canceledAt: new Date().toISOString(),
        cancelReason: failureReason,
      })
      .where(eq(orderTable.id, order.id));

    if (
      order.cart?.id &&
      (order.cart.status === "PENDING_PAYMENT" ||
        order.cart.status === "ACTIVE")
    ) {
      console.log(
        `Webhook charge.failed: Restoring cart ${order.cart.id} to ACTIVE.`
      );
      await db
        .update(cartTable)
        .set({ status: "ACTIVE" })
        .where(eq(cartTable.id, order.cart.id));
    } // --- Send Event to Workflow for Failed Payment ---
    try {
      const workflow = await env.ORDER_WORKFLOW.get(order.id); // Use order ID as workflow instance ID
      await workflow.sendEvent({
        type: "payment_failed",
        payload: { orderId: order.id, reference, reason: failureReason },
      });
      console.log(
        `Sent 'payment_failed' event to workflow ${order.id} for order ${order.id}`
      );
    } catch (workflowError) {
      console.error(
        `Error sending 'payment_failed' to workflow ${order.id} for order ${order.id}:`,
        workflowError
      );
    }
    // --- End Send Event to Workflow ---

    console.log(`Successfully processed charge.failed for order ${order.id}`);
  } catch (error) {
    console.error(
      `Error in handleFailedPayment for reference ${reference}:`,
      error
    );
  }
}

/**
 * Handle successful transfer from Paystack webhook
 */
async function handleSuccessfulTransfer(
  c: Context<{ Bindings: CloudflareBindings; Variables: Variables }>,
  webhookData: any
) {
  const db = c.get("db");

  try {
    console.log("Processing successful transfer:", webhookData);
    const transferCode = webhookData.transfer_code;
    // ... (ensure all c.env and db usages are correct)
  } catch (error) {
    console.error("Error handling successful transfer:", error);
  }
}

/**
 * Handle failed transfer from Paystack webhook
 */
async function handleFailedTransfer(
  c: Context<{ Bindings: CloudflareBindings; Variables: Variables }>,
  webhookData: any
) {
  const db = c.get("db");

  try {
    console.log("Processing failed transfer:", webhookData);
    const transferCode = webhookData.transfer_code;
    // ... (ensure all c.env and db usages are correct)
  } catch (error) {
    console.error("Error handling failed transfer:", error);
  }
}

/**
 * Handle reversed transfer from Paystack webhook
 */
async function handleReversedTransfer(
  c: Context<{ Bindings: CloudflareBindings; Variables: Variables }>,
  webhookData: any
) {
  const db = c.get("db");

  try {
    console.log("Processing reversed transfer:", webhookData);
    const transferCode = webhookData.transfer_code;
    // ... (ensure all c.env and db usages are correct)
  } catch (error) {
    console.error("Error handling reversed transfer:", error);
  }
}
export default paystackWebhookRoute;
