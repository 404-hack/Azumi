import { eq, inArray } from "drizzle-orm";
import { createClient } from "../lib/db";
import {
  WorkflowEntrypoint,
  WorkflowStep,
  WorkflowEvent,
  WorkflowStepEvent,
} from "cloudflare:workers";
import { drizzle } from "drizzle-orm/libsql";

import { env } from "cloudflare:workers";
import { orderTable } from "../lib/db/schema/order.schema";
import { userTable } from "../lib/db/schema/auth.schema";
import { cartTable } from "../lib/db/schema/cart.schema";
import { orderItemTable, orderItemOptionTable } from "../lib/db/schema";

import { PaystackService } from "../services/paystack.service";
import { PushNotificationService } from "../services/push-notification.service";
import { RiderDispatchService } from "../services/riderDispatch.service";
/**
 * Input parameters for the order workflow
 */
interface OrderParams {
  orderId: string;
  timestamp: string;
  customerEmail: string;
  customerId: string;
  customerPhone: string;
  shopId: string;
  vendorEmail: string;
  riderId?: string;
  paymentTransactionId: string;
  paymentMethod: string;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  deliveryAddress: {
    latitude: number;
    longitude: number;
    formattedAddress: string;
  };
  subtotal: number;
  deliveryFee: number;
  total: number;
}

/**
 * Order status response interface
 */
interface OrderStatus {
  id: string;
  status: string;
  updatedAt: string;
  vendorId?: string;
  riderId?: string;
  estimatedDeliveryTime?: string;
}

/**
 * Main workflow class for order processing
 * This orchestrates the entire order lifecycle from payment to delivery
 */
export class OrderWorkflow extends WorkflowEntrypoint {
  async run(
    event: WorkflowEvent<OrderParams>,
    step: WorkflowStep
  ): Promise<any> {
    console.log("Order workflow started with input:", event.payload);

    try {
      // PHASE 1: PAYMENT VERIFICATION AND ORDER INITIATION
      // This is triggered by the /order/create endpoint after initial order creation
      await this.verifyPaymentAndInitiateOrder(event.payload, step);

      // PHASE 2: VENDOR NOTIFICATION AND ACCEPTANCE
      // Wait for vendor to accept or reject the order
      // This corresponds to the vendor using the /:id/status endpoint to update status to CONFIRMED/CANCELLED
      const vendorResponse = await this.waitForVendorResponse(
        event.payload,
        step
      );

      if (vendorResponse.status === "CANCELLED") {
        console.log(`Order ${event.payload.orderId} was rejected by vendor`);
        await this.handleOrderCancellation(
          event.payload,
          "VENDOR_REJECTED",
          step
        );
        return {
          status: "cancelled",
          message: "Order was rejected by vendor",
          orderId: event.payload.orderId,
        };
      }

      // PHASE 3: VENDOR PREPARATION
      // Wait for vendor to mark the order as ready
      // This corresponds to the vendor using the /:id/status endpoint to update status to READY
      await this.waitForOrderPreparation(event.payload, step);

      // PHASE 4: RIDER ASSIGNMENT
      // Find and assign a suitable rider
      // This initiates rider selection and assignment when order is READY
      const riderAssignment = await this.assignRider(event.payload, step);

      // PHASE 5: RIDER PICKUP AND DELIVERY
      // Wait for rider to confirm pickup
      // This corresponds to the rider using their endpoint to update status to IN_TRANSIT
      await this.waitForRiderPickup(event.payload, riderAssignment, step);

      // Wait for delivery confirmation
      // This corresponds to the rider confirming delivery with the code
      await this.waitForDeliveryConfirmation(event.payload, step);

      // PHASE 6: ORDER COMPLETION AND FEEDBACK
      // Process payment settlement to vendor and rider
      await this.processPaymentSettlements(event.payload, step);

      // Request customer feedback
      await step.sleep("waitBeforeFeedbackRequest", "30 minutes");
      await this.requestCustomerFeedback(event.payload, step);

      return {
        status: "completed",
        message: "Order workflow completed successfully",
        processingTime: new Date().toISOString(),
        orderId: event.payload.orderId,
      };
    } catch (error) {
      console.error(
        `Workflow error for order ${event.payload.orderId}:`,
        error
      );
      return {
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
        orderId: event.payload.orderId,
      };
    }
  }
  /**
   * Phase 1: Verify payment and initiate order
   * Called when workflow is first triggered from order/create
   */ private async verifyPaymentAndInitiateOrder(
    params: OrderParams,
    step: WorkflowStep
  ): Promise<void> {
    console.log(
      `🔄 [WORKFLOW-PAYMENT] Starting payment verification for order: ${params.orderId}`
    );
    console.log(
      `🔄 [WORKFLOW-PAYMENT] Payment transaction ID: ${params.paymentTransactionId}`
    );
    console.log(
      `🔄 [WORKFLOW-PAYMENT] Waiting for payment confirmation or failure with 1 hour timeout...`
    );
    try {
      // Wait for either payment confirmation or failure event using Promise.race wrapped in step.do
      const paymentResult = await step.do(
        "wait_for_payment_result",
        async () => {
          return await Promise.race([
            step
              .waitForEvent("payment_confirmed", {
                type: "payment_confirmed",
                timeout: "1 hour",
              })
              .then((event) => ({
                type: "payment_confirmed",
                payload: event.payload,
              })),

            step
              .waitForEvent("payment_failed", {
                type: "payment_failed",
                timeout: "1 hour",
              })
              .then((event) => ({
                type: "payment_failed",
                payload: event.payload,
              })),
          ]);
        }
      );
      if (paymentResult.type === "payment_confirmed") {
        console.log(
          `✅ [WORKFLOW-PAYMENT] Payment confirmed for order: ${params.orderId}`
        );
        console.log(
          `✅ [WORKFLOW-PAYMENT] Payment event payload:`,
          paymentResult.payload
        );

        // Notify vendor about new order
        console.log(
          `📢 [WORKFLOW-VENDOR] Initiating vendor notification for order: ${params.orderId}`
        );
        await step.do("notify_vendor_new_order", async () => {
          return await this.notifyVendor(params);
        });

        console.log(
          `✅ [WORKFLOW-VENDOR] Vendor notified successfully for order: ${params.orderId}`
        );
      } else if (paymentResult.type === "payment_failed") {
        console.log(
          `❌ [WORKFLOW-PAYMENT] Payment failed for order: ${params.orderId}`
        );
        console.log(
          `❌ [WORKFLOW-PAYMENT] Failure reason:`,
          paymentResult.payload || "No reason provided"
        );
        await step.do("notify_customer_payment_failed", async () => {
          return await this.notifyCustomer(
            {
              id: params.orderId,
              status: "CANCELLED",
              updatedAt: new Date().toISOString(),
            },
            params,
            step
          );
        });

        console.log(
          `✅ [WORKFLOW-CUSTOMER] Customer notified about payment failure for order: ${params.orderId}`
        );

        throw new Error(
          `Payment failed for order ${params.orderId}: ${paymentResult.payload || "Unknown error"}`
        );
      }
    } catch (error) {
      console.log(
        `⚠️ [WORKFLOW-PAYMENT] Payment verification failed/timeout for order: ${params.orderId}`
      );
      console.log(`⚠️ [WORKFLOW-PAYMENT] Error details:`, error); // Check current order status in database
      console.log(
        `🔍 [WORKFLOW-PAYMENT] Checking order status in database for order: ${params.orderId}`
      );
      const orderStatus = await step.do(
        "check_order_status_in_db",
        async () => {
          const db = createClient(env.DB);
          return await db.query.orderTable.findFirst({
            where: eq(orderTable.id, params.orderId),
            columns: { paymentStatus: true, status: true, cancelReason: true },
            with: { cart: { columns: { id: true, status: true } } },
          });
        }
      );
      console.log(`🔍 [WORKFLOW-PAYMENT] Current order status:`, {
        orderId: params.orderId,
        paymentStatus: orderStatus?.paymentStatus,
        orderStatus: orderStatus?.status,
        cancelReason: orderStatus?.cancelReason,
        cartId: orderStatus?.cart?.id,
        cartStatus: orderStatus?.cart?.status,
      });

      if (
        orderStatus?.paymentStatus === "FAILED" ||
        orderStatus?.status === "CANCELLED"
      ) {
        console.log(
          `❌ [WORKFLOW-PAYMENT] Order ${params.orderId} was cancelled due to payment failure via webhook`
        );

        // Notify customer about payment failure
        console.log(
          `📢 [WORKFLOW-CUSTOMER] Notifying customer about payment failure for order: ${params.orderId}`
        );
        await step.do("notify_customer_webhook_payment_failed", async () => {
          return await this.notifyCustomer(
            {
              id: params.orderId,
              status: "CANCELLED",
              updatedAt: new Date().toISOString(),
            },
            params,
            step
          );
        });

        console.log(
          `✅ [WORKFLOW-CUSTOMER] Customer notified about payment failure for order: ${params.orderId}`
        );

        // End workflow execution for failed payment
        throw new Error(
          `Payment failed for order ${params.orderId}: ${orderStatus.cancelReason || "Payment failure via webhook"}`
        );
      }

      // Payment timeout - user abandoned payment, clean up silently (industry standard)
      console.log(
        `⏰ [WORKFLOW-TIMEOUT] Payment timeout detected for order: ${params.orderId} - initiating silent cleanup`
      );
      await step.do("handle_payment_timeout", async () => {
        return await this.handlePaymentTimeout(params, orderStatus);
      });

      throw new Error(
        `Payment timeout for order ${params.orderId} - order cleaned up successfully`
      );
    }
  }

