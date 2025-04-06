/*
  Warnings:

  - You are about to drop the column `mention` on the `base_entities` table. All the data in the column will be lost.
  - Added the required column `book` to the `base_entities` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Book" AS ENUM ('GENESIS', 'EXODUS', 'NUMBERS', 'JOSHUA', 'JUDGES', 'RUTH', 'ONE_SAMUEL', 'TWO_SAMUEL', 'ONE_KINGS', 'TWO_KINGS', 'ONE_CHRONICLES', 'TWO_CHRONICLES', 'EZRA', 'NEHEMIAH', 'ESTHER', 'DANIEL', 'MATTHEW', 'MARK', 'LUKE', 'JOHN', 'ACTS');

-- AlterTable
ALTER TABLE "base_entities" DROP COLUMN "mention",
ADD COLUMN     "book" "Book" NOT NULL;
