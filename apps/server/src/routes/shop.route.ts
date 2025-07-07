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
import { and, between, eq, gte, lte, sql, getTableColumns } from "drizzle-orm";
import { createAuth } from "../lib/auth";
import { nanoid } from "nanoid";
import { factory } from "../lib/factory";
import { DAYS_OF_WEEK } from "../lib/constant";
import {
  isShopCurrentlyOpen,
  parseTimeStringToMinutes,
  calculateDeliveryFee,
  estimateTravelTime,
} from "../lib/utils/shop.utils";
import { calculateDistance } from "../lib/utils/geo";
import {
  createPointWithSRID,
  distanceInKm,
  withinRadius,
  orderByDistance,
} from "../lib/utils/spatial.utils";
import { z } from "zod";
import { env } from "cloudflare:workers";

const shopRoute = factory
  .createApp()

  .get("/near-me", zValidator("query", nearbyShopsQuerySchema), async (c) => {
    try {
      const db = c.get("db");

      // Get validated and typed query parameters
      const {
        latitude: lat,
        longitude: lng,
        distance: searchRadius,
        maxDistance: maxDeliveryDistance,
        shopType,
        // Get simplified filter parameters
        openNow,
        feeMin,
        feeMax,
        rating,
        discount,
        sort,
      } = c.req.valid("query");

      console.log("User coordinates:", { lat, lng });
      console.log("Search radius:", searchRadius);
      console.log("Shop type filter:", shopType);
      console.log("Filters applied:", {
        openNow,
        feeMin,
        feeMax,
        rating,
        discount,
        sort,
      });

      // Create user location point for PostGIS queries
      const userPoint = createPointWithSRID(lng, lat, 4326);

      // Get current time for openNow filter
      const now = new Date();
      const currentDay = now.getDay();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTimeMinutes = currentHour * 60 + currentMinute;

      // Convert day number to day string based on your constants
      const dayMapping = {
        0: "SUNDAY",
        1: "MONDAY",
        2: "TUESDAY",
        3: "WEDNESDAY",
        4: "THURSDAY",
        5: "FRIDAY",
        6: "SATURDAY",
      };

      const currentDayString =
        dayMapping[currentDay as keyof typeof dayMapping];

      // ✅ Use Drizzle query syntax with spatial functions (it works!)
      console.log("🔍 Using Drizzle query syntax with spatial functions...");

      const shopsWithDistance = await db.query.shopTable.findMany({
        columns: {
          id: true,
          name: true,
          slug: true,
          description: true,
          coverImage: true,
          averageRating: true,
          totalRatings: true,
          active: true,
          status: true,
          shopType: true,
          longitude: true,
          latitude: true,
          createdAt: true,
          updatedAt: true,
        },
        extras: {
          distance: distanceInKm(userPoint, shopTable.location).as("distance"),
        },
        with: {
          operatingHours: true,
        },
        where: (shop, { and, eq, gte }) =>
          and(
            withinRadius(userPoint, shop.location, searchRadius),
            eq(shop.status, "APPROVED"),
            ...(shopType ? [eq(shop.shopType, shopType)] : []),
            ...(rating !== null ? [gte(shop.averageRating, rating)] : [])
          ),
        orderBy: () => [orderByDistance(userPoint, shopTable.location)],
        limit: 100,
      });

      console.log(
        "✅ PostGIS query completed, found shops:",
        shopsWithDistance.length
      );
      console.log(
        "📍 First few shops:",
        shopsWithDistance.slice(0, 3).map((s) => ({
          id: s.id,
          name: s.name,
          distance: s.distance,
          shopType: s.shopType || "undefined",
          status: s.status,
        }))
      );

      // Process shops with operating hours and calculate isOpen status
      let nearbyShops = shopsWithDistance
        .map((shop) => {
          try {
            // Get operating hours directly from the shop relation
            const shopOperatingHours = shop.operatingHours || [];

            // Calculate isOpen status (inactive shops are always closed)
            const isOpen = shop.active
              ? isShopCurrentlyOpen(
                  shopOperatingHours,
                  currentDayString,
                  currentTimeMinutes
                )
              : false;

            return {
              ...shop,
              distance: parseFloat((shop.distance as number).toFixed(2)),
              isOpen,
              operatingHours: shopOperatingHours,
            };
          } catch (e) {
            console.error(`Error processing shop ${shop.id}:`, e);
            return null;
          }
        })
        .filter((shop): shop is NonNullable<typeof shop> => shop !== null);

      console.log(
        "🔄 After processing operating hours, shops count:",
        nearbyShops.length
      );

      // Apply additional filters
      nearbyShops = nearbyShops.filter((shop) => {
        // Apply delivery fee filter
        const distanceKm = shop.distance; // Use pre-calculated distance
        const deliveryFee = calculateDeliveryFee(distanceKm);
        (shop as any).deliveryFee = deliveryFee; // Store fee for sorting/response

        if (deliveryFee < feeMin || deliveryFee > feeMax) {
          return false;
        }

        // Apply open now filter using pre-calculated isOpen status
        if (openNow && !shop.isOpen) {
          return false;
        }

        return true;
      });

      // Sort results based on sort parameter
      switch (sort) {
        case "newest":
          // Sort by creation date (newest first)
          nearbyShops.sort((a, b) => {
            const aCreatedAt = a.createdAt
              ? new Date(a.createdAt).getTime()
              : 0;
            const bCreatedAt = b.createdAt
              ? new Date(b.createdAt).getTime()
              : 0;
            return bCreatedAt - aCreatedAt;
          });
          break;
        case "price: low to high":
          // Sort by delivery fee, lowest first
          nearbyShops.sort(
            (a, b) => (a as any).deliveryFee - (b as any).deliveryFee
          );
          break;
        case "price: high to low":
          // Sort by delivery fee, highest first
          nearbyShops.sort(
            (a, b) => (b as any).deliveryFee - (a as any).deliveryFee
          );
          break;
        case "rating: high to low":
          // Sort by average rating, highest first
          nearbyShops.sort(
            (a, b) => (b.averageRating || 0) - (a.averageRating || 0)
          );
          break;
        case "recommended":
        default:
          // Default sort by distance (closest first)
          nearbyShops.sort((a, b) => (a as any).distance - (b as any).distance);
          break;
      }

      console.log("📈 After sorting, final shops count:", nearbyShops.length);

      // Create a simplified filter state for the response
      const appliedFilters = {
        openNow,
        feeRange: [feeMin, feeMax],
        rating,
        discount,
        activeSort: sort,
      };

      console.log(
        "🚀 Returning response with shops count:",
        nearbyShops.length
      );
      return c.json({
        data: {
          userLocation: { latitude: lat, longitude: lng },
          shops: nearbyShops.map((shop) => {
            // Use PostGIS distance as primary source
            const finalDistance = shop.distance;
            const estimatedTime = estimateTravelTime(finalDistance);
            const deliveryFee = calculateDeliveryFee(finalDistance);

            const { operatingHours, ...shopResponse } = shop;

            return {
              ...shopResponse,
              distance: finalDistance,
              estimatedTime: estimatedTime,
              deliveryFee: deliveryFee,
            };
          }),
          filters: appliedFilters,
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
      const user = c.get("user");
      if (!user) {
        return c.json({ error: "Unauthorized" }, 401);
      }

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

      const shopResult = await db
        .update(shopTable)
        .set({
          name: data.name,
          address: data.address,
          phoneNumber: data.phoneNumber,
          email: data.email,
          shopType: data.type,
          longitude: data.longitude,
          latitude: data.latitude,
          addressName: data.addressName,
        })
        .where(eq(shopTable.id, organization.id))
        .returning();
      const shop = shopResult[0];
      console.log("🚀 ~ .post ~ shop:", shop);

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
  .get(
    "/:slug",
    zValidator(
      "query",
      z.object({
        latitude: z
          .string()
          .refine(
            (val) => {
              const num = Number(val);
              return !isNaN(num) && num >= -90 && num <= 90;
            },
            { message: "Latitude must be a number between -90 and 90" }
          )
          .transform((val) => Number(val)),
        longitude: z
          .string()
          .refine(
            (val) => {
              const num = Number(val);
              return !isNaN(num) && num >= -180 && num <= 180;
            },
            { message: "Longitude must be a number between -180 and 180" }
          )
          .transform((val) => Number(val)),
      })
    ),
    async (c) => {
      try {
        const { slug } = c.req.param();
        const { latitude: userLat, longitude: userLng } = c.req.valid("query");
        const db = c.get("db");
        const session = c.get("session");
        const orgId = session?.activeOrganizationId;

        // First, get the shop without restrictions to check ownership
        const shopForOwnershipCheck = await db.query.shopTable.findFirst({
          where: eq(shopTable.slug, slug),
          columns: { id: true },
        });

        if (!shopForOwnershipCheck) {
          return c.json({ message: "Shop not found" }, 404);
        }

        // Check if user owns this shop
        const isOwner = orgId === shopForOwnershipCheck.id;

        // Build where conditions based on ownership
        const whereConditions = isOwner
          ? eq(shopTable.slug, slug) // No restrictions for owner
          : and(eq(shopTable.slug, slug), eq(shopTable.status, "APPROVED"));

        // 1. Fetch shop, operating hours, menu categories, and menus (no deep nesting)
        const shop = await db.query.shopTable.findFirst({
          where: whereConditions,
          extras:
            userLat !== undefined &&
            userLng !== undefined &&
            shopForOwnershipCheck
              ? {
                  distance: distanceInKm(
                    createPointWithSRID(userLng, userLat, 4326),
                    shopTable.location
                  ).as("distance"),
                }
              : {},
          with: {
            operatingHours: true,
            menuCategories: {
              with: {
                menus: {
                  orderBy: (menuItems, { asc }) => asc(menuItems.name),
                },
              },
            },
          },
        });

        if (!shop) {
          return c.json({ message: "Shop not found" }, 404);
        }

        // 2. For each menu, fetch its option groups and options
        // We'll build a map of menuId -> optionGroups
        const menuIds = shop.menuCategories.flatMap((cat) =>
          cat.menus.map((m) => m.id)
        );
        let menuOptionGroupsMap: Record<string, any[]> = {};
        if (menuIds.length > 0) {
          // Fetch all option groups for all menus in one go
          const menuItemOptionGroups =
            await db.query.menuItemOptionGroups.findMany({
              where: (mio, { inArray }) => inArray(mio.menuItemId, menuIds),
              with: {
                optionGroup: {
                  columns: {
                    id: true,
                    name: true,
                    minSelections: true,
                    maxSelections: true,
                  },
                },
              },
            });
          // For each option group, fetch its options
          const optionGroupIds = menuItemOptionGroups.map(
            (mio) => mio.optionGroupId
          );
          let optionGroupsWithOptions: any[] = [];
          if (optionGroupIds.length > 0) {
            optionGroupsWithOptions = await db.query.optionGroupTable.findMany({
              where: (og, { inArray }) => inArray(og.id, optionGroupIds),
              with: {
                optionsToOptionGroups: {
                  with: {
                    option: true,
                  },
                },
              },
            });
          }
          // Build a map of optionGroupId -> options
          const optionGroupOptionsMap: Record<string, any[]> = {};
          for (const og of optionGroupsWithOptions) {
            optionGroupOptionsMap[og.id] = og.optionsToOptionGroups.map(
              (oto: any) => oto.option
            );
          }
          // Build menuOptionGroupsMap: menuId -> [optionGroups]
          for (const mio of menuItemOptionGroups) {
            if (!menuOptionGroupsMap[mio.menuItemId])
              menuOptionGroupsMap[mio.menuItemId] = [];
            menuOptionGroupsMap[mio.menuItemId].push({
              id: mio.optionGroup.id,
              name: mio.optionGroup.name,
              minSelections: mio.optionGroup.minSelections,
              maxSelections: mio.optionGroup.maxSelections,
              options: optionGroupOptionsMap[mio.optionGroup.id] || [],
            });
          }
        }

        // Map the shop data to a cleaner structure
        const mappedShopData = {
          ...shop, // Keep other shop properties
          menuCategories: shop.menuCategories.map((category) => ({
            ...category, // Keep other category properties
            menus: category.menus.map((menu) => {
              return {
                ...menu,
                optionGroups: menuOptionGroupsMap[menu.id] || [],
              };
            }),
          })),
        };

        // Calculate isOpen status
        const now = new Date();
        const currentDay = now.getDay(); // 0 for Sunday, 1 for Monday, etc.
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentTimeMinutes = currentHour * 60 + currentMinute;
        const dayMapping = {
          0: "SUNDAY",
          1: "MONDAY",
          2: "TUESDAY",
          3: "WEDNESDAY",
          4: "THURSDAY",
          5: "FRIDAY",
          6: "SATURDAY",
        };
        const currentDayString =
          dayMapping[currentDay as keyof typeof dayMapping];

        const isOpen = shop.active
          ? isShopCurrentlyOpen(
              shop.operatingHours,
              currentDayString,
              currentTimeMinutes
            )
          : false;
        // --- Calculate distance, fee, and time if user location is provided ---
        let distance: number | undefined = undefined;
        let deliveryFee: number | undefined = undefined;
        let estimatedTime: string | undefined = undefined;

        const shopLat = shop.latitude;
        const shopLng = shop.longitude;
        if (
          userLat !== undefined &&
          userLng !== undefined &&
          shopLat !== null &&
          shopLng !== null &&
          shopLat !== undefined &&
          shopLng !== undefined
        ) {
          // Use PostGIS distance if available, otherwise fallback to Haversine
          if ((shop as any).distance !== undefined) {
            distance = parseFloat(
              ((shop as any).distance as number).toFixed(2)
            );
          } else {
            // Fallback to Haversine calculation
            distance = parseFloat(
              calculateDistance(userLat, userLng, shopLat, shopLng).toFixed(2)
            );
          }

          deliveryFee = calculateDeliveryFee(distance);
          estimatedTime = estimateTravelTime(distance);
        }
        // --- End calculation ---
        return c.json({
          data: {
            ...mappedShopData,
            isOpen, // Add the calculated isOpen status
            // Conditionally add distance, fee, and time
            ...(distance !== undefined && { distance }),
            ...(deliveryFee !== undefined && { deliveryFee }),
            ...(estimatedTime !== undefined && { estimatedTime }),
          },
        });
      } catch (error) {
        console.error("Error fetching shop:", error);
        if (error instanceof z.ZodError) {
          return c.json(
            { error: "Invalid query parameters", details: error.errors },
            400
          );
        }
        return c.json({ error: "Internal server error" }, 500);
      }
    }
  )
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

      const updatedShopResult = await db
        .update(shopTable)
        .set(data)
        .where(eq(shopTable.id, id))
        .returning();
      const updatedShop = updatedShopResult[0];
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