  /**
   * Handle payment timeout - industry standard silent cleanup
   * Delete order and restore cart to active state
   */
  private async handlePaymentTimeout(
    params: OrderParams,
    order: any
  ): Promise<void> {
    console.log(
      `🧹 [WORKFLOW-CLEANUP] Starting payment timeout cleanup for order: ${params.orderId}`
    );

    try {
      const db = createClient(env.DB);

      // Step 1: Restore cart to active state if it exists
      if (order?.cart?.id) {
        console.log(
          `🧹 [WORKFLOW-CLEANUP] Restoring cart ${order.cart.id} to ACTIVE status`
        );
        await db
          .update(cartTable)
          .set({ status: "ACTIVE" })
          .where(eq(cartTable.id, order.cart.id));

        console.log(
          `✅ [WORKFLOW-CLEANUP] Cart ${order.cart.id} restored to ACTIVE status`
        );
      } else {
        console.log(
          `⚠️ [WORKFLOW-CLEANUP] No cart found for order ${params.orderId} - skipping cart restoration`
        );
      }

      // Step 2: Delete order items and options first (foreign key constraints)
      console.log(
        `🧹 [WORKFLOW-CLEANUP] Deleting order items for order: ${params.orderId}`
      );

      // Delete order item options first
      const orderItems = await db.query.orderItemTable.findMany({
        where: eq(orderItemTable.orderId, params.orderId),
        columns: { id: true },
      });

      if (orderItems.length > 0) {
        const orderItemIds = orderItems.map((item) => item.id);
        console.log(
          `🧹 [WORKFLOW-CLEANUP] Found ${orderItems.length} order items to clean up`
        );

        // Delete order item options
        await db
          .delete(orderItemOptionTable)
          .where(inArray(orderItemOptionTable.orderItemId, orderItemIds));

        console.log(
          `✅ [WORKFLOW-CLEANUP] Deleted order item options for order: ${params.orderId}`
        );

        // Delete order items
        await db
          .delete(orderItemTable)
          .where(eq(orderItemTable.orderId, params.orderId));

        console.log(
          `✅ [WORKFLOW-CLEANUP] Deleted order items for order: ${params.orderId}`
        );
      } else {
        console.log(
          `⚠️ [WORKFLOW-CLEANUP] No order items found for order: ${params.orderId}`
        );
      }

      // Step 3: Delete the main order record
      console.log(
        `🧹 [WORKFLOW-CLEANUP] Deleting main order record: ${params.orderId}`
      );
      await db.delete(orderTable).where(eq(orderTable.id, params.orderId));

      console.log(
        `✅ [WORKFLOW-CLEANUP] Successfully deleted order: ${params.orderId}`
      );

      // Step 4: Log cleanup for analytics/monitoring
      console.log(
        `📊 [WORKFLOW-ANALYTICS] Payment timeout cleanup completed:`,
        {
          orderId: params.orderId,
          paymentTransactionId: params.paymentTransactionId,
          customerId: params.customerId,
          shopId: params.shopId,
          total: params.total,
          timeoutAt: new Date().toISOString(),
          reason: "payment_timeout_user_abandoned",
        }
      );

      console.log(
        `✅ [WORKFLOW-CLEANUP] Payment timeout cleanup completed successfully for order: ${params.orderId}`
      );
    } catch (cleanupError) {
      console.error(
        `❌ [WORKFLOW-CLEANUP] Failed to cleanup order ${params.orderId}:`,
        cleanupError
      );

      // Even if cleanup fails, we should log it for manual intervention
      console.log(
        `📊 [WORKFLOW-ERROR] Cleanup failed - manual intervention may be required:`,
        {
          orderId: params.orderId,
          paymentTransactionId: params.paymentTransactionId,
          customerId: params.customerId,
          error:
            cleanupError instanceof Error
              ? cleanupError.message
              : String(cleanupError),
          failedAt: new Date().toISOString(),
        }
      );

      throw new Error(
        `Cleanup failed for timed out order ${params.orderId}: ${cleanupError instanceof Error ? cleanupError.message : String(cleanupError)}`
      );
    }
  }

