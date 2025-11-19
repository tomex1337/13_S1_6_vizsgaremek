/*
  Warnings:

  - You are about to drop the column `birth_date` on the `UserProfile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."UserProfile" DROP COLUMN "birth_date",
ADD COLUMN     "birthDate" DATE;
