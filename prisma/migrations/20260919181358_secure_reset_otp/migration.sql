/*
  Warnings:

  - You are about to drop the column `resetOtp` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "resetOtp",
ADD COLUMN     "resetOtpHash" TEXT;
