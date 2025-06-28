import { eq, and, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { Variables } from "../lib/types";
import { orderTable } from "../lib/db/schema/order.schema";
import { vendorTransactionTable } from "../lib/db/schema/payment.schema";
import { shopTable, member } from "../lib/db/schema/shop.schema";

export class VendorPaymentService {
  async processPickupPayment(
    orderId: string,
    db: Variables["db"]
  ): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    try {
      console.log(
        `[VENDOR_PAYMENT] Processing pickup payment for order: ${orderId}`
      );

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
                // No role filter here, we'll get all members and filter in JS
              },
            },
          },
        },
      });

      console.log(`[VENDOR_PAYMENT] Order query result:`, {
        found: !!order,
        orderId: order?.id,
        status: order?.status,
        subtotal: order?.subtotal,
        deliveryFee: order?.deliveryFee,
        shopId: order?.shop?.id,
        shopName: order?.shop?.name,
        shopMembersCount: order?.shop?.members?.length || 0,
      });

      if (!order) {
        console.log(`[VENDOR_PAYMENT] Order not found: ${orderId}`);
        return { success: false, error: "Order not found" };
      }

      if (order.status !== "IN_TRANSIT") {
        console.log(
          `[VENDOR_PAYMENT] Order status validation failed. Expected: IN_TRANSIT, Actual: ${order.status}`
        );
        return { success: false, error: "Order must be in IN_TRANSIT status" };
      } // Log all shop members for debugging
      console.log(`[VENDOR_PAYMENT] Shop members:`, {
        shopId: order.shop?.id,
        shopName: order.shop?.name,
        membersCount: order.shop?.members?.length || 0,
        membersFound:
          order.shop?.members?.map((m) => ({
            role: m.role,
            userId: m.user?.id,
            email: m.user?.email,
          })) || [],
      });

      // We'll make the system more robust by not requiring a shop owner
      // Just check if the shop exists
      if (!order.shop?.id) {
        console.log(`[VENDOR_PAYMENT] Shop not found for order: ${orderId}`);
        return { success: false, error: "Shop not found" };
      }

      // Get shop commission rate (default to 10% if not set)
      const commissionRate = order.shop?.commission || 10;

      // Calculate vendor payout amount using shop-specific commission
      const payoutAmount = this.calculateVendorPayout(
        order.subtotal,
        order.deliveryFee,
        commissionRate
      );

      console.log(`[VENDOR_PAYMENT] Payout calculation:`, {
        subtotal: order.subtotal,
        deliveryFee: order.deliveryFee,
        commissionRate: `${commissionRate}%`,
        payoutAmount: payoutAmount,
        payoutAmountCents: Math.round(payoutAmount * 100),
      }); // Create transaction record for vendor payment
      const transactionId = nanoid();
      console.log(`[VENDOR_PAYMENT] Creating transaction record:`, {
        transactionId,
        shopId: order.shop.id,
        orderId,
        amountCents: Math.round(payoutAmount * 100),
        currency: "NGN",
        status: "COMPLETED",
        type: "CREDIT",
      }); // Calculate amounts for breakdown
      const grossAmountCents = Math.round(order.subtotal * 100); // Full order amount in cents
      const commissionAmountCents = Math.round(
        this.calculatePlatformCommission(order.subtotal, commissionRate) * 100
      );
      const netAmountCents = Math.round(payoutAmount * 100); // Final payout amount in cents
      const deliveryFeeCents = Math.round((order.deliveryFee || 0) * 100);

      console.log(`[VENDOR_PAYMENT] Amount breakdown:`, {
        grossAmount: order.subtotal,
        commissionRate: `${commissionRate}%`,
        commissionAmount: commissionAmountCents / 100,
        netAmount: payoutAmount,
        deliveryFee: order.deliveryFee || 0,
      });
      const [newTransaction] = await db
        .insert(vendorTransactionTable)
        .values({
          shopId: order.shop.id,
          orderId: orderId,
          // Amount breakdown for transparency
          grossAmount: grossAmountCents,
          commissionRate: commissionRate,
          commissionAmount: commissionAmountCents,
          netAmount: netAmountCents,
          // Legacy field for backward compatibility
          amount: netAmountCents,
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
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning({ id: vendorTransactionTable.id });

      console.log(`[VENDOR_PAYMENT] ✅ Transaction created successfully:`, {
        transactionId: newTransaction.id,
        shopId: order.shop.id,
        shopName: order.shop.name,
        orderTotal: order.subtotal,
        commissionRate: `${commissionRate}%`,
        payoutAmount: payoutAmount,
      });

      return { success: true, transactionId: newTransaction.id };
    } catch (error) {
      console.error(
        "[VENDOR_PAYMENT] Error processing vendor pickup payment:",
        error
      );
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
  async getShopWalletBalance(
    shopId: string,
    db: Variables["db"]
  ): Promise<{
    balance: number;
    totalEarnings: number;
    totalWithdrawals: number;
    pendingAmount: number;
  }> {
    try {
      // Calculate total earnings from completed transactions
      const [totalEarningsResult] = await db
        .select({
          total: sql`SUM(${vendorTransactionTable.netAmount})`.mapWith(Number),
        })
        .from(vendorTransactionTable)
        .where(
          and(
            eq(vendorTransactionTable.shopId, shopId),
            eq(vendorTransactionTable.type, "CREDIT"),
            eq(vendorTransactionTable.status, "COMPLETED")
          )
        );

      // Calculate pending earnings
      const [pendingAmountResult] = await db
        .select({
          total: sql`SUM(${vendorTransactionTable.netAmount})`.mapWith(Number),
        })
        .from(vendorTransactionTable)
        .where(
          and(
            eq(vendorTransactionTable.shopId, shopId),
            eq(vendorTransactionTable.type, "CREDIT"),
            eq(vendorTransactionTable.status, "PENDING")
          )
        );

      // Calculate total withdrawals
      const [withdrawalsResult] = await db
        .select({
          total: sql`SUM(${vendorTransactionTable.netAmount})`.mapWith(Number),
        })
        .from(vendorTransactionTable)
        .where(
          and(
            eq(vendorTransactionTable.shopId, shopId),
            eq(vendorTransactionTable.type, "DEBIT"),
            eq(vendorTransactionTable.status, "COMPLETED")
          )
        );

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
  async getShopTransactionHistory(
    shopId: string,
    db: Variables["db"],
    limit: number = 50
  ): Promise<any[]> {
    try {
      const transactions = await db.query.vendorTransactionTable.findMany({
        where: eq(vendorTransactionTable.shopId, shopId),
        orderBy: (transactions, { desc }) => [desc(transactions.createdAt)],
        limit: limit,
      });

      return transactions.map((transaction) => ({
        id: transaction.id,
        amount: transaction.amount / 100, // Convert from cents (legacy field)
        // Amount breakdown
        grossAmount: transaction.grossAmount / 100,
        commissionRate: transaction.commissionRate,
        commissionAmount: transaction.commissionAmount / 100,
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
      console.error("Error fetching shop transaction history:", error);
      return [];
    }
  }
  async getVendorTransactionHistory(
    vendorUserId: string,
    db: Variables["db"],
    limit: number = 50
  ): Promise<any[]> {
    try {
      // Find the shop associated with this user - no role filter
      const userShop = await db.query.member.findFirst({
        where: eq(member.userId, vendorUserId),
        with: {
          shop: true,
        },
      });

      if (!userShop?.shop?.id) {
        console.log(`[VENDOR_PAYMENT] No shop found for user: ${vendorUserId}`);
        return [];
      }

      return this.getShopTransactionHistory(userShop.shop.id, db, limit);
    } catch (error) {
      console.error("Error fetching vendor transaction history:", error);
      return [];
    }
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
      // Find the shop associated with this user - no role filter
      const userShop = await db.query.member.findFirst({
        where: eq(member.userId, vendorUserId),
        with: {
          shop: true,
        },
      });

      if (!userShop?.shop?.id) {
        console.log(`[VENDOR_PAYMENT] No shop found for user: ${vendorUserId}`);
        return {
          balance: 0,
          totalEarnings: 0,
          totalWithdrawals: 0,
          pendingAmount: 0,
        };
      }

      return this.getShopWalletBalance(userShop.shop.id, db);
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
}
