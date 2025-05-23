import {
  WorkflowEntrypoint,
  WorkflowEvent,
  WorkflowStep,
  WorkflowStepEvent,
} from "cloudflare:workers";

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
   * This would integrate with notification services
   */
  private async notifyVendor(params: OrderParams): Promise<void> {
    console.log(
      `Sending notification to vendor (${params.shopId}) for order: ${params.orderId}`
    );
    // Would integrate with push notification, SMS, or email services
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
    });

    // Extract data from event
    const responseData = vendorResponse.data as {
      orderId: string;
      status: string;
      vendorId?: string;
    };

    // Notify customer about vendor's decision
    await this.notifyCustomer({
      id: params.orderId,
      status: responseData.status,
      updatedAt: new Date().toISOString(),
    });

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
    }

    // Notify customer about cancellation
    await this.notifyCustomer({
      id: params.orderId,
      status: "CANCELLED",
      updatedAt: new Date().toISOString(),
    });
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
    );

    // Notify customer that order is ready
    await this.notifyCustomer({
      id: params.orderId,
      status: "READY",
      updatedAt: new Date().toISOString(),
    });
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
    await this.notifyCustomer({
      id: params.orderId,
      status: "RIDER_ASSIGNED",
      updatedAt: new Date().toISOString(),
      riderId: riderData.riderId,
    });

    return riderAssignment;
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

    // Notify customer that order is in transit
    await this.notifyCustomer({
      id: params.orderId,
      status: "IN_TRANSIT",
      updatedAt: new Date().toISOString(),
      riderId: riderAssignment.riderId,
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

    // Notify customer about successful delivery
    await this.notifyCustomer({
      id: params.orderId,
      status: "DELIVERED",
      updatedAt: new Date().toISOString(),
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

    // Send feedback request notification to customer
    await this.notifyCustomer({
      id: params.orderId,
      status: "COMPLETED",
      updatedAt: new Date().toISOString(),
    });
  }

  /**
   * Send notification to customer
   */
  private async notifyCustomer(order: OrderStatus): Promise<void> {
    console.log(
      `Sending notification for order: ${order.id}, status: ${order.status}`
    );

    const channels = ["email", "sms", "push"];

    for (const channel of channels) {
      try {
        console.log(`Attempting to notify via ${channel}...`);
        // Would integrate with notification services
        console.log(`Successfully notified customer via ${channel}`);
        break;
      } catch (error) {
        console.log(`Notification failed via ${channel}, trying next method`);
      }
    }
  }
}
