import { factory } from "../lib/factory";
import { orderTable, cartTable } from "../lib/db/schema";
import { eq } from "drizzle-orm";
import { Context } from "hono";
import { Variables } from "../lib/types";

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
    const secret = c.env.PAYSTACK_SECRET_KEY;
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
    console.log(`Processing Paystack webhook event: ${event}`);

    if (event === "charge.success") {
      await handleSuccessfulPayment(c, body.data);
    } else if (event === "charge.failed") {
      await handleFailedPayment(c, body.data);
    } else {
      // Log other events for debugging but still return success
      console.log(`Unhandled Paystack event: ${event}`, body);
    }

    // 4. Acknowledge receipt
    return c.json({ status: "success" });
  } catch (error) {
    console.error("Error processing Paystack webhook:", error);
    return c.json({ error: "Internal server error" }, 500);
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
  data: any
) {
  const db = c.get("db");

  try {
    // Extract the reference - this should be your order ID or code
    const reference = data.reference;
    if (!reference) {
      console.error("Missing reference in payment data");
      return;
    }

    // Find the order by the reference (assuming you stored it in paymentTransactionId)
    const order = await db.query.orderTable.findFirst({
      where: eq(orderTable.paymentTransactionId, reference),
      with: {
        cart: true,
      },
    });

    if (!order) {
      console.error(`No order found with payment reference: ${reference}`);
      return;
    }

    // Update the order status
    await db
      .update(orderTable)
      .set({
        paymentStatus: "COMPLETED",
        status: "PAYMENT_CONFIRMED", // New status we added to differentiate payment confirmation from seller acceptance
        acceptedAt: new Date().toISOString(),
      })
      .where(eq(orderTable.id, order.id));

    // If we found a cart associated with this order, update its status to "converted"
    if (order?.cart?.id) {
      await db
        .update(cartTable)
        .set({
          status: "CONVERTED", // Final state for the cart - it has been successfully converted to an order
        })
        .where(eq(cartTable.id, order.cart.id));
    }

    // Here you could add more logic:
    // - Send notifications to the customer
    // - Send notifications to the vendor
    // - Update inventory
    // - Record the transaction details in a payments table
  } catch (error) {
    console.error("Error updating order after payment:", error);
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
  data: any
) {
  const db = c.get("db");

  try {
    // Extract the reference - this should be your order ID or code
    const reference = data.reference;
    if (!reference) {
      console.error("Missing reference in payment data");
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
      console.error(`No order found with payment reference: ${reference}`);
      return;
    }

    // Update the order status to indicate payment failure
    await db
      .update(orderTable)
      .set({
        paymentStatus: "FAILED",
        status: "CANCELLED",
        canceledAt: new Date().toISOString(),
        cancelReason: "Payment failed",
      })
      .where(eq(orderTable.id, order.id));

    // Find the cart associated with this order

    // If we found a cart, restore it to active status so the customer can try again
    if (order?.cart?.id) {
      await db
        .update(cartTable)
        .set({
          status: "ACTIVE", // Revert back to active so user can retry checkout
        })
        .where(eq(cartTable.id, order.cart.id));
    }

    // Send notification to customer about payment failure
  } catch (error) {
    console.error("Error handling failed payment:", error);
  }
}

export default paystackWebhookRoute;
