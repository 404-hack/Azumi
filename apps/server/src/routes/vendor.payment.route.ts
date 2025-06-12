import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { vendorAuth } from "../middlewares/vendorAuth";
import { Context } from "hono";
import { db } from "../lib/db";
import { CloudflareBindings, Variables } from "../lib/types/app";
import { eq, and, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { shopPaymentMethodTable } from "../lib/db/schema/shop.schema";
import { transactionTable } from "../lib/db/schema/payment.schema";

// Schema validation
const bankAccountVerifySchema = z.object({
  accountNumber: z.string().length(10),
  bankCode: z.string(),
});

const paymentMethodSchema = z.object({
  type: z.enum(["BANK_TRANSFER", "CARD", "MOBILE_MONEY"]),
  name: z.string(),
  accountNumber: z.string().optional(),
  accountName: z.string().optional(),
  bankName: z.string().optional(),
  bankCode: z.string().optional(),
  isDefault: z.boolean().optional(),
  instructions: z.string().optional(),
  additionalDetails: z.string().optional(),
});

// Create a router
const vendorPaymentRoute = new Hono<{
  Bindings: CloudflareBindings;
  Variables: Variables;
}>();

// Apply vendor authorization middleware to all routes
vendorPaymentRoute.use("*", vendorAuth);

// Get banks list from Paystack
vendorPaymentRoute.get("/banks", async (c) => {
  try {
    // Fetch list of banks from Paystack
    const response = await fetch("https://api.paystack.co/bank", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${c.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return c.json(
        {
          success: false,
          message: "Failed to fetch banks from payment provider",
        },
        500
      );
    }

    const data = await response.json();

    // Return only active banks and format them
    if (data.status) {
      const banks = data.data
        .filter((bank: any) => bank.active)
        .map((bank: any) => ({
          id: bank.id,
          name: bank.name,
          code: bank.code,
        }));

      return c.json({ success: true, data: banks });
    } else {
      return c.json(
        {
          success: false,
          message: "Failed to process bank list",
        },
        400
      );
    }
  } catch (error) {
    console.error("Error fetching banks:", error);
    return c.json(
      {
        success: false,
        message: "Internal server error",
      },
      500
    );
  }
});

// Verify bank account
vendorPaymentRoute.post(
  "/verify-account",
  zValidator("json", bankAccountVerifySchema),
  async (c) => {
    try {
      const { accountNumber, bankCode } = c.req.valid("json");

      // Call Paystack to verify the account
      const response = await fetch(
        `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${c.env.PAYSTACK_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (data.status) {
        return c.json({
          success: true,
          data: {
            accountName: data.data.account_name,
          },
        });
      } else {
        return c.json(
          {
            success: false,
            message: data.message || "Could not verify account",
          },
          400
        );
      }
    } catch (error) {
      console.error("Error verifying account:", error);
      return c.json(
        {
          success: false,
          message: "Internal server error",
        },
        500
      );
    }
  }
);

// Create Paystack transfer recipient (for payment processing)
async function createPaystackRecipient(
  c: Context<{
    Bindings: CloudflareBindings;
    Variables: Variables;
  }>,
  accountData: any
) {
  try {
    const response = await fetch("https://api.paystack.co/transferrecipient", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${c.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "nuban",
        name: accountData.accountName,
        account_number: accountData.accountNumber,
        bank_code: accountData.bankCode,
        currency: "NGN", // Adjust as needed for your market
      }),
    });

    const data = await response.json();

    if (data.status) {
      return data.data.recipient_code;
    } else {
      throw new Error(data.message || "Failed to create recipient");
    }
  } catch (error) {
    console.error("Error creating Paystack recipient:", error);
    throw error;
  }
}

// Create or update vendor payment method
vendorPaymentRoute.post(
  "/payment-methods",
  zValidator("json", paymentMethodSchema),
  async (c) => {
    try {
      const paymentMethodData = c.req.valid("json");
      const user = c.get("user");
      const shop = c.get("shop");

      // For bank transfers, create a Paystack recipient
      let paystackRecipientCode = null;
      if (
        paymentMethodData.type === "BANK_TRANSFER" &&
        paymentMethodData.accountNumber &&
        paymentMethodData.accountName &&
        paymentMethodData.bankCode
      ) {
        paystackRecipientCode = await createPaystackRecipient(c, {
          accountName: paymentMethodData.accountName,
          accountNumber: paymentMethodData.accountNumber,
          bankCode: paymentMethodData.bankCode,
        });
      }

      // If this method is set as default, unset any existing defaults
      if (paymentMethodData.isDefault) {
        await db
          .update(shopPaymentMethodTable)
          .set({ isDefault: false })
          .where(eq(shopPaymentMethodTable.shopId, shop.id));
      }

      // Create new payment method entry
      const paymentMethod = await db
        .insert(shopPaymentMethodTable)
        .values({
          id: nanoid(),
          shopId: shop.id,
          name: paymentMethodData.name,
          type: paymentMethodData.type,
          accountNumber: paymentMethodData.accountNumber,
          accountName: paymentMethodData.accountName,
          bankName: paymentMethodData.bankName,
          isDefault: paymentMethodData.isDefault || false,
          instructions: paymentMethodData.instructions,
          additionalDetails: JSON.stringify({
            bankCode: paymentMethodData.bankCode,
            paystackRecipientCode: paystackRecipientCode,
          }),
        })
        .returning()
        .get();

      return c.json({
        success: true,
        data: paymentMethod,
      });
    } catch (error) {
      console.error("Error creating payment method:", error);
      return c.json(
        {
          success: false,
          message: "Failed to create payment method",
        },
        500
      );
    }
  }
);

// Get vendor payment methods
vendorPaymentRoute.get("/payment-methods", async (c) => {
  try {
    const shop = c.get("shop");

    const paymentMethods = await db.query.shopPaymentMethodTable.findMany({
      where: eq(shopPaymentMethodTable.shopId, shop.id),
    });

    return c.json({
      success: true,
      data: paymentMethods,
    });
  } catch (error) {
    console.error("Error fetching payment methods:", error);
    return c.json(
      {
        success: false,
        message: "Failed to fetch payment methods",
      },
      500
    );
  }
});

// Get vendor wallet balance
vendorPaymentRoute.get("/wallet", async (c) => {
  try {
    const user = c.get("user");
    const { VendorPaymentService } = await import(
      "../services/vendorPayment.service"
    );
    const vendorPaymentService = new VendorPaymentService();

    const walletData = await vendorPaymentService.getVendorWalletBalance(
      user.id,
      c.get("db")
    );

    return c.json({
      success: true,
      data: walletData,
    });
  } catch (error) {
    console.error("Error fetching wallet balance:", error);
    return c.json(
      {
        success: false,
        message: "Failed to fetch wallet balance",
      },
      500
    );
  }
});

// Get vendor transaction history
vendorPaymentRoute.get("/transactions", async (c) => {
  try {
    const user = c.get("user");
    const limit = parseInt(c.req.query("limit") || "50");
    const { VendorPaymentService } = await import(
      "../services/vendorPayment.service"
    );
    const vendorPaymentService = new VendorPaymentService();

    const transactions = await vendorPaymentService.getVendorTransactionHistory(
      user.id,
      c.get("db"),
      limit
    );

    return c.json({
      success: true,
      data: transactions,
    });
  } catch (error) {
    console.error("Error fetching transaction history:", error);
    return c.json(
      {
        success: false,
        message: "Failed to fetch transaction history",
      },
      500
    );
  }
});

export default vendorPaymentRoute;
