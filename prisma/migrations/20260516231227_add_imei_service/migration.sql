-- CreateEnum
CREATE TYPE "ImeiApiStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "ImeiServiceStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "ImeiOrderStatus" AS ENUM ('PENDING', 'IN_PROCESS', 'SUCCESS', 'REJECTED', 'CANCELLED');

-- CreateTable
CREATE TABLE "ImeiApi" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "host" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "apiType" TEXT NOT NULL DEFAULT 'DhruFusion',
    "libraryId" INTEGER NOT NULL DEFAULT 1,
    "status" "ImeiApiStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImeiApi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImeiServiceGroup" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImeiServiceGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImeiService" (
    "id" TEXT NOT NULL,
    "apiId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "toolId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(12,0) NOT NULL,
    "deliveryTime" TEXT,
    "status" "ImeiServiceStatus" NOT NULL DEFAULT 'ACTIVE',
    "requiresImei" BOOLEAN NOT NULL DEFAULT true,
    "requiresNetwork" BOOLEAN NOT NULL DEFAULT false,
    "requiresModel" BOOLEAN NOT NULL DEFAULT false,
    "requiresProvider" BOOLEAN NOT NULL DEFAULT false,
    "requiresPin" BOOLEAN NOT NULL DEFAULT false,
    "requiresKbh" BOOLEAN NOT NULL DEFAULT false,
    "requiresMep" BOOLEAN NOT NULL DEFAULT false,
    "requiresPrd" BOOLEAN NOT NULL DEFAULT false,
    "requiresSn" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImeiService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImeiOrder" (
    "id" TEXT NOT NULL,
    "orderCode" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "imei" TEXT NOT NULL,
    "price" DECIMAL(12,0) NOT NULL,
    "status" "ImeiOrderStatus" NOT NULL DEFAULT 'PENDING',
    "network" TEXT,
    "model" TEXT,
    "provider" TEXT,
    "pin" TEXT,
    "kbh" TEXT,
    "mep" TEXT,
    "prd" TEXT,
    "serialNumber" TEXT,
    "note" TEXT,
    "code" TEXT,
    "comments" TEXT,
    "referenceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "processedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ImeiOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ImeiApi_status_idx" ON "ImeiApi"("status");

-- CreateIndex
CREATE INDEX "ImeiService_groupId_status_idx" ON "ImeiService"("groupId", "status");

-- CreateIndex
CREATE INDEX "ImeiService_apiId_idx" ON "ImeiService"("apiId");

-- CreateIndex
CREATE UNIQUE INDEX "ImeiOrder_orderCode_key" ON "ImeiOrder"("orderCode");

-- CreateIndex
CREATE INDEX "ImeiOrder_userId_status_idx" ON "ImeiOrder"("userId", "status");

-- CreateIndex
CREATE INDEX "ImeiOrder_status_createdAt_idx" ON "ImeiOrder"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ImeiOrder_imei_idx" ON "ImeiOrder"("imei");

-- AddForeignKey
ALTER TABLE "ImeiService" ADD CONSTRAINT "ImeiService_apiId_fkey" FOREIGN KEY ("apiId") REFERENCES "ImeiApi"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImeiService" ADD CONSTRAINT "ImeiService_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "ImeiServiceGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImeiOrder" ADD CONSTRAINT "ImeiOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImeiOrder" ADD CONSTRAINT "ImeiOrder_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "ImeiService"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
