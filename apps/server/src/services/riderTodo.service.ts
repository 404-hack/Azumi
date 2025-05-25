import { eq } from "drizzle-orm";
import {
  riderTable,
  riderPaymentMethodTable,
} from "../lib/db/schema/rider.schema";
import type { Variables } from "../lib/types";

export class RiderTodoService {
  /**
   * Get computed todo items for a rider
   */
  async getComputedTodos(riderId: string, db: Variables["db"]) {
    const rider = await db.query.riderTable.findFirst({
      where: eq(riderTable.userId, riderId),
      with: {
        paymentMethods: true, // Eager load payment methods
      },
    });

    if (!rider) {
      return null;
    }

    const personalInformationComplete = !!(
      rider.firstName &&
      rider.lastName &&
      rider.email &&
      rider.address &&
      rider.latitude &&
      rider.longitude
    );

    const vehicleInformationComplete = !!(
      rider.vehicleType && rider.vehicleLicense
    );

    // Use the eagerly loaded paymentMethods
    const paymentInformationComplete = !!(
      rider.paymentMethods && rider.paymentMethods.length > 0
    );

    const todoData = {
      id: `todo-${riderId}`,
      riderId: riderId,
      personalInformationComplete,
      vehicleInformationComplete,
      paymentInformationComplete,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const todoItems = [
      personalInformationComplete,
      vehicleInformationComplete,
      paymentInformationComplete,
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
    riderId: string,
    todoType: "personal" | "vehicle" | "payment",
    db: Variables["db"]
  ) {
    // For payment, we need paymentMethods, so fetch them regardless for now.
    // If performance becomes an issue for other types, this could be conditional.
    const rider = await db.query.riderTable.findFirst({
      where: eq(riderTable.id, riderId), // Assuming riderId here is the direct riderTable.id
      with: {
        paymentMethods: true,
      },
    });

    if (!rider) {
      return false;
    }

    switch (todoType) {
      case "personal":
        return !!(
          rider.firstName &&
          rider.lastName &&
          rider.email &&
          rider.address &&
          rider.latitude &&
          rider.longitude
        );
      case "vehicle":
        return !!(rider.vehicleType && rider.vehicleLicense);
      case "payment":
        return !!(rider.paymentMethods && rider.paymentMethods.length > 0);
      default:
        return false;
    }
  }
}
