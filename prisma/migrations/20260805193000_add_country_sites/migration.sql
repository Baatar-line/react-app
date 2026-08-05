CREATE TABLE "country_sites" (
    "id" SERIAL NOT NULL,
    "country" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "country_sites_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "country_sites_countryId_position_key" ON "country_sites"("countryId", "position");
CREATE INDEX "country_sites_country_idx" ON "country_sites"("country");
