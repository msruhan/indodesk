-- CreateTable
CREATE TABLE "TeknisiPostLike" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeknisiPostLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeknisiPostComment" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "TeknisiPostComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeknisiPostCommentLike" (
    "id" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeknisiPostCommentLike_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TeknisiPostLike_postId_userId_key" ON "TeknisiPostLike"("postId", "userId");

-- CreateIndex
CREATE INDEX "TeknisiPostLike_postId_idx" ON "TeknisiPostLike"("postId");

-- CreateIndex
CREATE INDEX "TeknisiPostLike_userId_idx" ON "TeknisiPostLike"("userId");

-- CreateIndex
CREATE INDEX "TeknisiPostComment_postId_createdAt_idx" ON "TeknisiPostComment"("postId", "createdAt");

-- CreateIndex
CREATE INDEX "TeknisiPostComment_userId_idx" ON "TeknisiPostComment"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TeknisiPostCommentLike_commentId_userId_key" ON "TeknisiPostCommentLike"("commentId", "userId");

-- CreateIndex
CREATE INDEX "TeknisiPostCommentLike_commentId_idx" ON "TeknisiPostCommentLike"("commentId");

-- AddForeignKey
ALTER TABLE "TeknisiPostLike" ADD CONSTRAINT "TeknisiPostLike_postId_fkey" FOREIGN KEY ("postId") REFERENCES "TeknisiPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeknisiPostLike" ADD CONSTRAINT "TeknisiPostLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeknisiPostComment" ADD CONSTRAINT "TeknisiPostComment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "TeknisiPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeknisiPostComment" ADD CONSTRAINT "TeknisiPostComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeknisiPostCommentLike" ADD CONSTRAINT "TeknisiPostCommentLike_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "TeknisiPostComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeknisiPostCommentLike" ADD CONSTRAINT "TeknisiPostCommentLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
