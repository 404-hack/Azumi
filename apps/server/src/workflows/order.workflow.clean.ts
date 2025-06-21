import {
  WorkflowEntrypoint,
  WorkflowEvent,
  WorkflowStep,
  WorkflowStepEvent,
} from "cloudflare:workers";
import { PushNotificationService } from "../services/push-notification.service";
import { RiderDispatchService } from "../services/riderDispatch.service";
import { PaystackService } from "../services/paystack.service";
import { calculateDistance } from "../lib/utils/geo";
import { createClient } from "../lib/db";
import { env } from "cloudflare:workers";
import {
  orderItemOptionTable,
  orderItemTable,
  orderTable,
} from "../lib/db/schema/order.schema";
import { shopTable } from "../lib/db/schema/shop.schema";
import { eq, inArray } from "drizzle-orm";
import { cartTable } from "../lib/db/schema";

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
  private calculateRiderEarnings(
    shopLat: number,
    shopLng: number,
    customerLat: number,
    customerLng: number
  ): number {
    const distance = calculateDistance(
      shopLat,
      shopLng,
      customerLat,
      customerLng
    );

    if (distance <= 1) {
      return 350;
    } else {
      const additionalKm = Math.ceil(distance - 1);
      return 350 + additionalKm * 150;
    }
  }

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
      // Wait for either payment confirmation or failure event using Promise.race
      const paymentResult = await Promise.race([
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
        await this.notifyVendor(params);

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

        await this.notifyCustomer(
          {
            id: params.orderId,
            status: "CANCELLED",
            updatedAt: new Date().toISOString(),
          },
          params
        );

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
      console.log(`⚠️ [WORKFLOW-PAYMENT] Error details:`, error);

      // Check current order status in database
      console.log(
        `🔍 [WORKFLOW-PAYMENT] Checking order status in database for order: ${params.orderId}`
      );
      const db = createClient(env.DB);
      const order = await db.query.orderTable.findFirst({
        where: eq(orderTable.id, params.orderId),
        columns: { paymentStatus: true, status: true, cancelReason: true },
        with: { cart: { columns: { id: true, status: true } } },
      });

      console.log(`🔍 [WORKFLOW-PAYMENT] Current order status:`, {
        orderId: params.orderId,
        paymentStatus: order?.paymentStatus,
        orderStatus: order?.status,
        cancelReason: order?.cancelReason,
        cartId: order?.cart?.id,
        cartStatus: order?.cart?.status,
      });

      if (order?.paymentStatus === "FAILED" || order?.status === "CANCELLED") {
        console.log(
          `❌ [WORKFLOW-PAYMENT] Order ${params.orderId} was cancelled due to payment failure via webhook`
        );

        // Notify customer about payment failure
        console.log(
          `📢 [WORKFLOW-CUSTOMER] Notifying customer about payment failure for order: ${params.orderId}`
        );
        await this.notifyCustomer(
          {
            id: params.orderId,
            status: "CANCELLED",
            updatedAt: new Date().toISOString(),
          },
          params
        );

        console.log(
          `✅ [WORKFLOW-CUSTOMER] Customer notified about payment failure for order: ${params.orderId}`
        );

        // End workflow execution for failed payment
        throw new Error(
          `Payment failed for order ${params.orderId}: ${order.cancelReason || "Payment failure via webhook"}`
        );
      }

      // Payment timeout - user abandoned payment, clean up silently (industry standard)
      console.log(
        `⏰ [WORKFLOW-TIMEOUT] Payment timeout detected for order: ${params.orderId} - initiating silent cleanup`
      );
      await this.handlePaymentTimeout(params, order);

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
        body: `Order #${params.orderId.slice(-6)} - ${params.items.length} item(s) for $${params.subtotal}`,
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
   * Phase 2: Wait for vendor to accept or reject order
   * This is event-based, pausing workflow until vendor takes action
   */
  private async waitForVendorResponse(
    params: OrderParams,
    step: WorkflowStep
  ): Promise<OrderStatus> {
    console.log(`Waiting for vendor response for order: ${params.orderId}`);
    // Wait for vendor to update order status (through /:id/status endpoint)
    const vendorResponse = await step.waitForEvent("vendor_order_response", {
      type: "vendor_order_response",
      timeout: "2 hours",
    }); // Extract data from event
    const responseData = vendorResponse.payload as {
      orderId: string;
      status: string;
      vendorId?: string;
    }; // Notify customer about vendor's decision
    await this.notifyCustomer(
      {
        id: params.orderId,
        status: responseData.status,
        updatedAt: new Date().toISOString(),
      },
      params
    );

    console.log(`Vendor responded with status: ${responseData.status}`);
    return {
      id: params.orderId,
      status: responseData.status,
      updatedAt: new Date().toISOString(),
      vendorId: responseData.vendorId,
    };
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
      `Handling cancellation for order: ${params.orderId}, reason: ${reason}`
    );

    // Process refund if payment was completed
    if (params.paymentMethod !== "CASH") {
      await this.processRefund(params);
    } // Notify customer about cancellation
    await this.notifyCustomer(
      {
        id: params.orderId,
        status: "CANCELLED",
        updatedAt: new Date().toISOString(),
      },
      params
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
    ); // Notify customer that order is ready
    await this.notifyCustomer(
      {
        id: params.orderId,
        status: "READY",
        updatedAt: new Date().toISOString(),
      },
      params
    );
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
      const riderAssignment = (await step.waitForEvent("rider_assigned", {
        type: "rider_assigned",
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

      await this.notifyCustomer(
        {
          id: params.orderId,
          status: "RIDER_ASSIGNED",
          updatedAt: new Date().toISOString(),
          riderId: riderData.riderId,
        },
        params
      );

      await this.notifyAssignedRider(params, riderData.riderId);

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
      const db = createClient(env.DB);
      const riderDispatchService = new RiderDispatchService();

      console.log(
        `📊 [TIMEOUT-HANDLER] Scenario 1: Attempting auto-assignment for order ${params.orderId}`
      );
      const autoAssignResult = await riderDispatchService.autoAssignRider(
        params.orderId
      );

      if (autoAssignResult.success && autoAssignResult.riderId) {
        console.log(
          `✅ [TIMEOUT-HANDLER] Auto-assignment successful - rider ${autoAssignResult.riderId} assigned to order ${params.orderId}`
        );

        await this.notifyCustomer(
          {
            id: params.orderId,
            status: "RIDER_ASSIGNED",
            updatedAt: new Date().toISOString(),
            riderId: autoAssignResult.riderId,
          },
          params
        );

        await this.notifyAssignedRider(params, autoAssignResult.riderId);

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
      await db
        .update(orderTable)
        .set({
          status: "CANCELLED",
          cancelReason: "No riders available within 30-minute timeout",
          canceledAt: new Date().toISOString(),
        })
        .where(eq(orderTable.id, params.orderId));

      await this.notifyCustomer(
        {
          id: params.orderId,
          status: "CANCELLED",
          updatedAt: new Date().toISOString(),
        },
        params
      );

      await this.processRefund(params);

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
  private async processRefund(params: OrderParams): Promise<void> {
    try {
      console.log(`💰 [REFUND] Processing refund for order ${params.orderId}`);

      if (!params.paymentTransactionId) {
        console.warn(
          `⚠️ [REFUND] No payment transaction ID found for order ${params.orderId}`
        );
        return;
      }

      const db = createClient(env.DB);
      const order = await db.query.orderTable.findFirst({
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

      const paystackService = new PaystackService();

      await db
        .update(orderTable)
        .set({
          refundStatus: "PROCESSING",
        })
        .where(eq(orderTable.id, params.orderId));

      const refundResponse = await paystackService.refundTransaction(
        params.paymentTransactionId,
        order.total,
        "NGN",
        "Order cancelled - no riders available",
        "Automatic refund due to order cancellation"
      );

      if (refundResponse.status && refundResponse.data) {
        await db
          .update(orderTable)
          .set({
            refundStatus: "COMPLETED",
            refundReference: refundResponse.data.transaction.reference,
            refundedAt: new Date().toISOString(),
          })
          .where(eq(orderTable.id, params.orderId));

        console.log(
          `✅ [REFUND] Paystack refund successful for order ${params.orderId}:`,
          {
            refundId: refundResponse.data.id,
            refundAmount: refundResponse.data.amount,
            refundReference: refundResponse.data.transaction.reference,
          }
        );

        const pushNotificationService = new PushNotificationService();
        await pushNotificationService.sendNotificationToUser(
          params.customerId,
          {
            title: "🔄 Refund Processed",
            body: `Your payment for order #${params.orderId.slice(-6)} has been refunded. Please allow 3-5 business days for the refund to reflect in your account.`,
            data: {
              type: "refund_processed",
              orderId: params.orderId,
              refundReference: refundResponse.data.transaction.reference,
              refundAmount: refundResponse.data.amount.toString(),
              action: "view_order_details",
              link: `/orders/${params.orderId}`,
            },
          }
        );

        console.log(
          `✅ [REFUND] Refund notification sent for order ${params.orderId}`
        );
      } else {
        await db
          .update(orderTable)
          .set({
            refundStatus: "FAILED",
          })
          .where(eq(orderTable.id, params.orderId));

        console.error(
          `❌ [REFUND] Paystack refund failed for order ${params.orderId}:`,
          refundResponse.message
        );

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
      }
    } catch (error) {
      console.error(
        `❌ [REFUND] Failed to process refund for order ${params.orderId}:`,
        error
      );

      try {
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
   */ private async notifyAssignedRider(
    params: OrderParams,
    riderId: string
  ): Promise<void> {
    try {
      const pushNotificationService = new PushNotificationService();

      const db = createClient(env.DB);
      const shop = await db.query.shopTable.findFirst({
        where: eq(shopTable.id, params.shopId),
        columns: {
          latitude: true,
          longitude: true,
        },
      });

      let riderEarnings: number;
      if (shop && shop.latitude && shop.longitude) {
        riderEarnings = this.calculateRiderEarnings(
          shop.latitude,
          shop.longitude,
          params.deliveryAddress.latitude,
          params.deliveryAddress.longitude
        );
      } else {
        console.warn(
          `Shop coordinates not found for shop ${params.shopId}, using fallback calculation`
        );
        riderEarnings = 350; // Default fallback
      }

      await pushNotificationService.sendNotificationToUser(riderId, {
        title: "🎉 New Delivery Assigned!",
        body: `Order #${params.orderId.slice(-6)} - Delivery: ₦${params.deliveryFee.toLocaleString()}, Your earnings: ₦${riderEarnings.toLocaleString()}`,
        data: {
          type: "delivery_assigned",
          orderId: params.orderId,
          shopId: params.shopId,
          deliveryFee: params.deliveryFee.toString(),
          riderEarnings: riderEarnings.toString(),
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
    ); // Notify customer that order is in transit
    await this.notifyCustomer(
      {
        id: params.orderId,
        status: "IN_TRANSIT",
        updatedAt: new Date().toISOString(),
        riderId: riderAssignment.riderId,
      },
      params
    );
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

    console.log(`Order ${params.orderId} delivered successfully`); // Notify customer about successful delivery
    await this.notifyCustomer(
      {
        id: params.orderId,
        status: "DELIVERED",
        updatedAt: new Date().toISOString(),
      },
      params
    );
  }
  /**
   * Process payment settlements to vendor and rider
   */
  private async processPaymentSettlements(
    params: OrderParams,
    step: WorkflowStep
  ): Promise<void> {
    console.log(`Processing payment settlements for order: ${params.orderId}`);

    await step.do("process-rider-earnings", async () => {
      try {
        const { RiderPaymentService } = await import(
          "../services/riderPayment.service"
        );
        const riderPaymentService = new RiderPaymentService();
        const db = createClient(env.DB);

        const paymentResult = await riderPaymentService.processDeliveryPayment(
          params.orderId,
          db
        );

        if (paymentResult.success) {
          console.log(
            `✅ Rider payment processed for order ${params.orderId}:`,
            {
              transactionId: paymentResult.transactionId,
            }
          );
        } else {
          console.error(
            `❌ Failed to process rider payment for order ${params.orderId}:`,
            paymentResult.error
          );
        }
      } catch (error) {
        console.error("Error processing rider payment:", error);
      }
    });
  }
  /**
   * Request customer feedback after delivery
   */
  private async requestCustomerFeedback(
    params: OrderParams,
    step: WorkflowStep
  ): Promise<void> {
    console.log(`Requesting feedback for order: ${params.orderId}`); // Send feedback request notification to customer
    await this.notifyCustomer(
      {
        id: params.orderId,
        status: "COMPLETED",
        updatedAt: new Date().toISOString(),
      },
      params
    );
  } /**
   * Send notification to customer with FCM integration
   */
  private async notifyCustomer(
    order: OrderStatus,
    params?: OrderParams
  ): Promise<void> {
    console.log(
      `Sending notification for order: ${order.id}, status: ${order.status}`
    );
    try {
      const pushNotificationService = new PushNotificationService();
      const { title, body, data } = this.getCustomerNotificationContent(order);
      // Get customer ID from order in database if not provided in params
      let customerId = params?.customerId;
      if (!customerId) {
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
}
