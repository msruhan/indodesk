-- CreateTable
CREATE TABLE "TelegramNotificationTemplate" (
    "eventKey" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TelegramNotificationTemplate_pkey" PRIMARY KEY ("eventKey")
);
