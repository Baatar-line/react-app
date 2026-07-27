/*
  Warnings:

  - You are about to drop the column `travelAppsBackgroundImage` on the `site_settings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "site_settings" DROP COLUMN "travelAppsBackgroundImage",
ADD COLUMN     "travelAppsBackgroundImages" JSONB;
