-- CreateEnum
CREATE TYPE "ActivityCategory" AS ENUM ('AUTH', 'ACCOUNT', 'ORDER', 'PAYMENT', 'COMMUNICATION', 'ADMIN', 'SECURITY', 'SYSTEM');

-- CreateEnum
CREATE TYPE "ActivitySeverity" AS ENUM ('INFO', 'SUCCESS', 'WARNING', 'CRITICAL');

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "category" "ActivityCategory" NOT NULL DEFAULT 'SYSTEM',
    "severity" "ActivitySeverity" NOT NULL DEFAULT 'INFO',
    "summary" TEXT NOT NULL,
    "detail" TEXT,
    "actorId" TEXT,
    "actorName" TEXT,
    "actorEmail" TEXT,
    "actorRole" "UserRole",
    "targetType" TEXT,
    "targetId" TEXT,
    "targetLabel" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ActivityLog_category_createdAt_idx" ON "ActivityLog"("category", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "ActivityLog_severity_createdAt_idx" ON "ActivityLog"("severity", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "ActivityLog_actorId_createdAt_idx" ON "ActivityLog"("actorId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "ActivityLog_action_createdAt_idx" ON "ActivityLog"("action", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
