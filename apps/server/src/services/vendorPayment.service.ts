import { eq, and, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { Variables } from "../lib/types";
import { orderTable } from "../lib/db/schema/order.schema";
import { transactionTable } from "../lib/db/schema/payment.schema";
import { shopTable, member } from "../lib/db/schema/shop.schema";

export class VendorPaymentService {
  async processPickupPayment(
    orderId: string,
    db: Variables["db"]
  ): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    try {
      // Get order details with shop and vendor user information
      const order = await db.query.orderTable.findFirst({
        where: eq(orderTable.id, orderId),
        with: {
          shop: {
            with: {
              members: {
                with: {
                  user: true,
                },
                where: eq(member.role, "OWNER"), // Get the shop owner
              },
            },
          },
        },
      });

      if (!order) {
        return { success: false, error: "Order not found" };
      }

      if (order.status !== "IN_TRANSIT") {
        return { success: false, error: "Order must be in IN_TRANSIT status" };
      }

      // Find the shop owner
      const shopOwner = order.shop?.members?.find(
        (m) => m.role === "OWNER"
      )?.user;

      if (!shopOwner?.id) {
        return { success: false, error: "Shop owner not found" };
      }

      // Get shop commission rate (default to 10% if not set)
      const commissionRate = order.shop?.commission || 10;

      // Calculate vendor payout amount using shop-specific commission
      const payoutAmount = this.calculateVendorPayout(
        order.subtotal,
        order.deliveryFee,
        commissionRate
      );

      // Create transaction record for vendor payment
      const transactionId = nanoid();
      await db.insert(transactionTable).values({
        id: transactionId,
        userId: shopOwner.id,
        orderId: orderId,
        amount: Math.round(payoutAmount * 100), // Store in cents
        currency: "NGN",
        status: "COMPLETED",
        type: "CREDIT",
        reference: `pickup-payout-${orderId}`,
        description: `Vendor payout for order #${orderId.slice(-6)} (pickup)`,
        metadata: JSON.stringify({
          orderTotal: order.subtotal,
          deliveryFee: order.deliveryFee,
          commissionRate: commissionRate,
          platformCommission: this.calculatePlatformCommission(
            order.subtotal,
            commissionRate
          ),
          payoutAmount: payoutAmount,
          processedAt: new Date().toISOString(),
          trigger: "pickup",
        }),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      console.log(`✅ Vendor payment processed for order ${orderId}:`, {
        vendorId: shopOwner.id,
        orderTotal: order.subtotal,
        commissionRate: `${commissionRate}%`,
        payoutAmount: payoutAmount,
        transactionId: transactionId,
      });

      return { success: true, transactionId };
    } catch (error) {
      console.error("Error processing vendor pickup payment:", error);
      return { success: false, error: "Failed to process payment" };
    }
  }

  private calculateVendorPayout(
    subtotal: number,
    deliveryFee: number,
    commissionRate: number
  ): number {
    // Vendor gets: subtotal - platform commission
    // Note: Delivery fee goes to the platform and rider, not the vendor
    const platformCommission = this.calculatePlatformCommission(
      subtotal,
      commissionRate
    );
    return subtotal - platformCommission;
  }

  private calculatePlatformCommission(
    subtotal: number,
    commissionRate: number
  ): number {
    return (subtotal * commissionRate) / 100;
  }

  async getVendorWalletBalance(
    vendorUserId: string,
    db: Variables["db"]
  ): Promise<{
    balance: number;
    totalEarnings: number;
    totalWithdrawals: number;
    pendingAmount: number;
  }> {
    try {
      // Calculate total earnings from completed transactions
      const totalEarningsResult = await db
        .select({
          total: sql`SUM(${transactionTable.amount})`.mapWith(Number),
        })
        .from(transactionTable)
        .where(
          and(
            eq(transactionTable.userId, vendorUserId),
            eq(transactionTable.type, "CREDIT"),
            eq(transactionTable.status, "COMPLETED")
          )
        )
        .get();

      // Calculate pending earnings
      const pendingAmountResult = await db
        .select({
          total: sql`SUM(${transactionTable.amount})`.mapWith(Number),
        })
        .from(transactionTable)
        .where(
          and(
            eq(transactionTable.userId, vendorUserId),
            eq(transactionTable.type, "CREDIT"),
            eq(transactionTable.status, "PENDING")
          )
        )
        .get();

      // Calculate total withdrawals
      const withdrawalsResult = await db
        .select({
          total: sql`SUM(${transactionTable.amount})`.mapWith(Number),
        })
        .from(transactionTable)
        .where(
          and(
            eq(transactionTable.userId, vendorUserId),
            eq(transactionTable.type, "DEBIT"),
            eq(transactionTable.status, "COMPLETED")
          )
        )
        .get();

      const totalEarnings = (totalEarningsResult?.total || 0) / 100; // Convert from cents
      const totalWithdrawals = (withdrawalsResult?.total || 0) / 100;
      const pendingAmount = (pendingAmountResult?.total || 0) / 100;
      const balance = totalEarnings - totalWithdrawals;

      return {
        balance,
        totalEarnings,
        totalWithdrawals,
        pendingAmount,
      };
    } catch (error) {
      console.error("Error calculating vendor wallet balance:", error);
      return {
        balance: 0,
        totalEarnings: 0,
        totalWithdrawals: 0,
        pendingAmount: 0,
      };
    }
  }

  async getVendorTransactionHistory(
    vendorUserId: string,
    db: Variables["db"],
    limit: number = 50
  ): Promise<any[]> {
    try {
      const transactions = await db.query.transactionTable.findMany({
        where: eq(transactionTable.userId, vendorUserId),
        orderBy: (transactions, { desc }) => [desc(transactions.createdAt)],
        limit: limit,
        with: {
          order: {
            columns: {
              id: true,
            },
          },
        },
      });

      return transactions.map((transaction) => ({
        id: transaction.id,
        amount: transaction.amount / 100, // Convert from cents
        currency: transaction.currency,
        type: transaction.type,
        status: transaction.status,
        description: transaction.description,
        reference: transaction.reference,
        orderId: transaction.orderId,
        createdAt: transaction.createdAt,
        metadata: transaction.metadata,
      }));
    } catch (error) {
      console.error("Error fetching vendor transaction history:", error);
      return [];
    }
  }
}
