import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { Context } from "../lib/types";
import {
  createShopSchema,
  updateShopSchema,
} from "../lib/validation/shop.validation";
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
  .get("/nearBy", async (c) => {
    try {
      const db = c.get("db");

      const userLat = c.req.raw.cf?.latitude as number;
      const userLon = c.req.raw.cf?.longitude as number;

      // For testing purposes, use default coordinates if not available
      const lat = userLat || 6.5244; // Default to somewhere in Africa
      const lng = userLon || 3.3792;

      console.log("User coordinates:", { lat, lng });

      // Distance in kilometers to search within
      const searchRadius = Number(c.req.query("distance")) || 10;

      // Maximum acceptable delivery distance in km
      const maxDeliveryDistance = Number(c.req.query("maxDistance")) || 10;

      // Calculate boundary box (rough approximation)
      const latDelta = searchRadius / 111; // 1 degree of latitude is approximately 111 km
      const lonDelta = searchRadius / (111 * Math.cos(lat * (Math.PI / 180)));

      const minLat = lat - latDelta;
      const maxLat = lat + latDelta;
      const minLon = lng - lonDelta;
      const maxLon = lng + lonDelta;

      // Get all shops - we'll filter them by coordinates
      const shops = await db.query.shopTable.findMany({
        with: {
          operatingHours: true,
          menuCategories: {
            with: {
              menus: {
                where: (menuItems, { eq }) => eq(menuItems.inStock, true),
                orderBy: (menuItems, { asc }) => asc(menuItems.name),
              },
            },
          },
        },
      });

      // Bike delivery speed in km/h
      const averageBikeSpeed = 15;

      // Filter shops by coordinates and calculate distance
      const shopsWithDistance = shops
        .map((shop) => {
          // Directly access coordinates as specified by user
          const coordinates = shop.coordinates as any;
          if (!coordinates || !coordinates.lat || !coordinates.lng) {
            return null;
          }

          const shopLat = coordinates.lat;
          const shopLng = coordinates.lng;

          // Check if shop is within boundary box
          if (
            shopLat < minLat ||
            shopLat > maxLat ||
            shopLng < minLon ||
            shopLng > maxLon
          ) {
            return null;
          }

          // Haversine formula to calculate distance in kilometers
          const R = 6371; // Earth's radius in km
          const dLat = ((shopLat - lat) * Math.PI) / 180;
          const dLon = ((shopLng - lng) * Math.PI) / 180;
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((lat * Math.PI) / 180) *
              Math.cos((shopLat * Math.PI) / 180) *
              Math.sin(dLon / 2) *
              Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const distanceInKm = R * c;

          // Calculate estimated delivery time in minutes
          const estimatedDeliveryMinutes =
            Math.ceil((distanceInKm / averageBikeSpeed) * 60) + 5;

          // Skip shops that are too far away
          if (distanceInKm > maxDeliveryDistance) {
            return null;
          }

          return {
            ...shop,
            distance: parseFloat(distanceInKm.toFixed(1)), // Distance in km
            distanceUnit: "km",
            estimatedDeliveryTime: estimatedDeliveryMinutes,
            estimatedDeliveryTimeUnit: "minutes",
          };
        })
        .filter((shop): shop is NonNullable<typeof shop> => shop !== null) // Type-safe null filtering
        .sort((a, b) => a.distance - b.distance);

      // Limit the number of results to avoid overwhelming the client
      const limitedResults = shopsWithDistance.slice(0, 20);
      console.log("🚀 ~ .get ~ limitedResults:", limitedResults);

      return c.json({
        data: {
          restaurants: limitedResults,
          userLocation: { latitude: lat, longitude: lng },
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
          phoneNumber: data.phone,
          email: data.email,
          shopType: data.type,
          coordinates: data.coordinates,
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
    console.log("🚀 ~ .get ~ orgId:", orgId);
    if (!orgId) {
      return c.json({ message: "unAuthorized" }, 401);
    }

    const shopWithData = await db.query.shopTable.findFirst({
      where: eq(shopTable.id, orgId),
      with: {
        // Only include sensitive data if user has admin role
        revenue: true,
        employees: true,

        // Basic data for all roles
        menus: true,
        menuCategories: true,
        menuPacks: true,
        menuOptionGroups: true,
      },
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
