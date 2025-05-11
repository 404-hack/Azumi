import { factory } from "../lib/factory";
import { Context } from "hono"; // Import Context directly from hono
import { CloudflareBindings } from "../lib/types";
import { Variables } from "../lib/types";
import {
  orderTable,
  cartTable,
  shopPaymentMethodTable,
} from "../lib/db/schema"; // Import cartTable
import { eq, sql } from "drizzle-orm"; // Import sql
import { env } from "cloudflare:workers";

const paystackWebhookRoute = factory.createApp().post("/", async (c) => {
  try {
    // 1. Get the request body and signature header
    const body = await c.req.json();
    console.log("🚀 ~ paystackWebhookRoute ~ body:", body);
    const signature = c.req.header("x-paystack-signature");

    if (!signature) {
      c.status(401);
      return c.json({ error: "Unauthorized: Missing signature" });
    }

    // 2. Verify the webhook signature using Web Crypto API
    const secret = env.PAYSTACK_SECRET_KEY;
    if (!secret) {
      console.error("Missing PAYSTACK_SECRET_KEY environment variable");
      return c.json({ error: "Server configuration error" }, 500);
    }
    // Convert secret to a format that can be used by Web Crypto API
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const bodyData = encoder.encode(JSON.stringify(body));

    // Create the key
    const key = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-512" },
      false,
      ["sign"]
    );

    // Sign the data
    const signatureBytes = await crypto.subtle.sign("HMAC", key, bodyData);

    // Convert to hex
    const computedSignature = Array.from(new Uint8Array(signatureBytes))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // Compare signatures
    if (signature !== computedSignature) {
      console.error("Invalid Paystack signature");
      return c.json({ error: "Invalid signature" }, 403);
    }

    // 3. Handle the event based on its type
    const event = body.event;
    const data = body.data; // Extract data object
    console.log(`Processing Paystack webhook event: ${event}`);

    // Handle different types of events
    switch (event) {
      case "charge.success":
        await handleSuccessfulPayment(c, data);
        break;
      case "charge.failed": // Paystack uses charge.failed, not payment_intent.payment_failed
        await handleFailedPayment(c, data);
        break;
      case "transfer.success":
        await handleSuccessfulTransfer(c, data);
        break;
      case "transfer.failed":
        await handleFailedTransfer(c, data);
        break;
      case "transfer.reversed":
        await handleReversedTransfer(c, data);
        break;
      // Add other cases as needed (e.g., disputes, refunds)
      // case 'charge.dispute.create':
      //   // Handle dispute creation
      //   break;
      // case 'refund.processed':
      //   // Handle successful refund
      //   break;
      default:
        console.log(`Unhandled Paystack event type: ${event}`);
    }

    // 4. Acknowledge receipt
    return c.json({ status: "success" });
  } catch (error) {
    console.error("Error processing Paystack webhook:", error);
    // Avoid sending detailed errors back in the response for security
    return c.json({ error: "Webhook processing failed" }, 500);
  }
});

/**
 * Handle successful payment from Paystack webhook
 */
