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

-- CreateTable
CREATE TABLE "characters" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "mention" TEXT NOT NULL,
    "type" "CharacterType" NOT NULL,
    "level" "Difficulty" NOT NULL,
    "traits" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "SocialStatus",
    "entityType" "EntityType",
    "foodType" "FoodType",
    "material" "Material",
    "usage" "ObjectUsage",
    "placeType" "PlaceType",

    CONSTRAINT "characters_pkey" PRIMARY KEY ("id")
);
