import { eq, and, gte, lt, sql } from "drizzle-orm";
import { shopPaymentMethodTable } from "../lib/db/schema/shop.schema";
import { vendorTransactionTable } from "../lib/db/schema/payment.schema";
import { nanoid } from "nanoid";
import { createClient } from "../lib/db";

type PaystackEnv = {
  PAYSTACK_SECRET_KEY: string;
  DB: D1Database;
  RIDER_COMMISSION_RATE: string;
};

/**
 * Weekly payout processor for vendor payments
 *
 * This scheduled function runs weekly to process payments to vendors.
 * It identifies eligible vendors (those with bank details), calculates their
 * earnings, and uses Paystack's bulk transfer API to send payments.
 */
export async function processVendorPayouts(env: PaystackEnv) {
  console.log("Starting vendor payouts processing...");

  try {
    const db = createClient(env.DB);

    // Get the date range for this payout period
    // Process transactions from the previous week (Sunday to Saturday)
    const now = new Date();

    // Start date: last Sunday at 00:00:00
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - now.getDay() - 7);
    startDate.setHours(0, 0, 0, 0);

    // End date: last Saturday at 23:59:59
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);

    console.log(
      `Processing payouts for period: ${startDate.toISOString()} to ${endDate.toISOString()}`
    ); // 1. Find all vendors with bank account information
    const vendorsWithBankInfo = await db.query.shopPaymentMethodTable.findMany({
      where: and(
        eq(shopPaymentMethodTable.type, "BANK_TRANSFER"),
        sql`${shopPaymentMethodTable.paystackRecipientCode} IS NOT NULL`
      ),
    });

    if (!vendorsWithBankInfo.length) {
      console.log("No vendors with bank information found. Exiting.");
      return { success: true, message: "No vendors to process" };
    }

    console.log(
      `Found ${vendorsWithBankInfo.length} vendors with bank information`
    );

    // Process in batches of 100 as per Paystack's recommendation
    const BATCH_SIZE = 100;
    const batches = [];

    // 2. For each vendor, calculate earnings for the period
    // We'll collect all the transfers to be made
    const transfers = [];
    for (const vendorPaymentMethod of vendorsWithBankInfo) {
      try {
        // Get the recipient code directly from the field
        const recipientCode = vendorPaymentMethod.paystackRecipientCode;

        if (!recipientCode) {
          console.warn(
            `Vendor ${vendorPaymentMethod.shopId} has no recipient code. Skipping.`
          );
          continue;
        } // Calculate total pending earnings for the vendor
        const vendorEarnings = await db
          .select({
            total: sql`SUM(${vendorTransactionTable.netAmount})`.mapWith(
              Number
            ),
          })
          .from(vendorTransactionTable)
          .where(
            and(
              eq(vendorTransactionTable.shopId, vendorPaymentMethod.shopId),
              eq(vendorTransactionTable.status, "PENDING"),
              eq(vendorTransactionTable.type, "CREDIT"),
              gte(vendorTransactionTable.createdAt, startDate),
              lt(vendorTransactionTable.createdAt, endDate)
            )
          )
          .get();
        const amount = (vendorEarnings?.total || 0) / 100; // Convert from cents to NGN

        // Skip if no earnings to process
        if (amount <= 0) {
          console.log(
            `No pending earnings for vendor ${vendorPaymentMethod.shopId}. Skipping.`
          );
          continue;
        }

        // Amount needs to be in kobo (smallest currency unit in Nigeria)
        const amountInKobo = Math.round(amount * 100);

        // Generate a unique reference for this transfer
        const reference = `payout-${nanoid(16)}`;

        // Add to transfers array
        transfers.push({
          amount: amountInKobo,
          recipient: recipientCode,
          reference,
          reason: `Weekly payout for period ending ${endDate.toLocaleDateString()}`,
        });

        console.log(
          `Queued payout of ${amount} NGN to vendor ${vendorPaymentMethod.shopId}`
        );
      } catch (error) {
        console.error(
          `Error processing vendor ${vendorPaymentMethod.shopId}:`,
          error
        );
        // Continue processing other vendors
      }
    }

    // If no eligible transfers, exit
    if (!transfers.length) {
      console.log("No eligible transfers to process. Exiting.");
      return { success: true, message: "No eligible transfers" };
    }

    // 3. Create batches of transfers (max 100 per batch)
    for (let i = 0; i < transfers.length; i += BATCH_SIZE) {
      batches.push(transfers.slice(i, i + BATCH_SIZE));
    }

    console.log(`Created ${batches.length} batches of transfers`);

    // 4. Process each batch with 5-second delay between batches
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];

      console.log(
        `Processing batch ${i + 1} of ${batches.length} with ${batch.length} transfers`
      );
      try {
        // Make Paystack bulk transfer API call
        const response = await fetch("https://api.paystack.co/transfer/bulk", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            currency: "NGN",
            source: "balance",
            transfers: batch,
          }),
        });

        const data = (await response.json()) as {
          status: boolean;
          message: string;
          data: Array<{
            amount: number;
            recipient: string;
            reference: string;
            transfer_code: string;
          }>;
        };

        if (data.status) {
          console.log(`Batch ${i + 1} processed successfully: ${data.message}`); // Update transaction status for each successful transfer
          for (const transfer of data.data) {
            try {
              // Extract the reference from the transfer
              const reference = transfer.reference;

              // Get the amount in database units (NGN not kobo)
              const amount = transfer.amount / 100;

              // First, get the shop ID safely to avoid SQL injection
              const shopInfo = await db
                .select({ shopId: shopPaymentMethodTable.shopId })
                .from(shopPaymentMethodTable)
                .where(
                  eq(
                    shopPaymentMethodTable.paystackRecipientCode,
                    transfer.recipient
                  )
                )
                .get();

              if (!shopInfo) {
                console.error(
                  `No shop found for recipient code: ${transfer.recipient}`
                );
                continue;
              } // Execute operations separately since D1 batch doesn't work with Drizzle prepared statements
              // Update existing transactions
              await db
                .update(vendorTransactionTable)
                .set({
                  status: "COMPLETED",
                  reference: transfer.transfer_code,
                  metadata: JSON.stringify({
                    transferCode: transfer.transfer_code,
                    processedAt: new Date().toISOString(),
                  }),
                })
                .where(
                  and(
                    eq(vendorTransactionTable.shopId, shopInfo.shopId),
                    eq(vendorTransactionTable.status, "PENDING"),
                    eq(vendorTransactionTable.type, "CREDIT"),
                    gte(vendorTransactionTable.createdAt, startDate),
                    lt(vendorTransactionTable.createdAt, endDate)
                  )
                );

              // Insert withdrawal record
              await db.insert(vendorTransactionTable).values({
                shopId: shopInfo.shopId,
                grossAmount: Math.round(amount * 100),
                commissionRate: 0,
                commissionAmount: 0,
                netAmount: Math.round(amount * 100),
                amount: Math.round(amount * 100),
                currency: "NGN",
                status: "COMPLETED",
                type: "DEBIT",
                reference: transfer.transfer_code,
                description: `Weekly payout for period ending ${endDate.toLocaleDateString()}`,
                metadata: JSON.stringify({
                  transferCode: transfer.transfer_code,
                  recipientCode: transfer.recipient,
                  batchId: i + 1,
                  processedAt: new Date().toISOString(),
                }),
              });

              console.log(
                `Updated transaction records for transfer ${reference}`
              );
            } catch (error) {
              console.error(
                `Error updating transaction records for transfer:`,
                error
              );
            }
          }
        } else {
          console.error(`Batch ${i + 1} processing failed:`, data.message);
        }
      } catch (error) {
        console.error(`Error processing batch ${i + 1}:`, error);
      }

      // Wait 5 seconds between batches as recommended by Paystack
      if (i < batches.length - 1) {
        console.log("Waiting 5 seconds before processing next batch...");
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }

    console.log("Vendor payouts processing completed successfully");
    return { success: true, message: "Payouts processed successfully" };
  } catch (error) {
    console.error("Error processing vendor payouts:", error);
    return { success: false, message: "Failed to process payouts", error };
  }
}
