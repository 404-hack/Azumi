import { eq, and, sql } from "drizzle-orm";
import { orderTable } from "../lib/db/schema/order.schema";
import { riderTable } from "../lib/db/schema/rider.schema";
import { transactionTable } from "../lib/db/schema/payment.schema";
import { nanoid } from "nanoid";
import type { Variables } from "../lib/types";

export class RiderPaymentService {
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

      const transactionId = nanoid();

      await db.insert(transactionTable).values({
        id: transactionId,
        userId: order.rider.userId,
        orderId: orderId,
        amount: riderEarnings,
        type: "CREDIT",
        status: "PENDING",
        description: `Delivery earnings for order ${orderId} (70% of delivery fee)`,
        category: "DELIVERY_EARNINGS",
        paymentMethod: "WALLET",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
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

  private calculateRiderEarnings(deliveryFee: number): number {
    return Math.round(deliveryFee * 0.7);
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
          total: sql`SUM(${transactionTable.amount})`.mapWith(Number),
        })
        .from(transactionTable)
        .where(
          and(
            eq(transactionTable.userId, riderUserId),
            eq(transactionTable.type, "CREDIT"),
            eq(transactionTable.category, "DELIVERY_EARNINGS")
          )
        )
        .get();

      const withdrawalsResult = await db
        .select({
          total: sql`SUM(${transactionTable.amount})`.mapWith(Number),
        })
        .from(transactionTable)
        .where(
          and(
            eq(transactionTable.userId, riderUserId),
            eq(transactionTable.type, "DEBIT"),
            eq(transactionTable.category, "WITHDRAWAL")
          )
        )
        .get();

      const pendingResult = await db
        .select({
          total: sql`SUM(${transactionTable.amount})`.mapWith(Number),
        })
        .from(transactionTable)
        .where(
          and(
            eq(transactionTable.userId, riderUserId),
            eq(transactionTable.type, "CREDIT"),
            eq(transactionTable.status, "PENDING"),
            eq(transactionTable.category, "DELIVERY_EARNINGS")
          )
        )
        .get();

      const totalEarnings = earningsResult?.total || 0;
      const totalWithdrawals = withdrawalsResult?.total || 0;
      const pendingAmount = pendingResult?.total || 0;
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
      const transactions = await db
        .select()
        .from(transactionTable)
        .where(eq(transactionTable.userId, riderUserId))
        .orderBy(sql`${transactionTable.createdAt} DESC`)
        .limit(limit);

      return transactions;
    } catch (error) {
      console.error("Error fetching rider transaction history:", error);
      return [];
    }
  }
}