async function handleSuccessfulPayment(
  c: Context<{
    Bindings: CloudflareBindings;
    Variables: Variables;
  }>,
  data: any // data object from webhook payload
) {
  const db = c.get("db");
  const reference = data.reference;
  // Extract payment channel (method) from webhook data
  const paymentChannel = data.authorization?.channel || "unknown"; // e.g., 'card', 'bank', 'ussd'

  try {
    const receivedAmount = data.amount; // Amount is in kobo/lowest unit

    if (!reference) {
      console.error("Missing reference in charge.success data");
      return; // Don't proceed without reference
    }
    if (receivedAmount === undefined || receivedAmount === null) {
      console.error("Missing amount in charge.success data", data);
      return; // Don't proceed without amount
    }

    // Find the order by the reference
    const order = await db.query.orderTable.findFirst({
      where: eq(orderTable.paymentTransactionId, reference),
      with: {
        cart: true, // Keep cart relation if needed
      },
    });

    if (!order) {
      console.error(
        `Webhook charge.success: No order found with payment reference: ${reference}`
      );
      return; // Order not found, nothing to update
    }

    // --- Idempotency Check ---
    if (order.paymentStatus === "COMPLETED") {
      console.log(
        `Webhook charge.success: Order ${order.id} (ref: ${reference}) already marked as COMPLETED. Skipping update.`
      );
      return; // Already processed
    }

    // --- Update Order and Cart (only if not already completed) ---
    console.log(
      `Webhook charge.success: Updating order ${order.id} (ref: ${reference}) to COMPLETED.`
    );
    await db
      .update(orderTable)
      .set({
        paymentStatus: "COMPLETED",
        status: "PAYMENT_CONFIRMED",
        paymentMethod: paymentChannel.toUpperCase(), // Store the actual payment method used
        acceptedAt: new Date().toISOString(), // Or paymentConfirmedAt
      })
      .where(eq(orderTable.id, order.id));

    // Update associated cart status
    if (order.cart?.id && order.cart.status !== "CONVERTED") {
      console.log(
        `Webhook charge.success: Updating cart ${order.cart.id} to CONVERTED.`
      );
      await db
        .update(cartTable)
        .set({
          status: "CONVERTED",
        })
        .where(eq(cartTable.id, order.cart.id));
    }

    // --- Notify Vendor via Durable Object ---

    const durableObjectId = env.ORDER_NOTIFICATION.idFromName(order.shopId);
    const stub = env.ORDER_NOTIFICATION.get(durableObjectId);
    stub.newOrder(order.shopId, order.id);
    // --- End Notify Vendor ---

    // TODO: Add post-payment logic here (notifications, inventory, etc.)
    console.log(`Successfully processed charge.success for order ${order.id}`);
  } catch (error) {
    console.error("Error in handleSuccessfulPayment:", error);
    // Consider more specific error handling/logging if needed
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

  try {
    const reference = data.reference;
    if (!reference) {
      console.error("Missing reference in charge.failed data");
      return;
    }

    // Find the order by the reference
    const order = await db.query.orderTable.findFirst({
      where: eq(orderTable.paymentTransactionId, reference),
      with: {
        cart: true,
      },
    });

    if (!order) {
      console.warn(
        `Webhook charge.failed: No order found with payment reference: ${reference}. May have been deleted or reference incorrect.`
      );
      return; // Order not found
    }

    // --- Idempotency Check ---
    // Only update if the order is still PENDING payment. Don't revert a COMPLETED payment.
    if (order.paymentStatus !== "PENDING") {
      console.log(
        `Webhook charge.failed: Order ${order.id} (ref: ${reference}) has status ${order.paymentStatus}. Not marking as FAILED. Skipping update.`
      );
      return; // Don't mark a completed or already failed/cancelled order as failed again
    }

    // --- Update Order and Cart ---
    console.log(
      `Webhook charge.failed: Updating order ${order.id} (ref: ${reference}) to FAILED/CANCELLED.`
    );
    await db
      .update(orderTable)
      .set({
        paymentStatus: "FAILED",
        status: "CANCELLED", // Or keep PENDING if you allow retries on the same order
        canceledAt: new Date().toISOString(),
        cancelReason: data.gateway_response || "Payment failed via webhook", // Use Paystack's reason if available
      })
      .where(eq(orderTable.id, order.id));

    // Restore associated cart status if it exists and wasn't already converted/abandoned
    // Check if cart was marked pending (assuming you implement that) or is still ACTIVE
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
        .set({
          status: "ACTIVE", // Allow user to retry
        })
        .where(eq(cartTable.id, order.cart.id));
    }

    // TODO: Send notification to customer about payment failure
  } catch (error) {
    console.error("Error in handleFailedPayment:", error);
  }
}

/**
 * Handle successful transfer (vendor payout) webhook event
 */
async function handleSuccessfulTransfer(
  c: Context<{ Bindings: CloudflareBindings; Variables: Variables }>,
  data: any
) {
  const db = c.get("db");

  try {
    console.log("Processing successful transfer:", data);

    const transferCode = data.transfer_code;
    const recipientCode = data.recipient?.recipient_code;
    const amount = data.amount; // Amount is in kobo
    const reason = data.reason;

    if (!recipientCode) {
      console.error(
        "Webhook transfer.success: Missing recipient code in transfer data",
        data
      );
      return;
    }
    if (!transferCode) {
      console.error(
        "Webhook transfer.success: Missing transfer code in transfer data",
        data
      );
      return;
    }

    // --- Find Shop Payment Method using the dedicated column ---
    const paymentMethod = await db.query.shopPaymentMethodTable.findFirst({
      where: eq(shopPaymentMethodTable.paystackRecipientCode, recipientCode),
      with: {
        shop: true, // Include shop details if needed
      },
    });

    if (!paymentMethod) {
      console.error(
        `Webhook transfer.success: No payment method found for recipient code: ${recipientCode}`
      );
      return;
    }

    // --- Idempotency Check (Optional but Recommended) ---
    // You might want to check if this specific transferCode has already been processed
    // This would require storing transfer records or adding a status to related entities.
    // Example:
    // const existingTransfer = await db.query.transferLogTable.findFirst({ where: eq(transferLogTable.transferCode, transferCode) });
    // if (existingTransfer?.status === 'success') {
    //   console.log(`Webhook transfer.success: Transfer ${transferCode} already processed. Skipping.`);
    //   return;
    // }

    // --- Record Successful Transfer ---
    // TODO: Implement logic to record this transfer (e.g., in a dedicated transfer log table)
    // TODO: Update related order statuses or vendor balances if applicable.
    console.log(
      `Webhook transfer.success: Successfully processed transfer ${transferCode} (${amount} kobo) to recipient ${recipientCode} (Shop ID: ${paymentMethod.shopId}). Reason: ${reason}`
    );

    // Example: Log transfer details
    const transferRecord = {
      transferCode,
      recipientCode,
      amount, // Store in kobo
      reason,
      status: "success",
      shopId: paymentMethod.shopId,
      processedAt: new Date().toISOString(),
      payload: data, // Store the raw payload for auditing
    };
    console.log("Successful transfer record:", transferRecord);
    // await db.insert(transferLogTable).values(transferRecord); // Example insertion
  } catch (error) {
    console.error("Error handling successful transfer:", error);
  }
}

