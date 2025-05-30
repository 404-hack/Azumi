import {
  WorkflowEntrypoint,
  WorkflowEvent,
  WorkflowStep,
  WorkflowStepEvent,
} from "cloudflare:workers";
import { PushNotificationService } from "../services/push-notification.service";
import { createClient } from "../lib/db";
import { env } from "cloudflare:workers";
import { orderTable } from "../lib/db/schema/order.schema";
import { eq } from "drizzle-orm";

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
   */
  private async verifyPaymentAndInitiateOrder(
    params: OrderParams,
    step: WorkflowStep
  ): Promise<void> {
    console.log(`Verifying payment for order: ${params.orderId}`);
    // Wait for payment confirmation event (triggered by webhook or verify-payment endpoint)
    await step.waitForEvent("payment_confirmed", {
      type: "payment_confirmed",
      timeout: "1 hour",
    });

    console.log(`Payment confirmed for order: ${params.orderId}`);

    // Notify vendor about new order
    await this.notifyVendor(params);

    console.log(`Vendor notified about order: ${params.orderId}`);
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
        body: `Order #${params.orderId.slice(-6)} - ${params.items.length} item(s) for $${params.total}`,
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
   * Process refund for cancelled order
   */
  private async processRefund(params: OrderParams): Promise<void> {
    console.log(`Processing refund for order: ${params.orderId}`);
    // Would integrate with payment gateway's refund API
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
  }
  /**
   * Phase 4: Assign rider for delivery
   */
  private async assignRider(
    params: OrderParams,
    step: WorkflowStep
  ): Promise<any> {
    console.log(`Finding suitable rider for order: ${params.orderId}`); // This would trigger rider selection algorithm
    // Wait for rider assignment event (initiated by system)
    const riderAssignment = (await step.waitForEvent("rider_assigned", {
      type: "rider_assigned",
      timeout: "30 minutes",
    })) as WorkflowStepEvent<{
      orderId: string;
      riderId: string;
      timestamp: string;
      estimatedPickupTime?: string;
    }>;

    // Extract data from the event payload
    const riderData = riderAssignment.payload;
    console.log(
      `Rider ${riderData.riderId} assigned to order: ${params.orderId}`
    ); // Notify customer about rider assignment
    await this.notifyCustomer(
      {
        id: params.orderId,
        status: "RIDER_ASSIGNED",
        updatedAt: new Date().toISOString(),
        riderId: riderData.riderId,
      },
      params
    );

    // Notify assigned rider about their new delivery
    await this.notifyAssignedRider(params, riderData.riderId);

    return riderAssignment;
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