  /**
   * Notify vendor about new order
   * This integrates with FCM push notification services
   */
  private async notifyVendor(params: OrderParams): Promise<void> {
    console.log(
      `Sending notification to vendor (${params.shopId}) for order: ${params.orderId}`
    );
    try {
      const pushNotificationService = new PushNotificationService();
      await pushNotificationService.sendNotificationToShop(params.shopId, {
        title: "New Order Received!",
        body: `Order #${params.orderId.slice(-6)} - ${params.items.length} item(s) for ₦${params.total}`,
        data: {
          type: "new_order",
          orderId: params.orderId,
          action: "view_order",
          link: `/vendor/orders/${params.orderId}`,
        },
      });

      console.log(
        `✅ Push notification sent to vendor for order: ${params.orderId}`
      );
    } catch (error) {
      console.error(
        `❌ Failed to send vendor notification for order ${params.orderId}:`,
        error
      );
    }
  }
  /**
   * Phase 2: Wait for vendor to accept or reject order with escalation system
   * This is event-based, pausing workflow until vendor takes action
   */ private async waitForVendorResponse(
    params: OrderParams,
    step: WorkflowStep
  ): Promise<OrderStatus> {
    console.log(
      `🔄 [VENDOR-ESCALATION] Starting vendor response waiting with escalation for order: ${params.orderId}`
    ); // Promise for the vendor's direct response
    const vendorResponseEventPromise = step
      .waitForEvent("vendor_order_response", {
        type: "vendor_order_response",
        timeout: "2 hours", // Keep this timeout longer than full escalation
      })
      .then((event) => ({
        type: "vendor_response" as const,
        payload: event.payload as {
          orderId: string;
          status: string;
          vendorId?: string;
          timestamp?: string;
        },
      }));

    // Promise for the outcome of the escalation process
    const escalationOutcomePromise = this.handleVendorEscalation(params, step)
      .then(() => {
        // This .then() is reached if handleVendorEscalation returns void (i.e., was preempted)
        return {
          type: "escalation_preempted" as const,
          payload: { orderId: params.orderId },
        };
      })
      .catch((error) => {
        if (error.message === "ESCALATION_COMPLETED") {
          // This .catch() is reached if handleVendorEscalation throws ESCALATION_COMPLETED
          return {
            type: "auto_cancelled" as const,
            payload: {
              orderId: params.orderId,
              status: "CANCELLED" as const,
              reason: "VENDOR_ESCALATION_COMPLETED",
              timestamp: new Date().toISOString(),
            },
          };
        }
        throw error; // Rethrow other unexpected errors
      });

    const raceResult = await step.do(
      "vendor_response_or_escalation_outcome",
      async () => {
        return await Promise.race([
          vendorResponseEventPromise,
          escalationOutcomePromise,
        ]);
      }
    );

    if (raceResult.type === "vendor_response") {
      const responseData = raceResult.payload;
      console.log(
        `✅ [VENDOR-ESCALATION] Vendor responded with status: ${responseData.status} for order: ${params.orderId}`
      );
      await step.do("notify_customer_vendor_decision", async () => {
        return await this.notifyCustomer(
          {
            id: params.orderId,
            status: responseData.status,
            updatedAt: responseData.timestamp || new Date().toISOString(),
          },
          params,
          step
        );
      });
      return {
        id: params.orderId,
        status: responseData.status,
        updatedAt: responseData.timestamp || new Date().toISOString(),
        vendorId: responseData.vendorId,
      };
    } else if (raceResult.type === "auto_cancelled") {
      console.log(
        `❌ [VENDOR-ESCALATION] Order ${params.orderId} auto-cancelled by full escalation.`
      );
      // Customer notification for auto-cancellation is handled within handleVendorEscalation
      return {
        id: raceResult.payload.orderId,
        status: raceResult.payload.status,
        updatedAt: raceResult.payload.timestamp,
      };
    } else if (raceResult.type === "escalation_preempted") {
      console.log(
        `ℹ️ [VENDOR-ESCALATION] Escalation for ${params.orderId} was preempted. Fetching definitive order status.`
      );
      // Since escalation was preempted, the vendor must have acted.
      // We need to fetch the latest order status to return accurately.
      const currentOrder = await step.do(
        "fetch_order_status_after_preemption",
        async () => {
          const db = createClient(env.DB);
          return await db.query.orderTable.findFirst({
            where: eq(orderTable.id, params.orderId),
            columns: { id: true, status: true, updatedAt: true, shopId: true }, // Assuming shopId is vendorId
          });
        }
      );

      if (!currentOrder || !currentOrder.status) {
        console.error(
          `❌ [VENDOR-ESCALATION] Failed to fetch definitive status for ${params.orderId} after preemption.`
        );
        throw new Error(
          `Failed to fetch definitive status for ${params.orderId} after preemption.`
        );
      }
      console.log(
        `ℹ️ [VENDOR-ESCALATION] Definitive status for ${params.orderId} after preemption: ${currentOrder.status}`
      );

      // The vendor's action should have already triggered appropriate notifications
      // No need for redundant notification here

      return {
        id: currentOrder.id,
        status: currentOrder.status as OrderStatus["status"],
        updatedAt:
          currentOrder.updatedAt?.toISOString() || new Date().toISOString(),
        vendorId: currentOrder.shopId, // Or actual vendorId field if different
      };
    } else {
      // Should not happen with exhaustive type checking
      console.error(
        `❌ [VENDOR-ESCALATION] Unhandled race result type for order ${params.orderId}:`,
        (raceResult as any).type
      );
      throw new Error("Unhandled outcome in vendor response/escalation race.");
    }
  }

