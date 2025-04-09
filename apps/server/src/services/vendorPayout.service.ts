import { db } from "../lib/db";
import { eq, and, gte, lt, sql } from "drizzle-orm";
import { shopPaymentMethodTable } from "../lib/db/schema/shop.schema";
import { transactionTable } from "../lib/db/schema/payment.schema";
import { nanoid } from "nanoid";

type PaystackEnv = {
  PAYSTACK_SECRET_KEY: string;
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
    );

    // 1. Find all vendors with bank account information
    const vendorsWithBankInfo = await db.query.shopPaymentMethodTable.findMany({
      where: and(
        eq(shopPaymentMethodTable.type, "BANK_TRANSFER"),
        sql`${shopPaymentMethodTable.additionalDetails} LIKE '%paystackRecipientCode%'`
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
        // Parse additionalDetails to get the recipient code
        const additionalDetails = JSON.parse(
          vendorPaymentMethod.additionalDetails || "{}"
        );
        const recipientCode = additionalDetails.paystackRecipientCode;

        if (!recipientCode) {
          console.warn(
            `Vendor ${vendorPaymentMethod.shopId} has no recipient code. Skipping.`
          );
          continue;
        }

        // Calculate total pending earnings for the vendor
        const vendorEarnings = await db
          .select({
            total: sql`SUM(${transactionTable.amount})`.mapWith(Number),
          })
          .from(transactionTable)
          .where(
            and(
              eq(transactionTable.status, "PENDING"),
              eq(transactionTable.type, "CREDIT"),
              gte(transactionTable.createdAt, startDate.toISOString()),
              lt(transactionTable.createdAt, endDate.toISOString()),
              // Find the user ID associated with this shop
              // We get this from the payment method, which is linked to the shop
              sql`${transactionTable.userId} IN (
              SELECT u.id FROM user_table u
              JOIN shop s ON s.user_id = u.id
              WHERE s.id = ${vendorPaymentMethod.shopId}
            )`
            )
          )
          .get();

        const amount = vendorEarnings.total || 0;

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

        const data = await response.json();

        if (data.status) {
          console.log(`Batch ${i + 1} processed successfully: ${data.message}`);

          // Update transaction status for each successful transfer
          for (const transfer of data.data) {
            try {
              // Extract the reference from the transfer
              const reference = transfer.reference;

              // Get the amount in database units (NGN not kobo)
              const amount = transfer.amount / 100;

              // Start a transaction to keep operations atomic
              await db.transaction(async (tx) => {
                // 1. Mark pending transactions as completed
                await tx
                  .update(transactionTable)
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
                      eq(transactionTable.status, "PENDING"),
                      eq(transactionTable.type, "CREDIT"),
                      // Find transactions for the shop associated with this recipient
                      sql`${transactionTable.userId} IN (
                        SELECT u.id FROM user_table u
                        JOIN shop s ON s.user_id = u.id
                        JOIN "shopPaymentMethod" pm ON pm.shop_id = s.id
                        WHERE pm.additional_details LIKE '%${transfer.recipient}%'
                      )`
                    )
                  );

                // 2. Create a withdrawal transaction record
                await tx.insert(transactionTable).values({
                  id: nanoid(),
                  userId: sql`(
                    SELECT u.id FROM user_table u
                    JOIN shop s ON s.user_id = u.id
                    JOIN "shopPaymentMethod" pm ON pm.shop_id = s.id
                    WHERE pm.additional_details LIKE '%${transfer.recipient}%'
                    LIMIT 1
                  )`,
                  amount: amount,
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
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                });
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
