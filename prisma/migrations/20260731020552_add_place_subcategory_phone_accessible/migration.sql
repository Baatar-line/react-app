-- AlterTable
ALTER TABLE "places" ADD COLUMN     "accessible" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "subCategory" TEXT;
