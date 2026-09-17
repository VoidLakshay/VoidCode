-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailVerifyOtpAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "emailVerifyOtpExpiry" TIMESTAMP(3),
ADD COLUMN     "emailVerifyOtpHash" TEXT;
