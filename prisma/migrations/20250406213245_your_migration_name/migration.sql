-- CreateEnum
CREATE TYPE "CharacterType" AS ENUM ('PERSON', 'ENTITY', 'FOOD', 'OBJECT', 'PLACE');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "SocialStatus" AS ENUM ('AUTHORITY', 'SPIRITUAL_LEADER', 'TEACHER', 'SERVANT_CLASS', 'LABORER', 'HEALER', 'MARGINALIZED', 'FOREIGNER', 'CITIZEN', 'PRISONER', 'RIGHTEOUS', 'SINNER', 'SYMBOLIC_ROLE', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "EntityType" AS ENUM ('ANIMAL', 'BIRD', 'FISH', 'INSECT', 'PLANT', 'ANGELIC_BEING', 'MYTHICAL_BEAST', 'SUPERNATURAL', 'OTHER');

-- CreateEnum
CREATE TYPE "FoodType" AS ENUM ('PLANT_BASED', 'ANIMAL_BASED', 'COOKED', 'RAW', 'LIQUID', 'RITUAL', 'PRESERVED', 'COMMON', 'LUXURY', 'SYMBOLIC', 'OTHER');

-- CreateEnum
CREATE TYPE "Material" AS ENUM ('ORGANIC', 'MINERAL', 'METALLIC', 'TEXTILE', 'PRECIOUS', 'LIQUID_BASED', 'EARTH_BASED', 'UNKNOWN', 'OTHER');

-- CreateEnum
CREATE TYPE "ObjectUsage" AS ENUM ('FUNCTIONAL', 'REPRESENTATIONAL', 'SACRED', 'COMMUNICATIVE', 'SUPPORTIVE', 'AESTHETIC', 'UNKNOWN', 'OTHER');

-- CreateEnum
CREATE TYPE "PlaceType" AS ENUM ('NATURAL_FEATURE', 'SETTLEMENT', 'WILDERNESS', 'SACRED_PLACE', 'REGION', 'PATHWAY', 'SYMBOLIC_PLACE', 'OTHER');

-- CreateEnum
CREATE TYPE "GameStatus" AS ENUM ('WAITING_FOR_PLAYERS', 'IN_PROGRESS', 'FINISHED');

-- CreateTable
CREATE TABLE "base_entities" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "mention" TEXT NOT NULL,
    "chapter" INTEGER NOT NULL DEFAULT 1,
    "verse" INTEGER NOT NULL DEFAULT 1,
    "image" TEXT NOT NULL,
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

-- CreateTable
CREATE TABLE "GameSession" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "GameStatus" NOT NULL DEFAULT 'WAITING_FOR_PLAYERS',
    "difficulty" "Difficulty" NOT NULL,
    "characterTypes" "CharacterType"[],
    "mentionType" TEXT[],

    CONSTRAINT "GameSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "avatarUrl" TEXT NOT NULL,
    "telegramId" TEXT NOT NULL,
    "sessionId" TEXT,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Round" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,

    CONSTRAINT "Round_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GameSession_code_key" ON "GameSession"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Player_telegramId_key" ON "Player"("telegramId");

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

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "GameSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Round" ADD CONSTRAINT "Round_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "GameSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Round" ADD CONSTRAINT "Round_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Round" ADD CONSTRAINT "Round_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "base_entities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