/**
 * Handle failed transfer (vendor payout) webhook event
 */
async function handleFailedTransfer(
  c: Context<{ Bindings: CloudflareBindings; Variables: Variables }>,
  data: any
) {
  const db = c.get("db");

  try {
    console.log("Processing failed transfer:", data);

    const transferCode = data.transfer_code;
    const recipientCode = data.recipient?.recipient_code;
    const amount = data.amount; // Amount is in kobo
    const reason = data.reason;
    const failureReason = data.failures || data.status || "Unknown reason"; // Paystack might provide failure details

    if (!recipientCode) {
      console.error(
        "Webhook transfer.failed: Missing recipient code in transfer data",
        data
      );
      return;
    }
    if (!transferCode) {
      console.error(
        "Webhook transfer.failed: Missing transfer code in transfer data",
        data
      );
      return;
    }

    // --- Find Shop Payment Method using the dedicated column ---
    const paymentMethod = await db.query.shopPaymentMethodTable.findFirst({
      where: eq(shopPaymentMethodTable.paystackRecipientCode, recipientCode),
      with: {
        shop: true,
      },
    });

    if (!paymentMethod) {
      console.error(
        `Webhook transfer.failed: No payment method found for recipient code: ${recipientCode}`
      );
      // Log the failed transfer attempt even without linking it to a shop
    }

    // ... (Idempotency Check - commented out) ...

    // --- Record Failed Transfer ---
    // TODO: Implement logic to record this failed transfer.
    // TODO: Notify admin or vendor, potentially schedule a retry.
    const shopId = paymentMethod?.shopId || null; // Handle case where payment method wasn't found
    console.error(
      `Webhook transfer.failed: Failed transfer ${transferCode} (${amount} kobo) to recipient ${recipientCode} (Shop ID: ${shopId}). Reason: ${failureReason}`
    );

    // Example: Log failed transfer details
    const failedTransferRecord = {
      transferCode,
      recipientCode,
      amount, // Store in kobo
      reason,
      status: "failed",
      shopId: shopId,
      failureReason: JSON.stringify(failureReason), // Store potentially complex failure data
      processedAt: new Date().toISOString(),
      payload: data,
    };
    console.log("Failed transfer record:", failedTransferRecord);
    // await db.insert(transferLogTable).values(failedTransferRecord); // Example insertion
  } catch (error) {
    console.error("Error handling failed transfer:", error);
  }
}

/**
 * Handle reversed transfer (vendor payout) webhook event
 */
async function handleReversedTransfer(
  c: Context<{ Bindings: CloudflareBindings; Variables: Variables }>,
  data: any
) {
  const db = c.get("db");

  try {
    console.log("Processing reversed transfer:", data);

    const transferCode = data.transfer_code;
    const recipientCode = data.recipient?.recipient_code;
    const amount = data.amount; // Amount is in kobo

    if (!recipientCode) {
      console.error(
        "Webhook transfer.reversed: Missing recipient code in transfer data",
        data
      );
      return;
    }
    if (!transferCode) {
      console.error(
        "Webhook transfer.reversed: Missing transfer code in transfer data",
        data
      );
      return;
    }

    // --- Find Shop Payment Method using the dedicated column ---
    const paymentMethod = await db.query.shopPaymentMethodTable.findFirst({
      where: eq(shopPaymentMethodTable.paystackRecipientCode, recipientCode),
      with: {
        shop: true,
      },
    });

    if (!paymentMethod) {
      console.error(
        `Webhook transfer.reversed: No payment method found for recipient code: ${recipientCode}`
      );
      // Log the reversal even without linking it to a shop
    }

    // ... (Idempotency Check - commented out) ...

    // --- Record Reversed Transfer ---
    // TODO: Implement logic to record this reversal.
    // TODO: Adjust vendor balances, notify relevant parties.
    const shopId = paymentMethod?.shopId || null;
    console.warn(
      // Use warn for reversals as they indicate a problem
      `Webhook transfer.reversed: Transfer ${transferCode} (${amount} kobo) to recipient ${recipientCode} (Shop ID: ${shopId}) was reversed.`
    );

    // Example: Log reversed transfer details
    const reversedTransferRecord = {
      transferCode,
      recipientCode,
      amount, // Store in kobo
      status: "reversed",
      shopId: shopId,
      processedAt: new Date().toISOString(),
      payload: data,
    };
    console.log("Reversed transfer record:", reversedTransferRecord);
    // Update existing transfer log or insert new record
    // await db.update(transferLogTable).set({ status: 'reversed', /* ... */ }).where(eq(transferLogTable.transferCode, transferCode));
  } catch (error) {
    console.error("Error handling reversed transfer:", error);
  }
}

export default paystackWebhookRoute;
