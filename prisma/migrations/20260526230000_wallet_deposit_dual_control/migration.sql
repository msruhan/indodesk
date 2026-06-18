-- CreateEnum
CREATE TYPE "WalletDepositStatus" AS ENUM ('PENDING_APPROVAL', 'APPROVED_BY_ONE', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "WalletDepositRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL(14,0) NOT NULL,
    "note" TEXT NOT NULL,
    "reasonCategory" TEXT,
    "method" TEXT NOT NULL DEFAULT 'manual',
    "reference" TEXT,
    "status" "WalletDepositStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
    "requestedById" TEXT NOT NULL,
    "firstApproverId" TEXT,
    "secondApproverId" TEXT,
    "rejectedById" TEXT,
    "rejectionNote" TEXT,
    "ledgerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WalletDepositRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WalletDepositRequest_status_createdAt_idx" ON "WalletDepositRequest"("status", "createdAt");

-- CreateIndex
CREATE INDEX "WalletDepositRequest_userId_idx" ON "WalletDepositRequest"("userId");

-- AddForeignKey
ALTER TABLE "WalletDepositRequest" ADD CONSTRAINT "WalletDepositRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletDepositRequest" ADD CONSTRAINT "WalletDepositRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
