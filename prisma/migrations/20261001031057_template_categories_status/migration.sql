-- AlterTable
ALTER TABLE "Template" ADD COLUMN     "categories" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'published';

-- CreateIndex
CREATE INDEX "Template_status_sortOrder_idx" ON "Template"("status", "sortOrder");
