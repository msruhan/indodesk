-- AlterTable
ALTER TABLE "TeknisiProfile" ADD COLUMN "profileSlug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "TeknisiProfile_profileSlug_key" ON "TeknisiProfile"("profileSlug");
