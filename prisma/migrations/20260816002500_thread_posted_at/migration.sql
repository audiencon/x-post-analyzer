-- AlterTable
ALTER TABLE "Thread" ADD COLUMN "postedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Thread_userId_postedAt_idx" ON "Thread"("userId", "postedAt");
