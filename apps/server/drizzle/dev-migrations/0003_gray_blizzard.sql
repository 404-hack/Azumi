ALTER TABLE "shop" ALTER COLUMN "latitude" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "shop" ALTER COLUMN "longitude" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "shop" ADD COLUMN "location" geometry(point,4326);--> statement-breakpoint
CREATE INDEX "shop_location_gist_idx" ON "shop" USING gist ("location");--> statement-breakpoint

-- Create additional spatial index for approved shops (better performance for main queries)
CREATE INDEX "shop_status_location_idx" ON "shop" USING gist ("location") WHERE "status" = 'APPROVED';--> statement-breakpoint

-- Populate geometry column from existing lat/lng data
UPDATE "shop" 
SET "location" = ST_SetSRID(ST_Point("longitude", "latitude"), 4326)
WHERE "longitude" IS NOT NULL 
  AND "latitude" IS NOT NULL 
  AND "location" IS NULL;--> statement-breakpoint

-- Create trigger function to automatically update geometry when lat/lng changes
CREATE OR REPLACE FUNCTION update_shop_location_trigger()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
        NEW.location = ST_SetSRID(ST_Point(NEW.longitude, NEW.latitude), 4326);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;--> statement-breakpoint

-- Create trigger
DROP TRIGGER IF EXISTS shop_location_update_trigger ON "shop";--> statement-breakpoint
CREATE TRIGGER shop_location_update_trigger
    BEFORE INSERT OR UPDATE ON "shop"
    FOR EACH ROW
    EXECUTE FUNCTION update_shop_location_trigger();--> statement-breakpoint

-- Analyze table for query optimization
ANALYZE "shop";