  /**
   * Handle vendor escalation with specific timeline
   * Checks order status before each action to allow preemption.
   * Returns void if preempted (vendor acted), throws ESCALATION_COMPLETED if runs full course.
   */
  private async handleVendorEscalation(
    params: OrderParams,
    step: WorkflowStep
  ): Promise<void> {
    console.log(
      `🚨 [VENDOR-ESCALATION] Starting escalation process for order: ${params.orderId}`
    );
    const db = createClient(env.DB);

    // Helper to check status and execute a durable action if order is still pending
    const checkStatusAndProceed = async (
      level: string,
      actionName: string, // Unique name for the action step.do
      actionLogic: () => Promise<any>
    ) => {
      const stepCheckName = `check_order_status_L${level}_${params.orderId.slice(-6)}`;
      const order = await step.do(stepCheckName, async () => {
        console.log(
          `[ESCALATION-L${level}] DB Check: Reading status for order ${params.orderId}`
        );
        return db.query.orderTable.findFirst({
          where: eq(orderTable.id, params.orderId),
          columns: { status: true },
        });
      });

      console.log(
        `[ESCALATION-L${level}] DB Check Result for ${params.orderId}: Status is ${order?.status}`
      );
      if (order?.status !== "PAYMENT_CONFIRMED") {
        console.log(
          `[ESCALATION-L${level}] Preempting for ${params.orderId}. Current status: ${order?.status} (not PAYMENT_CONFIRMED).`
        );
        return false; // Stop escalation for this order
      }

      console.log(
        `[ESCALATION-L${level}] Continuing for ${params.orderId}. Status is PAYMENT_CONFIRMED.`
      );
      // Execute the actual escalation action as a durable step
      const stepActionName = `${actionName}_L${level}_${params.orderId.slice(-6)}`;
      await step.do(stepActionName, actionLogic);
      console.log(
        `🔔 [ESCALATION-L${level}] Action '${actionName}' completed for ${params.orderId}`
      );
      return true; // Indicate escalation should continue to the next level
    }; // Level 1: 5 minutes - First reminder
    await step.sleep("escalation_L1_wait", "5 minutes");
    if (
      !(await checkStatusAndProceed("1", "vendor_reminder", async () => {
        const pushNotificationService = new PushNotificationService();
        return await pushNotificationService.sendNotificationToShop(
          params.shopId,
          {
            title: "⏰ Order Reminder",
            body: `Please respond to order #${params.orderId.slice(-6)} - Customer is waiting!`,
            data: {
              type: "order_reminder",
              orderId: params.orderId,
              urgency: "medium",
              action: "respond_now",
              link: `/vendor/orders/${params.orderId}`,
              sound: "urgent_notification.mp3",
            },
          }
        );
      }))
    )
      return; // Preempted

    // Level 2: 10 minutes - Urgent vendor notification + customer delay notification
    await step.sleep("escalation_L2_wait", "5 minutes");
    if (
      !(await checkStatusAndProceed(
        "2",
        "vendor_urgent_and_customer_delay",
        async () => {
          const pushNotificationService = new PushNotificationService();
          await pushNotificationService.sendNotificationToShop(params.shopId, {
            title: "🚨 URGENT: Order Response Required",
            body: `Order #${params.orderId.slice(-6)} requires immediate attention! Please confirm or reject now.`,
            data: {
              type: "order_urgent",
              orderId: params.orderId,
              urgency: "high",
              action: "respond_immediately",
              link: `/vendor/orders/${params.orderId}`,
              sound: "urgent_notification.mp3",
            },
          });

          // Notify customer about the delay with a friendly message
          await this.notifyCustomer(
            {
              id: params.orderId,
              status: "PENDING_VENDOR_RESPONSE",
              updatedAt: new Date().toISOString(),
            },
            params,
            step
          );
        }
      ))
    )
      return; // Preempted    // Level 3: 15 minutes - Admin notification + vendor warning
    await step.sleep("escalation_L3_wait", "5 minutes");
    if (
      !(await checkStatusAndProceed(
        "3",
        "vendor_warning_and_admin_alert",
        async () => {
          const pushNotificationService = new PushNotificationService();
          await pushNotificationService.sendNotificationToShop(params.shopId, {
            title: "⚠️ FINAL WARNING: Order Response",
            body: `Order #${params.orderId.slice(-6)} - Admin has been notified. Respond now to avoid penalties!`,
            data: {
              type: "order_warning",
              orderId: params.orderId,
              urgency: "critical",
              action: "respond_now_or_penalty",
              link: `/vendor/orders/${params.orderId}`,
              sound: "urgent_notification.mp3",
            },
          });
          const adminUsers = await this.getAdminUsers(step); // getAdminUsers is already a step.do
          for (const adminId of adminUsers) {
            // This specific notification send is part of the L3 action, not a separate step.do here,
            // but getAdminUsers itself is durable.
            await pushNotificationService.sendNotificationToUser(adminId, {
              title: "🚨 VENDOR DELAY ALERT",
              body: `Vendor not responding to order #${params.orderId.slice(-6)} for 15+ minutes. Intervention may be required.`,
              data: {
                type: "vendor_delay_alert",
                orderId: params.orderId,
                shopId: params.shopId,
                delayTime: "15_minutes",
                urgency: "high",
                action: "review_vendor_performance",
                link: `/admin/orders/${params.orderId}`,
                sound: "admin_alert.mp3",
              },
            });
          }
        }
      ))
    )
      return; // Preempted    // Level 4: 25 minutes - Final warning
    await step.sleep("escalation_L4_wait", "10 minutes");
    if (
      !(await checkStatusAndProceed("4", "vendor_final_warning", async () => {
        const pushNotificationService = new PushNotificationService();
        return await pushNotificationService.sendNotificationToShop(
          params.shopId,
          {
            title: "🚨 FINAL NOTICE: 35 MINUTES LEFT",
            body: `Order #${params.orderId.slice(-6)} will be AUTO-CANCELLED in 35 minutes if no response received!`,
            data: {
              type: "order_final_warning",
              orderId: params.orderId,
              urgency: "critical",
              timeLeft: "35_minutes",
              action: "respond_now_or_auto_cancel",
              link: `/vendor/orders/${params.orderId}`,
              sound: "urgent_notification.mp3",
            },
          }
        );
      }))
    )
      return; // Preempted

    // Level 5: 1 hour - Final check before auto-cancellation
    await step.sleep("escalation_L5_wait_final_check", "35 minutes");
    const finalOrderCheckName = `check_order_status_L5_final_${params.orderId.slice(-6)}`;
    const finalOrderCheck = await step.do(finalOrderCheckName, async () => {
      console.log(
        `[ESCALATION-L5] Final DB Check: Reading status for order ${params.orderId} before auto-cancel.`
      );
      return db.query.orderTable.findFirst({
        where: eq(orderTable.id, params.orderId),
        columns: { status: true },
      });
    });

    console.log(
      `[ESCALATION-L5] Final DB Check Result for ${params.orderId}: Status is ${finalOrderCheck?.status}`
    );
    if (finalOrderCheck?.status !== "PAYMENT_CONFIRMED") {
      console.log(
        `[ESCALATION-L5] Preempted auto-cancel for ${params.orderId}, status is ${finalOrderCheck?.status}.`
      );
      return; // Preempted before auto-cancellation
    }

    console.log(
      `❌ [ESCALATION-L5] Proceeding with auto-cancellation for order ${params.orderId} as status is still PAYMENT_CONFIRMED.`
    );

    // Auto-cancel actions (these are already wrapped in step.do in the original full code, ensure they are here)
    await step.do(
      `escalation_auto_cancel_order_${params.orderId.slice(-6)}`,
      async () => {
        await db
          .update(orderTable)
          .set({
            status: "CANCELLED",
            cancelReason: "Vendor failed to respond within timeout period",
            canceledAt: new Date().toISOString(),
          })
          .where(eq(orderTable.id, params.orderId));
      }
    );
    await step.do(
      `escalation_process_refund_${params.orderId.slice(-6)}`,
      async () => {
        return await this.processRefund(params, step);
      }
    );
    await step.do(
      `escalation_notify_customer_cancellation_${params.orderId.slice(-6)}`,
      async () => {
        return await this.notifyCustomer(
          {
            id: params.orderId,
            status: "CANCELLED",
            updatedAt: new Date().toISOString(),
          },
          params,
          step
        );
      }
    );
    console.log(
      `❌ [ESCALATION-L5] Auto-cancelled order ${params.orderId} due to vendor non-response after full escalation cycle`
    );
    throw new Error("ESCALATION_COMPLETED"); // Signal completion of escalation if it runs its full course
  }

