-- AlterTable
ALTER TABLE "Roast" ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "userId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Roast_isPublic_createdAt_idx" ON "Roast"("isPublic", "createdAt");
