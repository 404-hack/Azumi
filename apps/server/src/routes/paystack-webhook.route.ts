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
    console.log("[PAYSTACK_WEBHOOK] Received webhook request");

    // 1. Get the request body and signature header
    const body = await c.req.json();
    const signature = c.req.header("x-paystack-signature");

    console.log("[PAYSTACK_WEBHOOK] Webhook event:", {
      event: body.event,
      hasSignature: !!signature,
      timestamp: new Date().toISOString(),
    });

    if (!signature) {
      console.log("[PAYSTACK_WEBHOOK] Missing signature header");
      c.status(401);
      return c.json({ error: "Unauthorized: Missing signature" });
    }

    // 2. Verify the webhook signature using Web Crypto API
    const secret = env.PAYSTACK_SECRET_KEY; // Use env directly
    if (!secret) {
      console.error(
        "[PAYSTACK_WEBHOOK] Missing PAYSTACK_SECRET_KEY environment variable"
      );
      return c.json({ error: "Server configuration error" }, 500);
    }

    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
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
      console.error("[PAYSTACK_WEBHOOK] Invalid signature:", {
        receivedSignature: signature,
        computedSignature,
      });
      c.status(403);
      return c.json({ error: "Invalid signature" });
    }

    console.log("[PAYSTACK_WEBHOOK] Signature verified successfully");

    const event = body.event;
    const eventData = body.data;
    console.log("[PAYSTACK_WEBHOOK] Processing event:", {
      event,
      reference: eventData?.reference,
      amount: eventData?.amount,
    });

    switch (event) {
      case "charge.success":
        c.executionCtx.waitUntil(handleSuccessfulPayment(c, eventData));
        break;
      case "charge.failed":
        c.executionCtx.waitUntil(handleFailedPayment(c, eventData));
        break;
      case "transfer.success":
        c.executionCtx.waitUntil(handleSuccessfulTransfer(c, eventData));
        break;
      case "transfer.failed":
        c.executionCtx.waitUntil(handleFailedTransfer(c, eventData));
        break;
      case "transfer.reversed":
        c.executionCtx.waitUntil(handleReversedTransfer(c, eventData));
        break;
      default:
        console.log("[PAYSTACK_WEBHOOK] Unhandled event type:", event);
    }

    return c.json({ status: "webhook received" });
  } catch (error) {
    console.error("[PAYSTACK_WEBHOOK] Error processing webhook:", error);
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

  console.log("[WEBHOOK_SUCCESS] Processing payment success:", {
    reference,
    amount: receivedAmount,
    channel: paymentChannel,
  });

  try {
    if (!reference) {
      console.error(
        "[WEBHOOK_SUCCESS] Missing reference in charge.success data"
      );
      return;
    }
    if (receivedAmount === undefined || receivedAmount === null) {
      console.error(
        "[WEBHOOK_SUCCESS] Missing amount in charge.success data",
        data
      );
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
        "[WEBHOOK_SUCCESS] No order found for reference:",
        reference
      );
      return;
    }

    if (order.paymentStatus === "COMPLETED") {
      console.log("[WEBHOOK_SUCCESS] Order already completed, skipping:", {
        orderId: order.id,
        reference,
      });
      return;
    }

    console.log("[WEBHOOK_SUCCESS] Updating order to completed:", {
      orderId: order.id,
      reference,
    });

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
        "[WEBHOOK_SUCCESS] Converting cart to completed:",
        order.cart.id
      );
      await db
        .update(cartTable)
        .set({ status: "CONVERTED" })
        .where(eq(cartTable.id, order.cart.id));
    } // --- Notify Vendor via Durable Object ---
    console.log("[WEBHOOK_SUCCESS] Notifying vendor via durable object:", {
      shopId: order.shopId,
      orderId: order.id,
    });
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
        "[WEBHOOK_SUCCESS] Sent payment_confirmed event to workflow:",
        order.id
      );
    } catch (workflowError) {
      console.error("[WEBHOOK_SUCCESS] Failed to send event to workflow:", {
        orderId: order.id,
        error: workflowError,
      });
    }
    // --- End Send Event to Workflow ---

    console.log("[WEBHOOK_SUCCESS] Payment processing completed:", order.id);
  } catch (error) {
    console.error("[WEBHOOK_SUCCESS] Error processing payment:", {
      reference,
      error,
    });
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

  console.log("[WEBHOOK_FAILED] Processing payment failure:", {
    reference,
    reason: data.gateway_response,
  });

  try {
    if (!reference) {
      console.error("[WEBHOOK_FAILED] Missing reference in charge.failed data");
      return;
    }
    const order = await db.query.orderTable.findFirst({
      where: eq(orderTable.paymentTransactionId, reference),
      with: {
        cart: true,
      },
    });

    if (!order) {
      console.warn("[WEBHOOK_FAILED] No order found for reference:", reference);
      return;
    }

    if (order.paymentStatus !== "PENDING") {
      console.log("[WEBHOOK_FAILED] Order not in pending state, skipping:", {
        orderId: order.id,
        currentStatus: order.paymentStatus,
      });
      return;
    }

    console.log("[WEBHOOK_FAILED] Cancelling order due to payment failure:", {
      orderId: order.id,
      reference,
    });

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
      console.log("[WEBHOOK_FAILED] Restoring cart to active:", order.cart.id);
      await db
        .update(cartTable)
        .set({ status: "ACTIVE" })
        .where(eq(cartTable.id, order.cart.id));
    }

    // --- Send Event to Workflow for Failed Payment ---
    try {
      const workflow = await env.ORDER_WORKFLOW.get(order.id); // Use order ID as workflow instance ID
      await workflow.sendEvent({
        type: "payment_failed",
        payload: { orderId: order.id, reference, reason: failureReason },
      });
      console.log(
        "[WEBHOOK_FAILED] Sent payment_failed event to workflow:",
        order.id
      );
    } catch (workflowError) {
      console.error("[WEBHOOK_FAILED] Failed to send event to workflow:", {
        orderId: order.id,
        error: workflowError,
      });
    }
    // --- End Send Event to Workflow ---

    console.log(
      "[WEBHOOK_FAILED] Payment failure processing completed:",
      order.id
    );
  } catch (error) {
    console.error("[WEBHOOK_FAILED] Error processing payment failure:", {
      reference,
      error,
    });
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