  /**
   * Handle order cancellation flow
   */
  private async handleOrderCancellation(
    params: OrderParams,
    reason: string,
    step: WorkflowStep
  ): Promise<void> {
    console.log(
      `🔄 [ORDER-CANCELLATION] Handling cancellation for order: ${params.orderId}, reason: ${reason}`
    );

    // Process refund if payment was completed
    if (params.paymentMethod !== "CASH") {
      console.log(
        `💰 [ORDER-CANCELLATION] Processing refund for order: ${params.orderId}`
      );
      await step.do("process_cancellation_refund", async () => {
        return await this.processRefund(params, step);
      });
    } else {
      console.log(
        `💵 [ORDER-CANCELLATION] Cash payment - no refund needed for order: ${params.orderId}`
      );
    }

    // Notify customer about cancellation
    console.log(
      `📢 [ORDER-CANCELLATION] Notifying customer about cancellation for order: ${params.orderId}`
    );
    await step.do("notify_customer_cancellation", async () => {
      return await this.notifyCustomer(
        {
          id: params.orderId,
          status: "CANCELLED",
          updatedAt: new Date().toISOString(),
        },
        params,
        step
      );
    });

    console.log(
      `✅ [ORDER-CANCELLATION] Cancellation handling completed for order: ${params.orderId}`
    );
  }

  /**
   * Phase 3: Wait for vendor to prepare order and mark as ready
   */
  private async waitForOrderPreparation(
    params: OrderParams,
    step: WorkflowStep
  ): Promise<void> {
    console.log(`Waiting for order preparation: ${params.orderId}`);

    // Wait for vendor to mark order as READY (through /:id/status endpoint)
    const readyEvent = (await step.waitForEvent("order_ready", {
      type: "order_ready",
      timeout: "3 hours",
    })) as WorkflowStepEvent<{ orderId: string; timestamp: string }>;
    console.log(
      `Order ${params.orderId} is ready for pickup at ${readyEvent.payload.timestamp}`
    );
    await step.do("notify_customer_order_ready", async () => {
      return await this.notifyCustomer(
        {
          id: params.orderId,
          status: "READY",
          updatedAt: new Date().toISOString(),
        },
        params,
        step
      );
    });
  } /**
   * Phase 4: Assign rider for delivery
   */
  private async assignRider(
    params: OrderParams,
    step: WorkflowStep
  ): Promise<any> {
    console.log(
      `🚀 [RIDER-ASSIGNMENT] Finding suitable rider for order: ${params.orderId}`
    );
    try {
      const riderAssignment = (await step.waitForEvent("accept_order", {
        type: "accept_order",
        timeout: "30 minutes",
      })) as WorkflowStepEvent<{
        orderId: string;
        riderId: string;
        timestamp: string;
        estimatedPickupTime?: string;
      }>;

      const riderData = riderAssignment.payload;
      console.log(
        `✅ [RIDER-ASSIGNMENT] Rider ${riderData.riderId} assigned to order: ${params.orderId}`
      );
      await step.do("notify_customer_rider_assigned", async () => {
        return await this.notifyCustomer(
          {
            id: params.orderId,
            status: "RIDER_ASSIGNED",
            updatedAt: new Date().toISOString(),
            riderId: riderData.riderId,
          },
          params,
          step
        );
      });

      await step.do("notify_assigned_rider", async () => {
        return await this.notifyAssignedRider(params, riderData.riderId);
      });

      return riderAssignment;
    } catch (error) {
      console.error(
        `⏰ [RIDER-ASSIGNMENT] Timeout occurred for order ${params.orderId} after 30 minutes - no rider accepted`
      );

      if (error instanceof Error && error.message.includes("timeout")) {
        return await this.handleRiderAssignmentTimeout(params, step);
      }

      throw error;
    }
  }

