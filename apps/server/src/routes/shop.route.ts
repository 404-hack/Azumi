import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { Context } from "../lib/types";
import {
  createShopSchema,
  updateShopSchema,
} from "../lib/validation/shop.validation";
import { nearbyShopsQuerySchema } from "../lib/validation/shop.nearby.validation";
import {
  shopOperatingHoursTable,
  shopTable,
  shopTodoTable,
} from "../lib/db/schema/shop.schema";
import { and, between, eq, sql } from "drizzle-orm";
import { createAuth } from "../lib/auth";
import { nanoid } from "nanoid";
import { factory } from "../lib/factory";

const shopRoute = factory
  .createApp()
  // Backward compatibility route that redirects to the new endpoint

  .get("/nearby", zValidator("query", nearbyShopsQuerySchema), async (c) => {
    try {
      const db = c.get("db");

      // Get validated and typed query parameters
      const {
        latitude: lat,
        longitude: lng,
        distance: searchRadius,
        maxDistance: maxDeliveryDistance,
        shopType,
      } = c.req.valid("query");

      console.log("User coordinates:", { lat, lng });

      // Calculate boundary box (rough approximation)
      const latDelta = searchRadius / 111; // 1 degree of latitude is approximately 111 km
      const lonDelta = searchRadius / (111 * Math.cos(lat * (Math.PI / 180)));

      const minLat = lat - latDelta;
      const maxLat = lat + latDelta;
      const minLon = lng - lonDelta;
      const maxLon = lng + lonDelta;

      // Query for shops within the bounding box
      let query = db.query.shopTable.findMany({
        where: (shops, { and, eq, gte, lte, sql }) => {
          // Start with base query conditions
          let conditions = [
            gte(shops.latitude, minLat),
            lte(shops.latitude, maxLat),
            gte(shops.longitude, minLon),
            lte(shops.longitude, maxLon),
          ];

          // Add shop type filter if provided
          if (shopType) {
            conditions.push(eq(shops.shopType, shopType));
          }

          // Return combined conditions
          return and(...conditions);
        },
        // Include necessary shop information
        columns: {
          id: true,
          name: true,
          slug: true,
          description: true,
          coverImage: true,
          averageRating: true,
          totalRatings: true,

          active: true,
          longitude: true,
          latitude: true,
        },
        with: {
          operatingHours: true,
        },
      });

      const shops = await query;
      console.log(shops);

      // Filter shops by actual distance using Haversine (still needed for accuracy)
      const nearbyShops = shops
        .filter((shop) => {
          try {
            // Use direct latitude and longitude from the shop record
            const shopLat = shop.latitude;
            const shopLng = shop.longitude;

            // Skip shops without coordinates (already filtered by DB if non-null constraint exists, but good safety check)
            if (
              shopLat === null ||
              shopLng === null ||
              shopLat === undefined ||
              shopLng === undefined
            ) {
              console.warn(
                `Shop ${shop.id} skipped due to missing coordinates.`
              );
              return false;
            }

            // Bounding box check is now done in the DB query, technically redundant here but harmless
            // if (
            //   shopLat < minLat ||
            //   shopLat > maxLat ||
            //   shopLng < minLon ||
            //   shopLng > maxLon
            // ) {
            //   return false;
            // }

            // Calculate actual distance using Haversine formula
            const R = 6371; // Earth's radius in km
            const dLat = ((shopLat - lat) * Math.PI) / 180;
            const dLon = ((shopLng - lng) * Math.PI) / 180;
            const a =
              Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos((lat * Math.PI) / 180) *
                Math.cos((shopLat * Math.PI) / 180) *
                Math.sin(dLon / 2) *
                Math.sin(dLon / 2);
            const c_dist = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const distance = R * c_dist;

            // Store distance for later use in sorting
            (shop as any).distance = distance;

            // Check if shop is within the specified radius
            return distance <= searchRadius;
          } catch (e) {
            console.error(`Error processing shop ${shop.id}:`, e);
            return false;
          }
        })
        // Sort by distance (closest first)
        .sort((a, b) => (a as any).distance - (b as any).distance);

      // Function to estimate total delivery time (including buffer for prep/rider travel to shop)
      // Updated with a slightly reduced average buffer and tight 10-min range.
      const estimateTravelTime = (distanceKm: number): string => {
        // --- Configuration ---
        const averageSpeedKmh = 17.5; // Avg. cycling speed (km/h) - Adjust if needed based on vehicle/area
        // Buffer includes avg. prep time, rider assignment, and rider travel TO shop.
        // Reduced slightly to 6 mins, acknowledging riders might often be nearby,
        // but retaining buffer for necessary prep and assignment variability.
        const averageBufferMinutes = 6;
        const rangeHalfWidth = 5; // Creates a 10-minute total range (center +/- 5)
        const minimumEstimateCenter = 15; // Min. center time (e.g., avoids "5-15 min")

        // --- Calculation ---
        // Calculate base travel time from shop to customer
        const baseTimeMinutes = (distanceKm / averageSpeedKmh) * 60;

        // Calculate total estimated time including average buffer
        const totalEstimatedTime = baseTimeMinutes + averageBufferMinutes;

        // Round the total estimate to the nearest 5 minutes to get the center of our range
        const centerRounded = Math.round(totalEstimatedTime / 5) * 5;

        // Ensure the center point isn't below our defined minimum
        const finalCenter = Math.max(minimumEstimateCenter, centerRounded);

        // Calculate the lower and upper bounds based on the final center
        const lowerBound = finalCenter - rangeHalfWidth;
        const upperBound = finalCenter + rangeHalfWidth;

        // Return the formatted string (e.g., "20-30 min")
        return `${lowerBound}-${upperBound} min`;
      };

      // Function to calculate delivery fee based on distance in Nigerian Naira (NGN)
      // Using a base fee + per km model for more granular pricing.
      const calculateDeliveryFee = (distanceKm: number): number => {
        const baseFee = 350; // Base fee in NGN (covers first ~1km)
        const perKmFee = 150; // Fee per km after the first km in NGN
        const minimumDistanceForPerKm = 1; // Distance (km) included in the base fee

        let deliveryFee = baseFee;

        if (distanceKm > minimumDistanceForPerKm) {
          deliveryFee += (distanceKm - minimumDistanceForPerKm) * perKmFee;
        }

        // Ensure the fee is at least the base fee and round to nearest 50 Naira for cleaner pricing
        const finalFee = Math.max(baseFee, deliveryFee);
        return Math.round(finalFee / 50) * 50;

        // Example calculations:
        // 1 km: Math.round(Math.max(350, 350 + (1-1)*150) / 50) * 50 = 350
        // 3 km: Math.round(Math.max(350, 350 + (3-1)*150) / 50) * 50 = Math.round(650 / 50) * 50 = 650
        // 5 km: Math.round(Math.max(350, 350 + (5-1)*150) / 50) * 50 = Math.round(950 / 50) * 50 = 950
        // 7 km: Math.round(Math.max(350, 350 + (7-1)*150) / 50) * 50 = Math.round(1250 / 50) * 50 = 1250
        // Note: This model provides smoother scaling than fixed tiers. Adjust baseFee/perKmFee as needed.
      };

      return c.json({
        data: {
          userLocation: { latitude: lat, longitude: lng },
          shops: nearbyShops.map((shop) => {
            const distanceKm = parseFloat((shop as any).distance.toFixed(2)); // Distance is in kilometers
            const estimatedTime = estimateTravelTime(distanceKm); // Uses the updated function
            const deliveryFee = calculateDeliveryFee(distanceKm); // Calculate the delivery fee
            return {
              ...shop,
              distance: distanceKm, // Keep the precise distance in km
              estimatedTime: estimatedTime, // Add the updated estimated time string (e.g., "20-30 min")
              deliveryFee: deliveryFee, // Add the calculated delivery fee
            };
          }),
        },
      });
    } catch (error) {
      console.error("Error finding nearby shops:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  })
  // Create shop
  .post("/create", zValidator("json", createShopSchema), async (c) => {
    try {
      const data = c.req.valid("json");
      const db = c.get("db");
      const auth = await createAuth(db);

      // Get user and verify
      // const user = c.get("user");
      // if (!user) {
      //   return c.json({ error: "Unauthorized" }, 401);
      // }

      const slug = `${data.name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")}-${nanoid(6)}`;

      const organization = await auth.api.createOrganization({
        headers: c.req.raw.headers,
        body: {
          name: data.name,
          slug: slug,
        },
      });

      if (!organization) {
        return c.json({ error: "Failed to create shop" }, 400);
      }

      const shop = await db
        .update(shopTable)
        .set({
          name: data.name,
          address: data.address,
          phoneNumber: data.phoneNumber, // Ensure this matches the schema
          email: data.email,
          shopType: data.type,
          longitude: data.longitude,
          latitude: data.latitude,
          addressName: data.addressName,
        })
        .where(eq(shopTable.id, organization.id))
        .returning()
        .get();
      // create the shop todo
      await db.insert(shopTodoTable).values({
        shopId: organization.id,
      });

      // Set the newly created organization as active
      await auth.api.setActiveOrganization({
        headers: c.req.raw.headers,
        body: {
          organizationId: organization.id,
        },
      });

      return c.json({ data: shop });
    } catch (error) {
      console.error("Error creating shop:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  })
  .get("/shopTypes", async (c) => {
    const db = c.get("db");
    const shopTypes = await db.query.shopTypeTable.findMany();
    return c.json({ data: shopTypes });
  })

  // Get shop by slug
  .get("/:slug", async (c) => {
    try {
      const { slug } = c.req.param();
      const db = c.get("db");
      const shop = await db.query.shopTable.findFirst({
        where: eq(shopTable.slug, slug),
        with: {
          operatingHours: true,

          menuCategories: {
            with: {
              menus: {
                where: (menuItems, { eq }) => eq(menuItems.inStock, true),
                orderBy: (menuItems, { asc }) => asc(menuItems.name),
                with: {
                  menuItemOptionGroups: {
                    columns: {
                      menuItemId: false,
                      optionGroupId: false,
                      sortOrder: false,
                    },
                    with: {
                      optionGroup: {
                        columns: {
                          id: true,
                          name: true,
                          minSelections: true,
                          maxSelections: true,
                        },
                        with: {
                          optionsToOptionGroups: {
                            columns: {
                              optionId: false,
                              optionGroupId: false,
                              createdAt: false,
                              updatedAt: false,
                            },
                            with: {
                              option: true,
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!shop) {
        return c.json({ message: "Shop not found" }, 404);
      }

      // Get active member to check role

      // Get shop with role-based data

      return c.json({
        data: shop,
      });
    } catch (error) {
      console.error("Error fetching shop:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  })
  .get("/vendor", async (c) => {
    const db = c.get("db");
    const session = c.get("session");
    const orgId = session?.activeOrganizationId;
    if (!orgId) {
      return c.json({ message: "unAuthorized" }, 401);
    }

    const shopWithData = await db.query.shopTable.findFirst({
      where: eq(shopTable.id, orgId),
      // Temporarily remove 'with' clause to isolate the error
      // with: {
      //   menus: true,
      //   menuCategories: true,
      //   menuPacks: true,
      //   menuOptionGroups: true,
      // },
    });
    console.log("🚀 ~ .get ~ shopWithData:", shopWithData);
    return c.json({
      data: shopWithData,
    });
  })
  // Update shop
  .patch("/:id", zValidator("json", updateShopSchema), async (c) => {
    try {
      const { id } = c.req.param();
      const data = c.req.valid("json");
      const db = c.get("db");
      const auth = await createAuth(db);

      // Get user and verify organization access
      const user = c.get("user");

      if (!user) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      // Get active organization from session
      const session = c.get("session");
      if (!session?.activeOrganizationId) {
        return c.json({ error: "No active organization selected" }, 400);
      }

      const shop = await db.query.shopTable.findFirst({
        where: eq(shopTable.id, id),
      });

      if (!shop) {
        return c.json({ error: "Shop not found" }, 404);
      }

      // Verify active organization matches shop's organization
      if (session.activeOrganizationId !== shop.id) {
        return c.json(
          { error: "You don't have access to edit this shop" },
          403
        );
      }

      // Check organization membership and role
      const member = await auth.api.getActiveMember();

      if (!member || member.role !== "admin") {
        return c.json({ error: "Only admins can update shop details" }, 403);
      }

      const updatedShop = await db
        .update(shopTable)
        .set(data)
        .where(eq(shopTable.id, id))
        .returning()
        .get();

      return c.json({ data: updatedShop });
    } catch (error) {
      console.error("Error updating shop:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  })

  // List shops for organization

  // Delete shop
  .delete("/:id", async (c) => {
    try {
      const { id } = c.req.param();
      const db = c.get("db");
      const auth = await createAuth(db);

      const user = c.get("user");
      if (!user) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const shop = await db.query.shopTable.findFirst({
        where: eq(shopTable.id, id),
      });

      if (!shop) {
        return c.json({ error: "Shop not found" }, 404);
      }

      // Set active organization and check membership
      await auth.api.setActiveOrganization({
        body: {
          organizationId: shop.id,
        },
      });

      const member = await auth.api.getActiveMember();
      if (!member || member.role !== "admin") {
        return c.json({ error: "Only admins can delete shops" }, 403);
      }

      await db.delete(shopTable).where(eq(shopTable.id, id));

      return c.json({ message: "Shop deleted successfully" });
    } catch (error) {
      console.error("Error deleting shop:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  });

export default shopRoute;
