-- CreateEnum
CREATE TYPE "IndodeskClientRole" AS ENUM ('USER', 'TEKNISI');

-- AlterTable IndodeskDownload: add role, change unique constraint
ALTER TABLE "IndodeskDownload" ADD COLUMN "role" "IndodeskClientRole" NOT NULL DEFAULT 'USER';

DROP INDEX IF EXISTS "IndodeskDownload_platform_key";

CREATE UNIQUE INDEX "IndodeskDownload_platform_role_key" ON "IndodeskDownload"("platform", "role");

-- CreateTable IndodeskDevice
CREATE TABLE "IndodeskDevice" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "IndodeskClientRole" NOT NULL,
    "rustdeskId" TEXT NOT NULL,
    "deviceUuid" TEXT NOT NULL,
    "platform" TEXT,
    "tokenHash" TEXT NOT NULL,
    "lastSeenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IndodeskDevice_pkey" PRIMARY KEY ("id")
);

-- CreateTable IndodeskPairingCode
CREATE TABLE "IndodeskPairingCode" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "role" "IndodeskClientRole" NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IndodeskPairingCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IndodeskDevice_tokenHash_key" ON "IndodeskDevice"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "IndodeskDevice_userId_role_rustdeskId_key" ON "IndodeskDevice"("userId", "role", "rustdeskId");

-- CreateIndex
CREATE INDEX "IndodeskDevice_rustdeskId_idx" ON "IndodeskDevice"("rustdeskId");

-- CreateIndex
CREATE INDEX "IndodeskDevice_userId_role_idx" ON "IndodeskDevice"("userId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "IndodeskPairingCode_code_key" ON "IndodeskPairingCode"("code");

-- CreateIndex
CREATE INDEX "IndodeskPairingCode_userId_idx" ON "IndodeskPairingCode"("userId");

-- CreateIndex
CREATE INDEX "IndodeskPairingCode_expiresAt_idx" ON "IndodeskPairingCode"("expiresAt");

-- AddForeignKey
ALTER TABLE "IndodeskDevice" ADD CONSTRAINT "IndodeskDevice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IndodeskPairingCode" ADD CONSTRAINT "IndodeskPairingCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