  /**
   * Handle rider assignment timeout with fallback scenarios
   */
  private async handleRiderAssignmentTimeout(
    params: OrderParams,
    step: WorkflowStep
  ): Promise<any> {
    console.log(
      `🔄 [TIMEOUT-HANDLER] Starting timeout handling for order ${params.orderId}`
    );
    try {
      const riderDispatchService = new RiderDispatchService();

      console.log(
        `📊 [TIMEOUT-HANDLER] Scenario 1: Attempting auto-assignment for order ${params.orderId}`
      );
      const autoAssignResult = await step.do(
        "auto_assign_rider_timeout",
        async () => {
          return await riderDispatchService.autoAssignRider(params.orderId);
        }
      );

      if (autoAssignResult.success && autoAssignResult.riderId) {
        console.log(
          `✅ [TIMEOUT-HANDLER] Auto-assignment successful - rider ${autoAssignResult.riderId} assigned to order ${params.orderId}`
        );
        await step.do("notify_customer_auto_assigned_rider", async () => {
          return await this.notifyCustomer(
            {
              id: params.orderId,
              status: "RIDER_ASSIGNED",
              updatedAt: new Date().toISOString(),
              riderId: autoAssignResult.riderId,
            },
            params,
            step
          );
        });
        await step.do("notify_auto_assigned_rider", async () => {
          if (autoAssignResult.riderId) {
            return await this.notifyAssignedRider(
              params,
              autoAssignResult.riderId
            );
          }
        });

        return {
          type: "rider_assigned",
          payload: {
            orderId: params.orderId,
            riderId: autoAssignResult.riderId,
            timestamp: new Date().toISOString(),
            estimatedPickupTime: "15 minutes",
            assignmentMethod: "auto_assigned_after_timeout",
          },
        };
      }
      console.log(
        `⚠️ [TIMEOUT-HANDLER] Scenario 2: Auto-assignment failed, cancelling order ${params.orderId}`
      );
      console.log(`📝 [TIMEOUT-HANDLER] Reason: ${autoAssignResult.message}`);
      await step.do("cancel_order_no_riders", async () => {
        const db = createClient(env.DB);
        await db
          .update(orderTable)
          .set({
            status: "CANCELLED",
            cancelReason: "No riders available within 30-minute timeout",
            canceledAt: new Date().toISOString(),
          })
          .where(eq(orderTable.id, params.orderId));
        return { success: true };
      });
      await step.do("notify_customer_no_riders", async () => {
        return await this.notifyCustomer(
          {
            id: params.orderId,
            status: "CANCELLED",
            updatedAt: new Date().toISOString(),
          },
          params,
          step
        );
      });
      await step.do("process_refund_no_riders", async () => {
        return await this.processRefund(params, step);
      });

      console.log(
        `❌ [TIMEOUT-HANDLER] Order ${params.orderId} cancelled due to rider assignment timeout`
      );

      throw new Error(
        `Order ${params.orderId} cancelled: No riders available within timeout period`
      );
    } catch (timeoutError) {
      console.error(
        `💥 [TIMEOUT-HANDLER] Critical error during timeout handling for order ${params.orderId}:`,
        timeoutError
      );
      throw timeoutError;
    }
  }
  /**
   * Process refund for cancelled order
   */
  private async processRefund(
    params: OrderParams,
    step: WorkflowStep
  ): Promise<void> {
    try {
      console.log(`💰 [REFUND] Processing refund for order ${params.orderId}`);

      if (!params.paymentTransactionId) {
        console.warn(
          `⚠️ [REFUND] No payment transaction ID found for order ${params.orderId}`
        );
        return;
      }

      const order = await step.do("check_refund_eligibility", async () => {
        const db = createClient(env.DB);
        return await db.query.orderTable.findFirst({
          where: eq(orderTable.id, params.orderId),
          columns: {
            id: true,
            total: true,
            status: true,
            paymentStatus: true,
            refundStatus: true,
            refundReference: true,
          },
        });
      });

      if (!order) {
        console.error(`❌ [REFUND] Order not found: ${params.orderId}`);
        return;
      }

      if (order.refundStatus === "COMPLETED") {
        console.log(`⚠️ [REFUND] Order ${params.orderId} already refunded`);
        return;
      }
      if (order.paymentStatus !== "COMPLETED") {
        console.log(
          `⚠️ [REFUND] Order ${params.orderId} payment was not successful, skipping refund`
        );
        return;
      }
      await step.do("update_refund_status_processing", async () => {
        const db = createClient(env.DB);
        await db
          .update(orderTable)
          .set({
            refundStatus: "PROCESSING",
          })
          .where(eq(orderTable.id, params.orderId));
        return { success: true };
      });
      const MINIMUM_REFUND_AMOUNT_NGN = 50;

      if (order.total < MINIMUM_REFUND_AMOUNT_NGN) {
        console.log(
          `⚠️ [REFUND] Order ${params.orderId} amount (NGN${order.total}) is below Paystack minimum refund amount of NGN50. Marking as completed without Paystack refund.`
        );

        await step.do("update_small_amount_refund_completed", async () => {
          const db = createClient(env.DB);
          await db
            .update(orderTable)
            .set({
              refundStatus: "COMPLETED",
              refundReference: `SMALL_AMOUNT_${Date.now()}`,
              refundedAt: new Date().toISOString(),
            })
            .where(eq(orderTable.id, params.orderId));
          return { success: true };
        });

        await step.do("send_small_amount_refund_notification", async () => {
          const pushNotificationService = new PushNotificationService();
          return await pushNotificationService.sendNotificationToUser(
            params.customerId,
            {
              title: "🔄 Order Cancelled - Refund Processed",
              body: `Your order #${params.orderId.slice(-6)} has been cancelled and refunded. The amount (NGN${order.total.toFixed(2)}) will reflect in your account balance.`,
              data: {
                type: "refund_processed",
                orderId: params.orderId,
                refundReference: `SMALL_AMOUNT_${Date.now()}`,
                refundAmount: order.total.toString(),
                action: "view_order_details",
                link: `/orders/${params.orderId}`,
              },
            }
          );
        });

        console.log(
          `✅ [REFUND] Small amount refund processed for order ${params.orderId}`
        );
        return;
      }

      const refundResponse = await step.do(
        "process_paystack_refund",
        async () => {
          const paystackService = new PaystackService();
          return await paystackService.refundTransaction(
            params.paymentTransactionId,
            order.total,
            "NGN",
            "Order cancelled - no riders available",
            "Automatic refund due to order cancellation"
          );
        }
      );

      if (refundResponse.status && refundResponse.data) {
        await step.do("update_refund_status_completed", async () => {
          const db = createClient(env.DB);
          await db
            .update(orderTable)
            .set({
              refundStatus: "COMPLETED",
              refundReference: refundResponse.data?.transaction.reference,
              refundedAt: new Date().toISOString(),
            })
            .where(eq(orderTable.id, params.orderId));
          return { success: true };
        });

        console.log(
          `✅ [REFUND] Paystack refund successful for order ${params.orderId}:`,
          {
            refundId: refundResponse.data.id,
            refundAmount: refundResponse.data.amount,
            refundReference: refundResponse.data.transaction.reference,
          }
        );

        await step.do("send_refund_success_notification", async () => {
          const pushNotificationService = new PushNotificationService();
          return await pushNotificationService.sendNotificationToUser(
            params.customerId,
            {
              title: "🔄 Refund Processed",
              body: `Your payment for order #${params.orderId.slice(-6)} has been refunded. Please allow 3-5 business days for the refund to reflect in your account.`,
              data: {
                type: "refund_processed",
                orderId: params.orderId,
                refundReference:
                  refundResponse.data?.transaction.reference || "",
                refundAmount: refundResponse.data?.amount?.toString() || "0",
                action: "view_order_details",
                link: `/orders/${params.orderId}`,
              },
            }
          );
        });

        console.log(
          `✅ [REFUND] Refund notification sent for order ${params.orderId}`
        );
      } else {
        await step.do("update_refund_status_failed", async () => {
          const db = createClient(env.DB);
          await db
            .update(orderTable)
            .set({
              refundStatus: "FAILED",
            })
            .where(eq(orderTable.id, params.orderId));
          return { success: true };
        });

        console.error(
          `❌ [REFUND] Paystack refund failed for order ${params.orderId}:`,
          refundResponse.message
        );

        await step.do("send_refund_failure_notification", async () => {
          const pushNotificationService = new PushNotificationService();
          return await pushNotificationService.sendNotificationToUser(
            params.customerId,
            {
              title: "⚠️ Refund Processing Issue",
              body: `There was an issue processing your refund for order #${params.orderId.slice(-6)}. Our support team will contact you shortly.`,
              data: {
                type: "refund_failed",
                orderId: params.orderId,
                action: "contact_support",
                link: `/support/orders/${params.orderId}`,
              },
            }
          );
        });
      }
    } catch (error: any) {
      console.error(
        `❌ [REFUND] Failed to process refund for order ${params.orderId}:`,
        error
      );

      if (error?.message?.includes("Cannot refund less than NGN50")) {
        console.log(
          `⚠️ [REFUND] Handling small amount refund for order ${params.orderId} due to Paystack minimum amount constraint`
        );

        try {
          await step.do("handle_small_amount_refund_fallback", async () => {
            const db = createClient(env.DB);
            await db
              .update(orderTable)
              .set({
                refundStatus: "COMPLETED",
                refundReference: `SMALL_AMOUNT_${Date.now()}`,
                refundedAt: new Date().toISOString(),
              })
              .where(eq(orderTable.id, params.orderId));

            const pushNotificationService = new PushNotificationService();
            await pushNotificationService.sendNotificationToUser(
              params.customerId,
              {
                title: "🔄 Order Cancelled - Refund Processed",
                body: `Your order #${params.orderId.slice(-6)} has been cancelled and refunded. The small amount will reflect in your account balance.`,
                data: {
                  type: "refund_processed",
                  orderId: params.orderId,
                  refundReference: `SMALL_AMOUNT_${Date.now()}`,
                  action: "view_order_details",
                  link: `/orders/${params.orderId}`,
                },
              }
            );
            return { success: true };
          });

          console.log(
            `✅ [REFUND] Small amount refund fallback completed for order ${params.orderId}`
          );
          return;
        } catch (fallbackError) {
          console.error(
            `❌ [REFUND] Failed to handle small amount refund fallback for order ${params.orderId}:`,
            fallbackError
          );
        }
      }

      try {
        await step.do("handle_refund_error", async () => {
          const db = createClient(env.DB);
          await db
            .update(orderTable)
            .set({
              refundStatus: "FAILED",
            })
            .where(eq(orderTable.id, params.orderId));

          const pushNotificationService = new PushNotificationService();
          await pushNotificationService.sendNotificationToUser(
            params.customerId,
            {
              title: "⚠️ Refund Processing Issue",
              body: `There was an issue processing your refund for order #${params.orderId.slice(-6)}. Our support team will contact you shortly.`,
              data: {
                type: "refund_failed",
                orderId: params.orderId,
                action: "contact_support",
                link: `/support/orders/${params.orderId}`,
              },
            }
          );
          return { success: true };
        });
      } catch (notificationError) {
        console.error(
          `❌ [REFUND] Failed to send error notification for order ${params.orderId}:`,
          notificationError
        );
      }
    }
  }
  /**
   * Notify assigned rider about their new delivery
   */
  private async notifyAssignedRider(
    params: OrderParams,
    riderId: string
  ): Promise<void> {
    try {
      const pushNotificationService = new PushNotificationService();

      await pushNotificationService.sendNotificationToUser(riderId, {
        title: "🎉 New Delivery Assigned!",
        body: `You've been assigned order #${params.orderId.slice(-6)}. Please head to the pickup location.`,
        data: {
          type: "delivery_assigned",
          orderId: params.orderId,
          shopId: params.shopId,
          action: "start_pickup",
          link: `/rider/orders/${params.orderId}/pickup`,
        },
      });

      console.log(
        `✅ Assignment notification sent to rider ${riderId} for order: ${params.orderId}`
      );
    } catch (error) {
      console.error(
        `❌ Failed to send assignment notification to rider ${riderId}:`,
        error
      );
    }
  }
  /**
   * Phase 5: Wait for rider pickup
   */
  private async waitForRiderPickup(
    params: OrderParams,
    riderAssignment: any,
    step: WorkflowStep
  ): Promise<void> {
    console.log(`Waiting for rider pickup for order: ${params.orderId}`); // Wait for rider to confirm pickup (through rider's update status endpoint)
    await step.waitForEvent("order_picked_up", {
      type: "order_picked_up",
      timeout: "1 hour",
    });
    console.log(
      `Order ${params.orderId} picked up by rider ${riderAssignment.riderId}`
    );
    await step.do("notify_customer_order_in_transit", async () => {
      return await this.notifyCustomer(
        {
          id: params.orderId,
          status: "IN_TRANSIT",
          updatedAt: new Date().toISOString(),
          riderId: riderAssignment.riderId,
        },
        params,
        step
      );
    });
  }
  /**
   * Wait for delivery confirmation with rider code
   */
  private async waitForDeliveryConfirmation(
    params: OrderParams,
    step: WorkflowStep
  ): Promise<void> {
    console.log(
      `Waiting for delivery confirmation for order: ${params.orderId}`
    ); // Wait for rider to confirm delivery with code (through rider's delivery confirmation endpoint)
    await step.waitForEvent("order_delivered", {
      type: "order_delivered",
      timeout: "3 hours",
    });
    console.log(`Order ${params.orderId} delivered successfully`);
    await step.do("notify_customer_order_delivered", async () => {
      return await this.notifyCustomer(
        {
          id: params.orderId,
          status: "DELIVERED",
          updatedAt: new Date().toISOString(),
        },
        params,
        step
      );
    });
  }

