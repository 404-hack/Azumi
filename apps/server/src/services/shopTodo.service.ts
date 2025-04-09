import {
  shopTable,
  shopOperatingHoursTable,
  shopAgreementsTable,
  shopPaymentMethodTable,
} from "../lib/db/schema/shop.schema";
import { menuItemTable } from "../lib/db/schema/menu.schema";
import { paymentMethodTable } from "../lib/db/schema/payment.schema";
import { eq, and } from "drizzle-orm";
import { Variables } from "../lib/types";

export class ShopTodoService {
  /**
   * Get computed todo items for a shop
   */
  async getComputedTodos(shopId: string, db: Variables["db"]) {
    // Get the shop data for checking information completeness
    const shop = await db.query.shopTable.findFirst({
      where: eq(shopTable.id, shopId),
    });

    if (!shop) {
      return null;
    }

    // Use batch to efficiently check all required entities
    const [
      menuItemsResult,
      operatingHoursResult,
      paymentMethodResult,
      agreementsResult,
    ] = await Promise.all([
      // Check menu items
      db.query.menuItemTable.findFirst({
        where: eq(menuItemTable.shopId, shopId),
        columns: { id: true },
      }),

      //   Check operating hours
      db.query.shopOperatingHoursTable.findFirst({
        where: eq(shopOperatingHoursTable.shopId, shopId),
        columns: { id: true },
      }),

      // Check payment methods
      db.query.shopPaymentMethodTable.findFirst({
        where: eq(shopPaymentMethodTable.shopId, shopId),
        columns: { id: true },
      }),

      // Check agreements
      db.query.shopAgreementsTable.findFirst({
        where: and(
          eq(shopAgreementsTable.shopId, shopId),
          eq(shopAgreementsTable.agreementType, "VENDOR_TERMS")
        ),
        columns: { id: true },
      }),
    ]);

    // Transform results into boolean flags
    const hasMenuItems = !!menuItemsResult;
    const hasOperatingHours = !!operatingHoursResult;
    const hasPaymentMethod = !!paymentMethodResult;
    const hasAgreements = !!agreementsResult;

    // Check if store information is complete
    const storeInformationComplete = !!(
      shop.name &&
      shop.email &&
      shop.phoneNumber &&
      shop.address &&
      shop.description
    );

    // Create todo object with computed values
    const todoData = {
      id: `todo-${shopId}`, // Virtual ID to maintain compatibility
      shopId: shopId,
      storeInformationComplete,
      uploadAtLeastOneMenu: hasMenuItems,
      setUpOperatingHours: hasOperatingHours,
      setUpPaymentMethod: hasPaymentMethod,
      reviewTermsAndConditions: hasAgreements,
      //   Add timestamp fields for API compatibility
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Calculate profile completion percentage
    const todoItems = [
      storeInformationComplete,
      hasMenuItems,
      hasOperatingHours,
      hasPaymentMethod,
      hasAgreements,
    ];

    const completedItems = todoItems.filter(Boolean).length;
    const profileCompletion = Math.round(
      (completedItems / todoItems.length) * 100
    );

    return {
      todo: todoData,
      profileCompletion,
    };
  }

  /**
   * Check if a specific todo item is completed
   */
  async isTodoItemCompleted(
    shopId: string,
    todoType: "menu" | "hours" | "payment" | "terms" | "info",
    db: Variables["db"]
  ) {
    switch (todoType) {
      case "menu":
        return !!(await db.query.menuItemTable.findFirst({
          where: eq(menuItemTable.shopId, shopId),
          columns: { id: true },
        }));

      case "hours":
        return !!(await db.query.shopOperatingHoursTable.findFirst({
          where: eq(shopOperatingHoursTable.shopId, shopId),
          columns: { id: true },
        }));

      case "payment":
        return !!(await db.query.shopPaymentMethodTable.findFirst({
          where: eq(shopPaymentMethodTable.shopId, shopId),
          columns: { id: true },
        }));

      case "terms":
        return !!(await db.query.shopAgreementsTable.findFirst({
          where: and(
            eq(shopAgreementsTable.shopId, shopId),
            eq(shopAgreementsTable.agreementType, "TERMS_OF_SERVICE")
          ),
          columns: { id: true },
        }));

      case "info":
        const shop = await db.query.shopTable.findFirst({
          where: eq(shopTable.id, shopId),
          columns: {
            name: true,
            email: true,
            phoneNumber: true,
            address: true,
            description: true,
          },
        });

        return !!(
          shop &&
          shop.name &&
          shop.email &&
          shop.phoneNumber &&
          shop.address &&
          shop.description
        );

      default:
        return false;
    }
  }
}
