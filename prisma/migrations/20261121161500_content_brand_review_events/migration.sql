CREATE TABLE "ContentBrandReviewEvent" (
  "id" TEXT NOT NULL,
  "shopId" TEXT NOT NULL,
  "actorUserId" TEXT NOT NULL,
  "event" VARCHAR(32) NOT NULL,
  "revision" INTEGER NOT NULL,
  "snapshot" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ContentBrandReviewEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ContentBrandReviewEvent_shopId_createdAt_idx"
  ON "ContentBrandReviewEvent"("shopId", "createdAt");
ALTER TABLE "ContentBrandReviewEvent" ADD CONSTRAINT "ContentBrandReviewEvent_shopId_fkey"
  FOREIGN KEY ("shopId") REFERENCES "ContentBrandShop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
