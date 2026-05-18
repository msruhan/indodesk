-- CreateEnum
CREATE TYPE "IndodeskPlatform" AS ENUM ('WINDOWS', 'MACOS');

-- CreateTable
CREATE TABLE "IndodeskDownload" (
    "id" TEXT NOT NULL,
    "platform" "IndodeskPlatform" NOT NULL,
    "downloadUrl" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.3.7',
    "fileSize" TEXT DEFAULT '~15 MB',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IndodeskDownload_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IndodeskDownload_platform_key" ON "IndodeskDownload"("platform");
