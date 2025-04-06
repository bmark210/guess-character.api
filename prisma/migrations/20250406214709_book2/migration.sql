/*
  Warnings:

  - You are about to drop the column `mentionType` on the `GameSession` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "GameSession" DROP COLUMN "mentionType",
ADD COLUMN     "books" "Book"[];
