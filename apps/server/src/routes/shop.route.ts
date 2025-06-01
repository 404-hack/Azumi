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
import { and, between, eq, gte, lte, sql } from "drizzle-orm";
import { createAuth } from "../lib/auth";
import { nanoid } from "nanoid";
import { factory } from "../lib/factory";
import { DAYS_OF_WEEK } from "../lib/constant";
import {
  isShopCurrentlyOpen,
  parseTimeStringToMinutes,
  calculateHaversineDistance, // Import new utility function
  calculateDeliveryFee, // Import new utility function
  estimateTravelTime, // Import new utility function
} from "../lib/utils/shop.utils"; // Import helpers
import { z } from "zod";

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
      console.log("Filters applied:", {
        openNow,
        feeMin,
        feeMax,
        rating,
        discount,
        sort,
      });

      // Calculate boundary box (rough approximation)
      const latDelta = searchRadius / 111; // 1 degree of latitude is approximately 111 km
      const lonDelta = searchRadius / (111 * Math.cos(lat * (Math.PI / 180)));

      const minLat = lat - latDelta;
      const maxLat = lat + latDelta;
      const minLon = lng - lonDelta;
      const maxLon = lng + lonDelta;

      // Get current time for openNow filter
      const now = new Date();
      const currentDay = now.getDay(); // 0 for Sunday, 1 for Monday, etc.
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

      // Query for shops within the bounding box
      let query = db.query.shopTable.findMany({
        where: (shops, { and, eq, gte, lte, sql, not, isNull, or }) => {
          // Start with base query conditions
          let conditions = [
            gte(shops.latitude, minLat),
            lte(shops.latitude, maxLat),
            gte(shops.longitude, minLon),
            lte(shops.longitude, maxLon),
            eq(shops.status, "APPROVED"),
          ];

          // Add shop type filter if provided
          if (shopType) {
            conditions.push(eq(shops.shopType, shopType));
          }

          // Add rating filter if provided (single minimum rating value)
          if (rating !== null) {
            conditions.push(gte(shops.averageRating, rating));
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
          status: true,
          longitude: true,
          latitude: true,
          createdAt: true,
          updatedAt: true,
        },
        with: {
          operatingHours: true,
        },
      });

      const shops = await query;
      console.log(`Found ${shops.length} shops within the bounding box`);

      // Filter shops by actual distance using Haversine (still needed for accuracy)
      let nearbyShops = shops
        .map((shop) => {
          try {
            // Use direct latitude and longitude from the shop record
            const shopLat = shop.latitude;
            const shopLng = shop.longitude;

            // Skip shops without coordinates
            if (
              shopLat === null ||
              shopLng === null ||
              shopLat === undefined ||
              shopLng === undefined
            ) {
              console.warn(
                `Shop ${shop.id} skipped due to missing coordinates.`
              );
              return null; // Return null for shops that don't have coordinates
            }

            // Calculate actual distance using Haversine formula (use imported function)
            const distance = calculateHaversineDistance(
              lat,
              lng,
              shopLat,
              shopLng
            );

            // Calculate isOpen status (inactive shops are always closed)
            const isOpen = shop.active
              ? isShopCurrentlyOpen(
                  shop.operatingHours,
                  currentDayString,
                  currentTimeMinutes
                )
              : false;

            // Return shop with distance and isOpen status
            return { ...shop, distance, isOpen };
          } catch (e) {
            console.error(`Error processing shop ${shop.id}:`, e);
            return null; // Return null for shops that errored
          }
        })
        .filter((shop): shop is NonNullable<typeof shop> => shop !== null) // Filter out nulls
        .filter((shop) => {
          // Check if shop is within the specified radius
          return shop.distance <= searchRadius;
        });

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

        // For discount filter implementation (when discountPercentage is added to schema)
        // We'll keep the structure ready for future implementation
        // if (discount === 'any') {
        //   // Check if shop has any discount
        //   if (!shop.discountPercentage || shop.discountPercentage <= 0) {
        //     return false;
        //   }
        // } else if (discount) {
        //   // Check for specific discount percentage
        //   const discountValue = Number(discount);
        //   if (shop.discountPercentage !== discountValue) {
        //     return false;
        //   }
        // }

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

      // Create a simplified filter state for the response
      const appliedFilters = {
        openNow,
        feeRange: [feeMin, feeMax],
        rating,
        discount,
        activeSort: sort,
      };

      return c.json({
        data: {
          userLocation: { latitude: lat, longitude: lng },
          shops: nearbyShops.map((shop) => {
            const distanceKm = parseFloat(shop.distance.toFixed(2)); // Use pre-calculated distance
            const estimatedTime = estimateTravelTime(distanceKm); // Use imported function
            const deliveryFee =
              (shop as any).deliveryFee || calculateDeliveryFee(distanceKm); // Use imported function

            // Remove operatingHours from the final shop object if desired, keep isOpen
            const { operatingHours, ...shopResponse } = shop;

            return {
              ...shopResponse, // Includes the pre-calculated isOpen
              distance: distanceKm,
              estimatedTime: estimatedTime,
              deliveryFee: deliveryFee,
              // isOpen: shop.isOpen // Already included via spread
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

        const shop = await db.query.shopTable.findFirst({
          where: whereConditions,
          with: {
            operatingHours: true,
            menuCategories: {
              with: {
                menus: {
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

        // Map the shop data to a cleaner structure
        const mappedShopData = {
          ...shop, // Keep other shop properties
          menuCategories: shop.menuCategories.map((category) => ({
            ...category, // Keep other category properties
            menus: category.menus.map((menu) => {
              // Map the menuItemOptionGroups to a more direct structure
              const mappedOptionGroups = menu.menuItemOptionGroups.map(
                (menuItemOptGroup) => {
                  const optionGroupData = menuItemOptGroup.optionGroup;

                  // Extract the options directly from the nested structure
                  const mappedOptions =
                    optionGroupData.optionsToOptionGroups.map(
                      (optToGroup) => optToGroup.option
                    );

                  // Return the cleaned-up option group structure
                  return {
                    id: optionGroupData.id,
                    name: optionGroupData.name,
                    minSelections: optionGroupData.minSelections,
                    maxSelections: optionGroupData.maxSelections,
                    options: mappedOptions, // Array of option objects
                  };
                }
              );

              // Create the final menu item structure, replacing the old junction table data
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              const { menuItemOptionGroups, ...restOfMenu } = menu; // Remove original structure

              return {
                ...restOfMenu, // Keep other menu item properties (id, name, price, etc.)
                optionGroups: mappedOptionGroups, // Add the cleaned-up array
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
        console.log("this actually runs1");

        if (
          userLat !== undefined &&
          userLng !== undefined &&
          shopLat !== null &&
          shopLng !== null &&
          shopLat !== undefined &&
          shopLng !== undefined
        ) {
          console.log("this actually runs2");
          distance = parseFloat(
            calculateHaversineDistance(
              userLat,
              userLng,
              shopLat,
              shopLng
            ).toFixed(2)
          );
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
