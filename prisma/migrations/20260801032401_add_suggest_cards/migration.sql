-- CreateTable
CREATE TABLE "suggest_cards" (
    "id" SERIAL NOT NULL,
    "collectionSlug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "image" TEXT,
    "addedBy" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suggest_cards_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "suggest_cards" ADD CONSTRAINT "suggest_cards_addedBy_fkey" FOREIGN KEY ("addedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
