import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { addressesTable } from "../lib/db/schema/address.schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { factory } from "../lib/factory";
import {
  addressSchema,
  updateAddressSchema,
} from "../lib/validation/address.validation";

const addressRoute = factory
  .createApp()

  // Address validation schema

  // Get all addresses for the authenticated user
  .get("/", async (c) => {
    try {
      const db = c.get("db");
      const user = c.get("user");

      if (!user) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const userAddresses = await db.query.addressesTable.findMany({
        where: eq(addressesTable.userId, user.id),
        orderBy: (addressesTable, { desc }) => [
          desc(addressesTable.isDefault),
          desc(addressesTable.id),
        ],
      });

      return c.json({ data: userAddresses });
    } catch (error) {
      console.error("Error fetching addresses:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  })
  .get("/default", async (c) => {
    try {
      const db = c.get("db");
      const user = c.get("user");

      if (!user) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const defaultAddress = await db.query.addressesTable.findFirst({
        where: and(
          eq(addressesTable.userId, user.id),
          eq(addressesTable.isDefault, true)
        ),
      });

      if (!defaultAddress) {
        return c.json({ error: "Default address not found" }, 404);
      }

      return c.json({ data: defaultAddress });
    } catch (error) {
      console.error("Error fetching default address:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  })
  // Get a specific address by ID
  .get("/:id", async (c) => {
    try {
      const { id } = c.req.param();
      const db = c.get("db");
      const user = c.get("user");

      if (!user) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const address = await db.query.addressesTable.findFirst({
        where: and(
          eq(addressesTable.id, id),
          eq(addressesTable.userId, user.id)
        ),
      });

      if (!address) {
        return c.json({ error: "Address not found" }, 404);
      }

      return c.json({ data: address });
    } catch (error) {
      console.error("Error fetching address:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  })

  // Create a new address
  .post("/", zValidator("json", addressSchema), async (c) => {
    try {
      const data = c.req.valid("json");
      const db = c.get("db");
      const user = c.get("user");

      if (!user) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      // If this is set as default, unset any existing default address
      if (data.isDefault) {
        await db
          .update(addressesTable)
          .set({ isDefault: false })
          .where(
            and(
              eq(addressesTable.userId, user.id),
              eq(addressesTable.isDefault, true)
            )
          );
      }

      // Create the new address
      const addressId = nanoid();
      const newAddress = await db
        .insert(addressesTable)
        .values({
          id: addressId,
          userId: user.id,
          ...data,
        })
        .returning()
        .get();

      return c.json({ data: newAddress }, 201);
    } catch (error) {
      console.error("Error creating address:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  })

  // Update an existing address
  .patch("/:id", zValidator("json", updateAddressSchema), async (c) => {
    try {
      const { id } = c.req.param();
      const data = c.req.valid("json");
      const db = c.get("db");
      const user = c.get("user");

      if (!user) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      // Check if address exists and belongs to user
      const existingAddress = await db.query.addressesTable.findFirst({
        where: and(
          eq(addressesTable.id, id),
          eq(addressesTable.userId, user.id)
        ),
      });

      if (!existingAddress) {
        return c.json({ error: "Address not found" }, 404);
      }

      // If setting as default, unset any existing default address
      if (data.isDefault) {
        await db
          .update(addressesTable)
          .set({ isDefault: false })
          .where(
            and(
              eq(addressesTable.userId, user.id),
              eq(addressesTable.isDefault, true),
              eq(addressesTable.id, id) // Not the current address
            )
          );
      }

      // Update the address
      const updatedAddress = await db
        .update(addressesTable)
        .set(data)
        .where(
          and(eq(addressesTable.id, id), eq(addressesTable.userId, user.id))
        )
        .returning()
        .get();

      return c.json({ data: updatedAddress });
    } catch (error) {
      console.error("Error updating address:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  })

  // Set an address as default
  .post("/:id/set-default", async (c) => {
    try {
      const { id } = c.req.param();
      const db = c.get("db");
      const user = c.get("user");

      if (!user) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      // Check if address exists and belongs to user
      const existingAddress = await db.query.addressesTable.findFirst({
        where: and(
          eq(addressesTable.id, id),
          eq(addressesTable.userId, user.id)
        ),
      });

      if (!existingAddress) {
        return c.json({ error: "Address not found" }, 404);
      }

      // Unset any existing default address
      await db
        .update(addressesTable)
        .set({ isDefault: false })
        .where(
          and(
            eq(addressesTable.userId, user.id),
            eq(addressesTable.isDefault, true)
          )
        );

      // Set the selected address as default
      const updatedAddress = await db
        .update(addressesTable)
        .set({ isDefault: true })
        .where(eq(addressesTable.id, id))
        .returning()
        .get();

      return c.json({ data: updatedAddress });
    } catch (error) {
      console.error("Error setting default address:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  })
  // Get default address

  // Delete an address
  .delete("/:id", async (c) => {
    try {
      const { id } = c.req.param();
      const db = c.get("db");
      const user = c.get("user");

      if (!user) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      // Check if address exists and belongs to user
      const existingAddress = await db.query.addressesTable.findFirst({
        where: and(
          eq(addressesTable.id, id),
          eq(addressesTable.userId, user.id)
        ),
      });

      if (!existingAddress) {
        return c.json({ error: "Address not found" }, 404);
      }

      // Delete the address
      await db
        .delete(addressesTable)
        .where(
          and(eq(addressesTable.id, id), eq(addressesTable.userId, user.id))
        );

      // If this was the default address, set the most recent address as default
      if (existingAddress.isDefault) {
        const remainingAddresses = await db.query.addressesTable.findMany({
          where: eq(addressesTable.userId, user.id),
          orderBy: (addressesTable, { desc }) => [desc(addressesTable.id)],
          limit: 1,
        });

        if (remainingAddresses.length > 0) {
          await db
            .update(addressesTable)
            .set({ isDefault: true })
            .where(eq(addressesTable.id, remainingAddresses[0].id));
        }
      }

      return c.json({ success: true });
    } catch (error) {
      console.error("Error deleting address:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  });

export default addressRoute;