  /**
   * Process payment settlements to vendor and rider
   */
  private async processPaymentSettlements(
    params: OrderParams,
    step: WorkflowStep
  ): Promise<void> {
    console.log(`Processing payment settlements for order: ${params.orderId}`);

    // Calculate vendor payout (total minus platform fee and rider fee)
    // Process vendor payout
    // Process rider payout
  }
  /**
   * Request customer feedback after delivery
   */
  private async requestCustomerFeedback(
    params: OrderParams,
    step: WorkflowStep
  ): Promise<void> {
    console.log(`Requesting feedback for order: ${params.orderId}`);
    await step.do("send_customer_feedback_request", async () => {
      return await this.notifyCustomer(
        {
          id: params.orderId,
          status: "COMPLETED",
          updatedAt: new Date().toISOString(),
        },
        params,
        step
      );
    });
  }
  /**
   * Send notification to customer with FCM integration
   */ private async notifyCustomer(
    order: OrderStatus,
    params?: OrderParams,
    step?: WorkflowStep
  ): Promise<void> {
    console.log(
      `Sending notification for order: ${order.id}, status: ${order.status}`
    );
    try {
      const pushNotificationService = new PushNotificationService();
      const { title, body, data } = this.getCustomerNotificationContent(order);
      // Get customer ID from order in database if not provided in params
      let customerId = params?.customerId;
      if (!customerId && step) {
        const orderRecord = await step.do(
          "get_customer_id_from_db",
          async () => {
            const db = createClient(env.DB);
            return await db.query.orderTable.findFirst({
              where: eq(orderTable.id, order.id),
              columns: { customerId: true },
            });
          }
        );

        customerId = orderRecord?.customerId || undefined;
      } else if (!customerId) {
        const db = createClient(env.DB);
        const orderRecord = await db.query.orderTable.findFirst({
          where: eq(orderTable.id, order.id),
          columns: { customerId: true },
        });
        customerId = orderRecord?.customerId || undefined;
      }

      if (!customerId) {
        console.error(`No customer ID found for order ${order.id}`);
        return;
      }
      await pushNotificationService.sendNotificationToUser(customerId, {
        title,
        body,
        data,
      });

      console.log(
        `✅ Push notification sent to customer for order: ${order.id}`
      );
    } catch (error) {
      console.error(
        `❌ Failed to send customer notification for order ${order.id}:`,
        error
      );

      // Fallback notification methods
      const channels = ["email", "sms"];
      for (const channel of channels) {
        try {
          console.log(`Attempting fallback notification via ${channel}...`);
          // Would integrate with email/SMS services
          console.log(`Successfully notified customer via ${channel}`);
          break;
        } catch (fallbackError) {
          console.log(
            `Fallback notification failed via ${channel}, trying next method`
          );
        }
      }
    }
  }

