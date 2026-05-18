-- CreateEnum
CREATE TYPE "ServerOrderStatus" AS ENUM ('PENDING', 'IN_PROCESS', 'SUCCESS', 'REJECTED', 'CANCELLED');

-- CreateTable
CREATE TABLE "ServerServiceBox" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServerServiceBox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServerService" (
    "id" TEXT NOT NULL,
    "apiId" TEXT NOT NULL,
    "boxId" TEXT NOT NULL,
    "toolId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(12,0) NOT NULL,
    "deliveryTime" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "requiredFields" TEXT,
    "status" "ImeiServiceStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServerService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServerOrder" (
    "id" TEXT NOT NULL,
    "orderCode" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "price" DECIMAL(12,0) NOT NULL,
    "status" "ServerOrderStatus" NOT NULL DEFAULT 'PENDING',
    "requiredFields" TEXT,
    "email" TEXT,
    "notes" TEXT,
    "code" TEXT,
    "comments" TEXT,
    "referenceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "processedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ServerOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ServerService_boxId_status_idx" ON "ServerService"("boxId", "status");

-- CreateIndex
CREATE INDEX "ServerService_apiId_idx" ON "ServerService"("apiId");

-- CreateIndex
CREATE UNIQUE INDEX "ServerOrder_orderCode_key" ON "ServerOrder"("orderCode");

-- CreateIndex
CREATE INDEX "ServerOrder_userId_status_idx" ON "ServerOrder"("userId", "status");

-- CreateIndex
CREATE INDEX "ServerOrder_status_createdAt_idx" ON "ServerOrder"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "ServerService" ADD CONSTRAINT "ServerService_apiId_fkey" FOREIGN KEY ("apiId") REFERENCES "ImeiApi"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServerService" ADD CONSTRAINT "ServerService_boxId_fkey" FOREIGN KEY ("boxId") REFERENCES "ServerServiceBox"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServerOrder" ADD CONSTRAINT "ServerOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServerOrder" ADD CONSTRAINT "ServerOrder_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "ServerService"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
