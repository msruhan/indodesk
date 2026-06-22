-- Teknisi public posts feed (profil tab Postingan)

CREATE TABLE "TeknisiPost" (
    "id" TEXT NOT NULL,
    "teknisiId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "videoUrl" TEXT,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "TeknisiPost_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TeknisiPostAttachment" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "fileName" TEXT,
    "mimeType" TEXT,
    "sizeBytes" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TeknisiPostAttachment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TeknisiPost_teknisiId_publishedAt_idx" ON "TeknisiPost"("teknisiId", "publishedAt" DESC);
CREATE INDEX "TeknisiPost_teknisiId_deletedAt_idx" ON "TeknisiPost"("teknisiId", "deletedAt");
CREATE INDEX "TeknisiPostAttachment_postId_sortOrder_idx" ON "TeknisiPostAttachment"("postId", "sortOrder");

ALTER TABLE "TeknisiPost" ADD CONSTRAINT "TeknisiPost_teknisiId_fkey" FOREIGN KEY ("teknisiId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TeknisiPostAttachment" ADD CONSTRAINT "TeknisiPostAttachment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "TeknisiPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