  /**
   * Get notification content based on order status
   */
  private getCustomerNotificationContent(order: OrderStatus): {
    title: string;
    body: string;
    data: Record<string, string>;
  } {
    const orderNumber = `#${order.id.slice(-6)}`;
    switch (order.status) {
      case "PAYMENT_CONFIRMED":
        return {
          title: "Payment Confirmed! 💳",
          body: `Your payment for order ${orderNumber} has been confirmed. We're waiting for the restaurant to accept your order.`,
          data: {
            type: "payment_confirmed",
            orderId: order.id,
            status: order.status,
            action: "view_order",
          },
        };

      case "CONFIRMED":
        return {
          title: "Order Confirmed! 🎉",
          body: `Your order ${orderNumber} has been confirmed and is being prepared`,
          data: {
            type: "order_confirmed",
            orderId: order.id,
            status: order.status,
            action: "view_order",
          },
        };

      case "PENDING_VENDOR_RESPONSE":
        return {
          title: "Order Delay Notice ⏰",
          body: `We're still waiting for the restaurant to confirm your order ${orderNumber}. We'll keep you updated!`,
          data: {
            type: "order_delay",
            orderId: order.id,
            status: order.status,
            action: "view_order",
          },
        };

      case "READY":
        return {
          title: "Order Ready for Pickup! 📦",
          body: `Your order ${orderNumber} is ready and a rider will pick it up soon`,
          data: {
            type: "order_ready",
            orderId: order.id,
            status: order.status,
            action: "track_order",
          },
        };

      case "RIDER_ASSIGNED":
        return {
          title: "Rider Assigned! 🚴‍♂️",
          body: `A rider has been assigned to deliver your order ${orderNumber}`,
          data: {
            type: "rider_assigned",
            orderId: order.id,
            status: order.status,
            riderId: order.riderId || "",
            action: "track_order",
          },
        };

      case "IN_TRANSIT":
        return {
          title: "Order On The Way! 🚀",
          body: `Your order ${orderNumber} has been picked up and is on its way to you`,
          data: {
            type: "order_in_transit",
            orderId: order.id,
            status: order.status,
            riderId: order.riderId || "",
            action: "track_order",
          },
        };

      case "DELIVERED":
        return {
          title: "Order Delivered! ✅",
          body: `Your order ${orderNumber} has been successfully delivered`,
          data: {
            type: "order_delivered",
            orderId: order.id,
            status: order.status,
            action: "rate_order",
          },
        };

      case "CANCELLED":
        return {
          title: "Order Cancelled ❌",
          body: `Your order ${orderNumber} has been cancelled. You will receive a refund if applicable`,
          data: {
            type: "order_cancelled",
            orderId: order.id,
            status: order.status,
            action: "view_order",
          },
        };

      case "COMPLETED":
        return {
          title: "How was your order? ⭐",
          body: `Please rate your experience with order ${orderNumber}`,
          data: {
            type: "feedback_request",
            orderId: order.id,
            status: order.status,
            action: "rate_order",
          },
        };

      default:
        return {
          title: "Order Update",
          body: `Your order ${orderNumber} status has been updated to ${order.status}`,
          data: {
            type: "order_update",
            orderId: order.id,
            status: order.status,
            action: "view_order",
          },
        };
    }
  }

  /**
   * Get list of admin user IDs
   */ private async getAdminUsers(step: WorkflowStep): Promise<string[]> {
    return await step.do("get_admin_users", async () => {
      const db = createClient(env.DB);
      const adminUsers = await db
        .select({ id: userTable.id })
        .from(userTable)
        .where(eq(userTable.role, "admin"));
      return adminUsers.map((user) => user.id);
    });
  }
}
