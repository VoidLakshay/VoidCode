-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "emailVerifyExpiry" TIMESTAMP(3),
    "emailVerifyToken" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "photoUrl" TEXT NOT NULL DEFAULT '',
    "refreshToken" TEXT,
    "resetOtp" TEXT,
    "resetOtpExpiry" TIMESTAMP(3),
    "resetPasswordExpiry" TIMESTAMP(3),
    "resetPasswordToken" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userName" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
