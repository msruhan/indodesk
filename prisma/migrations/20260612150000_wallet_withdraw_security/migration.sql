-- CreateEnum
CREATE TYPE "WalletWithdrawStatus" AS ENUM ('PENDING', 'COMPLETED', 'REJECT_PENDING_RELEASE', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "WalletSecuritySeverity" AS ENUM ('INFO', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "WalletSecurityAlertStatus" AS ENUM ('OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'DISMISSED');

-- CreateTable
CREATE TABLE "WalletWithdrawRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL(14,0) NOT NULL,
    "bankName" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "accountHolder" TEXT NOT NULL,
    "note" TEXT,
    "status" "WalletWithdrawStatus" NOT NULL DEFAULT 'PENDING',
    "riskScore" INTEGER NOT NULL DEFAULT 0,
    "riskFlags" JSONB,
    "ledgerHoldId" TEXT,
    "ledgerFinalId" TEXT,
    "ledgerReleaseId" TEXT,
    "proofUrl" TEXT,
    "adminNote" TEXT,
    "rejectionNote" TEXT,
    "processedById" TEXT,
    "rejectedById" TEXT,
    "releaseConfirmedById" TEXT,
    "rejectInitiatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "slaDueAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WalletWithdrawRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletSecurityAlert" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "walletId" TEXT,
    "ruleCode" TEXT NOT NULL,
    "severity" "WalletSecuritySeverity" NOT NULL,
    "status" "WalletSecurityAlertStatus" NOT NULL DEFAULT 'OPEN',
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "metadata" JSONB,
    "ledgerId" TEXT,
    "withdrawRequestId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "resolvedById" TEXT,

    CONSTRAINT "WalletSecurityAlert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WalletWithdrawRequest_status_createdAt_idx" ON "WalletWithdrawRequest"("status", "createdAt");

-- CreateIndex
CREATE INDEX "WalletWithdrawRequest_userId_idx" ON "WalletWithdrawRequest"("userId");

-- CreateIndex
CREATE INDEX "WalletSecurityAlert_status_severity_createdAt_idx" ON "WalletSecurityAlert"("status", "severity", "createdAt");

-- CreateIndex
CREATE INDEX "WalletSecurityAlert_userId_idx" ON "WalletSecurityAlert"("userId");

-- AddForeignKey
ALTER TABLE "WalletWithdrawRequest" ADD CONSTRAINT "WalletWithdrawRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletSecurityAlert" ADD CONSTRAINT "WalletSecurityAlert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
