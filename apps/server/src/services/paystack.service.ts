import { env } from "cloudflare:workers";

export interface PaystackRefundResponse {
  status: boolean;
  message: string;
  data?: {
    transaction: {
      id: number;
      domain: string;
      status: string;
      reference: string;
      amount: number;
      message: string;
      gateway_response: string;
      paid_at: string;
      created_at: string;
      channel: string;
      currency: string;
      ip_address: string;
      metadata: any;
      log?: {
        start_time: number;
        time_spent: number;
        attempts: number;
        errors: number;
        success: boolean;
        mobile: boolean;
        input: any[];
        history: any[];
      };
      fees: number;
      fees_split?: any;
      authorization?: any;
      customer?: any;
      plan?: any;
      split?: any;
      order_id?: any;
      paidAt?: string;
      createdAt?: string;
      requested_amount?: number;
      pos_transaction_data?: any;
      source?: any;
      fees_breakdown?: any;
    };
    integration: number;
    deducted_amount: number;
    channel: string;
    merchant_note: string;
    customer_note: string;
    status: string;
    refunded_by: string;
    refunded_at: string;
    expected_at: string;
    currency: string;
    domain: string;
    amount: number;
    fully_deducted: boolean;
    id: number;
    created_at: string;
    updated_at: string;
  };
}

export interface PaystackTransactionVerifyResponse {
  status: boolean;
  message: string;
  data?: {
    id: number;
    domain: string;
    status: string;
    reference: string;
    amount: number;
    message: string;
    gateway_response: string;
    paid_at: string;
    created_at: string;
    channel: string;
    currency: string;
    ip_address: string;
    metadata: any;
    fees: number;
    customer: any;
    authorization: any;
    plan: any;
  };
}

export class PaystackService {
  private baseUrl = "https://api.paystack.co";
  private secretKey: string;

  constructor() {
    this.secretKey = env.PAYSTACK_SECRET_KEY;
    if (!this.secretKey) {
      throw new Error("PAYSTACK_SECRET_KEY environment variable is required");
    }
  }
  private async makeRequest(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    const data = (await response.json()) as any;

    if (!response.ok) {
      console.error(`Paystack API error for ${endpoint}:`, {
        status: response.status,
        statusText: response.statusText,
        data,
      });
      throw new Error(
        `Paystack API error: ${data?.message || response.statusText}`
      );
    }

    return data;
  }
  async verifyTransaction(
    reference: string
  ): Promise<PaystackTransactionVerifyResponse> {
    try {
      console.log(`[PAYSTACK_SERVICE] Verifying transaction: ${reference}`);

      const response = (await this.makeRequest(
        `/transaction/verify/${reference}`
      )) as PaystackTransactionVerifyResponse;

      console.log(`[PAYSTACK_SERVICE] Transaction verification result:`, {
        reference,
        status: response.status,
        transactionStatus: response.data?.status,
      });

      return response;
    } catch (error) {
      console.error(
        `[PAYSTACK_SERVICE] Failed to verify transaction ${reference}:`,
        error
      );
      throw error;
    }
  }

  async refundTransaction(
    transactionReference: string,
    amount?: number,
    currency: string = "NGN",
    customerNote?: string,
    merchantNote?: string
  ): Promise<PaystackRefundResponse> {
    try {
      console.log(
        `[PAYSTACK_SERVICE] Initiating refund for transaction: ${transactionReference}`,
        {
          amount,
          currency,
          customerNote,
          merchantNote,
        }
      );

      const refundData: any = {
        transaction: transactionReference,
        currency,
      };

      if (amount) {
        refundData.amount = amount;
      }

      if (customerNote) {
        refundData.customer_note = customerNote;
      }

      if (merchantNote) {
        refundData.merchant_note = merchantNote;
      }
      const response = (await this.makeRequest("/refund", {
        method: "POST",
        body: JSON.stringify(refundData),
      })) as PaystackRefundResponse;

      console.log(`[PAYSTACK_SERVICE] Refund response:`, {
        reference: transactionReference,
        status: response.status,
        message: response.message,
        refundId: response.data?.id,
        refundAmount: response.data?.amount,
        refundStatus: response.data?.status,
      });

      return response;
    } catch (error) {
      console.error(
        `[PAYSTACK_SERVICE] Failed to refund transaction ${transactionReference}:`,
        error
      );
      throw error;
    }
  }
  async getTransactionTimeline(transactionId: string) {
    try {
      console.log(
        `[PAYSTACK_SERVICE] Getting timeline for transaction: ${transactionId}`
      );

      const response = (await this.makeRequest(
        `/transaction/timeline/${transactionId}`
      )) as any;

      console.log(`[PAYSTACK_SERVICE] Transaction timeline retrieved:`, {
        transactionId,
        status: response.status,
        timelineCount: response.data?.history?.length || 0,
      });

      return response;
    } catch (error) {
      console.error(
        `[PAYSTACK_SERVICE] Failed to get transaction timeline ${transactionId}:`,
        error
      );
      throw error;
    }
  }

  async chargeAuthorization(params: {
    authorizationCode: string;
    email: string;
    amount: number;
    currency?: string;
    reference?: string;
    metadata?: any;
  }) {
    try {
      console.log(`[PAYSTACK_SERVICE] Charging authorization:`, {
        email: params.email,
        amount: params.amount,
        reference: params.reference,
      });

      const chargeData = {
        authorization_code: params.authorizationCode,
        email: params.email,
        amount: params.amount,
        currency: params.currency || "NGN",
        reference: params.reference,
        metadata: params.metadata,
      };
      const response = (await this.makeRequest(
        "/transaction/charge_authorization",
        {
          method: "POST",
          body: JSON.stringify(chargeData),
        }
      )) as any;

      console.log(`[PAYSTACK_SERVICE] Authorization charge response:`, {
        reference: params.reference,
        status: response.status,
        transactionStatus: response.data?.status,
      });

      return response;
    } catch (error) {
      console.error(
        `[PAYSTACK_SERVICE] Failed to charge authorization:`,
        error
      );
      throw error;
    }
  }
}
