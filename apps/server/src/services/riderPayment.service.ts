import { eq, and, sql } from "drizzle-orm";
import { orderTable } from "../lib/db/schema/order.schema";
import { riderTable } from "../lib/db/schema/rider.schema";
import { riderTransactionTable } from "../lib/db/schema/payment.schema";
import { nanoid } from "nanoid";
import type { Variables } from "../lib/types";

export class RiderPaymentService {
  private getRiderCommissionRate(): number {
    // Default to 0.7 (70%) if environment variable is not set
    return parseFloat(process.env.RIDER_COMMISSION_RATE || "0.7");
  }

  private calculateRiderEarnings(deliveryFee: number): number {
    const commissionRate = this.getRiderCommissionRate();
    return deliveryFee * commissionRate;
  }

  private calculatePlatformFee(deliveryFee: number): number {
    const commissionRate = this.getRiderCommissionRate();
    return deliveryFee * (1 - commissionRate);
  }
  async processDeliveryPayment(
    orderId: string,
    db: Variables["db"]
  ): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    try {
      const order = await db.query.orderTable.findFirst({
        where: eq(orderTable.id, orderId),
        with: {
          rider: true,
        },
      });

      if (!order) {
        return { success: false, error: "Order not found" };
      }

      if (!order.riderId) {
        return { success: false, error: "No rider assigned to this order" };
      }

      if (!order.rider) {
        return { success: false, error: "Rider details not found" };
      }
      const riderEarnings = this.calculateRiderEarnings(order.deliveryFee);
      const platformFee = this.calculatePlatformFee(order.deliveryFee);

      const transactionId = nanoid();
      await db.insert(riderTransactionTable).values({
        riderId: order.riderId,
        orderId: orderId,
        deliveryFee: Math.round(order.deliveryFee * 100), // Store in cents
        distanceBonus: 0,
        peakTimeBonus: 0,
        tipAmount: 0,
        platformFee: Math.round(platformFee * 100), // Platform fee in cents
        netAmount: Math.round(riderEarnings * 100),
        amount: Math.round(riderEarnings * 100), // Legacy field
        currency: "NGN",
        status: "COMPLETED",
        type: "CREDIT",
        reference: `delivery-payout-${orderId}`,
        description: `Delivery earnings for order ${orderId} (${Math.round(this.getRiderCommissionRate() * 100)}% of delivery fee)`,
        metadata: JSON.stringify({
          deliveryFee: order.deliveryFee,
          platformFeeRate: Math.round(
            (1 - this.getRiderCommissionRate()) * 100
          ),
          netAmount: riderEarnings,
          processedAt: new Date().toISOString(),
          trigger: "delivery",
        }),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      console.log(
        `✅ Rider earnings processed: ₦${riderEarnings} for rider ${order.riderId} on order ${orderId}`
      );
      return { success: true, transactionId };
    } catch (error) {
      console.error("Error processing rider delivery payment:", error);
      return { success: false, error: "Failed to process rider payment" };
    }
  }

  async getRiderWalletBalance(
    riderUserId: string,
    db: Variables["db"]
  ): Promise<{
    balance: number;
    totalEarnings: number;
    totalWithdrawals: number;
    pendingAmount: number;
  }> {
    try {
      const earningsResult = await db
        .select({
          total: sql`SUM(${riderTransactionTable.netAmount})`.mapWith(Number),
        })
        .from(riderTransactionTable)
        .where(
          and(
            eq(riderTransactionTable.riderId, riderUserId),
            eq(riderTransactionTable.type, "CREDIT"),
            eq(riderTransactionTable.status, "COMPLETED")
          )
        )
        .get();

      const withdrawalsResult = await db
        .select({
          total: sql`SUM(${riderTransactionTable.netAmount})`.mapWith(Number),
        })
        .from(riderTransactionTable)
        .where(
          and(
            eq(riderTransactionTable.riderId, riderUserId),
            eq(riderTransactionTable.type, "DEBIT"),
            eq(riderTransactionTable.status, "COMPLETED")
          )
        )
        .get();

      const pendingResult = await db
        .select({
          total: sql`SUM(${riderTransactionTable.netAmount})`.mapWith(Number),
        })
        .from(riderTransactionTable)
        .where(
          and(
            eq(riderTransactionTable.riderId, riderUserId),
            eq(riderTransactionTable.type, "CREDIT"),
            eq(riderTransactionTable.status, "PENDING")
          )
        )
        .get();
      const totalEarnings = (earningsResult?.total || 0) / 100; // Convert from cents
      const totalWithdrawals = (withdrawalsResult?.total || 0) / 100;
      const pendingAmount = (pendingResult?.total || 0) / 100;
      const balance = totalEarnings - totalWithdrawals;

      return {
        balance,
        totalEarnings,
        totalWithdrawals,
        pendingAmount,
      };
    } catch (error) {
      console.error("Error fetching rider wallet balance:", error);
      return {
        balance: 0,
        totalEarnings: 0,
        totalWithdrawals: 0,
        pendingAmount: 0,
      };
    }
  }
  async getRiderTransactionHistory(
    riderUserId: string,
    db: Variables["db"],
    limit: number = 50
  ): Promise<any[]> {
    try {
      const transactions = await db.query.riderTransactionTable.findMany({
        where: eq(riderTransactionTable.riderId, riderUserId),
        orderBy: (transactions, { desc }) => [desc(transactions.createdAt)],
        limit: limit,
      });

      return transactions.map((transaction) => ({
        id: transaction.id,
        amount: transaction.amount / 100, // Convert from cents (legacy field)
        // Amount breakdown
        deliveryFee: transaction.deliveryFee / 100,
        distanceBonus: transaction.distanceBonus / 100,
        peakTimeBonus: transaction.peakTimeBonus / 100,
        tipAmount: transaction.tipAmount / 100,
        platformFee: transaction.platformFee / 100,
        netAmount: transaction.netAmount / 100,
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
      console.error("Error fetching rider transaction history:", error);
      return [];
    }
  }
}
