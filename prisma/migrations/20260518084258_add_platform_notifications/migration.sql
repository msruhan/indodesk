-- CreateTable
CREATE TABLE "PlatformNotification" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "audiences" JSONB NOT NULL,
    "tone" TEXT NOT NULL DEFAULT 'primary',
    "icon" TEXT NOT NULL DEFAULT 'bell',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlatformNotification_active_createdAt_idx" ON "PlatformNotification"("active", "createdAt" DESC);
