import { env } from "cloudflare:workers";

interface TermiiSMSPayload {
  to: string;
  from: string;
  sms: string;
  type: "plain";
  channel: "generic" | "dnd" | "whatsapp";
  api_key: string;
  media?: {
    url: string;
    caption: string;
  };
}

interface TermiiSMSResponse {
  message_id?: string;
  message: string;
  balance?: number;
  user?: string;
  code?: string;
}

interface TermiiBulkSMSPayload {
  to: string[];
  from: string;
  sms: string;
  type: "plain";
  channel: "generic" | "dnd" | "whatsapp";
  api_key: string;
}

export class SMSService {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = env.TERMII_BASE_URL || "https://api.ng.termii.com";
    this.apiKey = env.TERMII_API_KEY;
  }

  /**
   * Format phone number for Nigerian numbers
   */
  private formatPhoneNumber(phoneNumber: string): string {
    // Remove any non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, "");

    // Handle Nigerian numbers
    if (cleaned.startsWith("0") && cleaned.length === 11) {
      return `234${cleaned.slice(1)}`;
    }

    // If already in international format, return as is
    if (cleaned.startsWith("234")) {
      return cleaned;
    }

    // For other formats, assume it's a Nigerian number without country code
    if (cleaned.length === 10) {
      return `234${cleaned}`;
    }

    return cleaned;
  }

  /**
   * Send single SMS message
   */
  async sendSMS({
    to,
    message,
    from = "azumi",
    channel = "generic",
  }: {
    to: string;
    message: string;
    from?: string;
    channel?: "generic" | "dnd" | "whatsapp";
  }): Promise<TermiiSMSResponse> {
    try {
      const payload: TermiiSMSPayload = {
        to: this.formatPhoneNumber(to),
        from,
        sms: message,
        type: "plain",
        channel,
        api_key: this.apiKey,
      };

      const response = await fetch(`${this.baseUrl}/api/sms/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result: TermiiSMSResponse = await response.json();

      if (!response.ok) {
        console.error("❌ Termii SMS Error:", result);
        throw new Error(
          `SMS sending failed: ${result.message || "Unknown error"}`
        );
      }

      if (result.message === "Successfully Sent") {
        console.log(`✅ SMS sent successfully to ${to} via Termii`);
      } else {
        console.warn("⚠️ SMS sent but with warning:", result);
      }

      return result;
    } catch (error) {
      console.error("❌ Error sending SMS via Termii:", error);
      throw error;
    }
  }

  /**
   * Send bulk SMS messages
   */
  async sendBulkSMS({
    to,
    message,
    from = "azumi",
    channel = "generic",
  }: {
    to: string[];
    message: string;
    from?: string;
    channel?: "generic" | "dnd" | "whatsapp";
  }): Promise<TermiiSMSResponse> {
    try {
      // Format all phone numbers
      const formattedNumbers = to.map((phone) => this.formatPhoneNumber(phone));

      // Termii bulk API supports up to 10,000 numbers at once
      if (formattedNumbers.length > 10000) {
        throw new Error(
          "Bulk SMS supports maximum 10,000 phone numbers at once"
        );
      }

      const payload: TermiiBulkSMSPayload = {
        to: formattedNumbers,
        from,
        sms: message,
        type: "plain",
        channel,
        api_key: this.apiKey,
      };

      const response = await fetch(`${this.baseUrl}/api/sms/send/bulk`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result: TermiiSMSResponse = await response.json();

      if (!response.ok) {
        console.error("❌ Termii Bulk SMS Error:", result);
        throw new Error(
          `Bulk SMS sending failed: ${result.message || "Unknown error"}`
        );
      }

      if (result.message === "Successfully Sent") {
        console.log(
          `✅ Bulk SMS sent successfully to ${formattedNumbers.length} recipients via Termii`
        );
      } else {
        console.warn("⚠️ Bulk SMS sent but with warning:", result);
      }

      return result;
    } catch (error) {
      console.error("❌ Error sending bulk SMS via Termii:", error);
      throw error;
    }
  }

  /**
   * Send OTP SMS
   */
  async sendOTP({
    to,
    code,
    from = "azumi",
  }: {
    to: string;
    code: string;
    from?: string;
  }): Promise<TermiiSMSResponse> {
    const message = `Your Azumi OTP code is ${code}. Expires in 5 minutes. Thank you.`;

    return this.sendSMS({
      to,
      message,
      from,
      channel: "generic", // Use DND channel for OTP to ensure delivery
    });
  }

  /**
   * Send notification SMS
   */
  async sendNotification({
    to,
    title,
    message,
    from = "azumi",
  }: {
    to: string;
    title?: string;
    message: string;
    from?: string;
  }): Promise<TermiiSMSResponse> {
    const fullMessage = title ? `${title}\n\n${message}` : message;

    return this.sendSMS({
      to,
      message: fullMessage,
      from,
      channel: "generic", // Use generic channel for notifications
    });
  }
}

// Export singleton instance
export const smsService = new SMSService();
