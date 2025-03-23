-- DropForeignKey
ALTER TABLE "entities" DROP CONSTRAINT "entities_baseId_fkey";

-- DropForeignKey
ALTER TABLE "food_items" DROP CONSTRAINT "food_items_baseId_fkey";

-- DropForeignKey
ALTER TABLE "object_items" DROP CONSTRAINT "object_items_baseId_fkey";

-- DropForeignKey
ALTER TABLE "people" DROP CONSTRAINT "people_baseId_fkey";

-- DropForeignKey
ALTER TABLE "places" DROP CONSTRAINT "places_baseId_fkey";

-- AddForeignKey
ALTER TABLE "people" ADD CONSTRAINT "people_baseId_fkey" FOREIGN KEY ("baseId") REFERENCES "base_entities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entities" ADD CONSTRAINT "entities_baseId_fkey" FOREIGN KEY ("baseId") REFERENCES "base_entities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_items" ADD CONSTRAINT "food_items_baseId_fkey" FOREIGN KEY ("baseId") REFERENCES "base_entities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "object_items" ADD CONSTRAINT "object_items_baseId_fkey" FOREIGN KEY ("baseId") REFERENCES "base_entities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "places" ADD CONSTRAINT "places_baseId_fkey" FOREIGN KEY ("baseId") REFERENCES "base_entities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
