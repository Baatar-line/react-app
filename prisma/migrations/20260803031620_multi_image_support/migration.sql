-- AlterTable: places — add `images` array, backfill from the old single
-- `image` column, then drop it.
ALTER TABLE "places" ADD COLUMN "images" TEXT[] DEFAULT ARRAY[]::TEXT[];
UPDATE "places" SET "images" = ARRAY["image"] WHERE "image" IS NOT NULL AND "image" <> '';
ALTER TABLE "places" DROP COLUMN "image";

-- AlterTable: scenic_pins
ALTER TABLE "scenic_pins" ADD COLUMN "images" TEXT[] DEFAULT ARRAY[]::TEXT[];
UPDATE "scenic_pins" SET "images" = ARRAY["image"] WHERE "image" IS NOT NULL AND "image" <> '';
ALTER TABLE "scenic_pins" DROP COLUMN "image";

-- AlterTable: events
ALTER TABLE "events" ADD COLUMN "images" TEXT[] DEFAULT ARRAY[]::TEXT[];
UPDATE "events" SET "images" = ARRAY["image"] WHERE "image" IS NOT NULL AND "image" <> '';
ALTER TABLE "events" DROP COLUMN "image";
