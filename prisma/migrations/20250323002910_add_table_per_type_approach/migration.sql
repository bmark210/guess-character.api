/*
  Warnings:

  - You are about to drop the `characters` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "characters";

-- CreateTable
CREATE TABLE "base_entities" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "mention" TEXT NOT NULL,
    "type" "CharacterType" NOT NULL,
    "level" "Difficulty" NOT NULL,

    CONSTRAINT "base_entities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "people" (
    "baseId" TEXT NOT NULL,
    "traits" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "SocialStatus",

    CONSTRAINT "people_pkey" PRIMARY KEY ("baseId")
);

-- CreateTable
CREATE TABLE "entities" (
    "baseId" TEXT NOT NULL,
    "entityType" "EntityType",

    CONSTRAINT "entities_pkey" PRIMARY KEY ("baseId")
);

-- CreateTable
CREATE TABLE "food_items" (
    "baseId" TEXT NOT NULL,
    "foodType" "FoodType",

    CONSTRAINT "food_items_pkey" PRIMARY KEY ("baseId")
);

-- CreateTable
CREATE TABLE "object_items" (
    "baseId" TEXT NOT NULL,
    "material" "Material",
    "usage" "ObjectUsage",

    CONSTRAINT "object_items_pkey" PRIMARY KEY ("baseId")
);

-- CreateTable
CREATE TABLE "places" (
    "baseId" TEXT NOT NULL,
    "placeType" "PlaceType",

    CONSTRAINT "places_pkey" PRIMARY KEY ("baseId")
);

-- AddForeignKey
ALTER TABLE "people" ADD CONSTRAINT "people_baseId_fkey" FOREIGN KEY ("baseId") REFERENCES "base_entities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entities" ADD CONSTRAINT "entities_baseId_fkey" FOREIGN KEY ("baseId") REFERENCES "base_entities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_items" ADD CONSTRAINT "food_items_baseId_fkey" FOREIGN KEY ("baseId") REFERENCES "base_entities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "object_items" ADD CONSTRAINT "object_items_baseId_fkey" FOREIGN KEY ("baseId") REFERENCES "base_entities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "places" ADD CONSTRAINT "places_baseId_fkey" FOREIGN KEY ("baseId") REFERENCES "base_entities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
