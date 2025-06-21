import { eq, and, sql } from "drizzle-orm";
import { orderTable } from "../lib/db/schema/order.schema";
import { riderTable } from "../lib/db/schema/rider.schema";
import { riderTransactionTable } from "../lib/db/schema/payment.schema";
import { nanoid } from "nanoid";
import { calculateDistance } from "../lib/utils/geo";
import type { Variables } from "../lib/types";

export class RiderPaymentService {
  private calculateRiderEarnings(
    shopLat: number,
    shopLng: number,
    customerLat: number,
    customerLng: number
  ): number {
    const distance = calculateDistance(
      shopLat,
      shopLng,
      customerLat,
      customerLng
    );

    if (distance <= 1) {
      return 350;
    } else {
      const additionalKm = Math.ceil(distance - 1);
      return 350 + additionalKm * 150;
    }
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
          shop: {
            columns: {
              latitude: true,
              longitude: true,
            },
          },
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

      if (!order.shop || !order.shop.latitude || !order.shop.longitude) {
        return { success: false, error: "Shop coordinates not found" };
      }

      const riderEarnings = this.calculateRiderEarnings(
        order.shop.latitude,
        order.shop.longitude,
        order.latitude,
        order.longitude
      );

      const transactionId = nanoid();
      await db.insert(riderTransactionTable).values({
        riderId: order.riderId,
        orderId: orderId,
        deliveryFee: Math.round((order.deliveryFee || 0) * 100),
        distanceBonus: 0,
        peakTimeBonus: 0,
        tipAmount: 0,
        platformFee: 0,
        netAmount: Math.round(riderEarnings * 100),
        amount: Math.round(riderEarnings * 100),
        currency: "NGN",
        status: "COMPLETED",
        type: "CREDIT",
        reference: `delivery-payout-${orderId}`,
        description: `Distance-based delivery earnings for order ${orderId} (₦${riderEarnings})`,
        metadata: JSON.stringify({
          deliveryFee: order.deliveryFee || 0,
          riderEarnings: riderEarnings,
          processedAt: new Date().toISOString(),
          trigger: "delivery",
          paymentMethod: "distance-based",
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
        amount: transaction.amount / 100,
        deliveryFee: transaction.deliveryFee / 100,
        distanceBonus: (transaction.distanceBonus || 0) / 100,
        peakTimeBonus: (transaction.peakTimeBonus || 0) / 100,
        tipAmount: (transaction.tipAmount || 0) / 100,
        platformFee: (transaction.platformFee || 0) / 100,
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
