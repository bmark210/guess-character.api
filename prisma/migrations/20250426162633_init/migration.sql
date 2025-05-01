/*
  Warnings:

  - You are about to drop the `Player` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Round` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "HintLevel" AS ENUM ('ONE', 'TWO', 'THREE', 'FOUR');

-- DropForeignKey
ALTER TABLE "Player" DROP CONSTRAINT "Player_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "Round" DROP CONSTRAINT "Round_characterId_fkey";

-- DropForeignKey
ALTER TABLE "Round" DROP CONSTRAINT "Round_playerId_fkey";

-- DropForeignKey
ALTER TABLE "Round" DROP CONSTRAINT "Round_sessionId_fkey";

-- AlterTable
ALTER TABLE "GameSession" ADD COLUMN     "winners" TEXT[] DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "difficulty" SET DEFAULT 'EASY';

-- AlterTable
ALTER TABLE "base_entities" ADD COLUMN     "relatedCharacterId" TEXT;

-- AlterTable
ALTER TABLE "people" ALTER COLUMN "traits" DROP DEFAULT;

-- DropTable
DROP TABLE "Player";

-- DropTable
DROP TABLE "Round";

-- CreateTable
CREATE TABLE "players" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "avatarUrl" TEXT NOT NULL,
    "telegramId" TEXT NOT NULL,
    "sessionId" TEXT,
    "rating" INTEGER NOT NULL DEFAULT 0,
    "awardId" TEXT,

    CONSTRAINT "players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assignments" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "guess_tries" INTEGER NOT NULL DEFAULT 0,
    "isWinner" BOOLEAN NOT NULL DEFAULT false,
    "hints" "HintLevel"[] DEFAULT ARRAY[]::"HintLevel"[],

    CONSTRAINT "assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "awards" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "raiting" INTEGER NOT NULL,
    "color" TEXT NOT NULL,

    CONSTRAINT "awards_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "players_telegramId_key" ON "players"("telegramId");

-- AddForeignKey
ALTER TABLE "players" ADD CONSTRAINT "players_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "GameSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "players" ADD CONSTRAINT "players_awardId_fkey" FOREIGN KEY ("awardId") REFERENCES "awards"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "base_entities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "GameSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
