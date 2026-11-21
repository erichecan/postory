-- Revised before PR merge: no deployed installations use the earlier draft.
CREATE TABLE "ContentBrandShop" (
  "id" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  "name" VARCHAR(120) NOT NULL,
  "industry" VARCHAR(32) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ContentBrandShop_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ContentBrandShop_id_ownerId_key" ON "ContentBrandShop"("id","ownerId");
CREATE INDEX "ContentBrandShop_ownerId_createdAt_idx" ON "ContentBrandShop"("ownerId","createdAt");
ALTER TABLE "ContentBrandShop" ADD CONSTRAINT "ContentBrandShop_ownerId_fkey"
  FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ContentBrandProfile" (
  "id" TEXT NOT NULL,
  "shopId" TEXT NOT NULL,
  "revision" INTEGER NOT NULL DEFAULT 1,
  "data" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ContentBrandProfile_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ContentBrandProfile_shopId_key" ON "ContentBrandProfile"("shopId");
ALTER TABLE "ContentBrandProfile" ADD CONSTRAINT "ContentBrandProfile_shopId_fkey"
  FOREIGN KEY ("shopId") REFERENCES "ContentBrandShop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ContentBrandAsset" (
  "id" TEXT NOT NULL,
  "shopId" TEXT NOT NULL,
  "kind" VARCHAR(24) NOT NULL,
  "key" TEXT NOT NULL,
  "mime" VARCHAR(32) NOT NULL,
  "sha256" CHAR(64) NOT NULL,
  "byteSize" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ContentBrandAsset_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ContentBrandAsset_key_key" ON "ContentBrandAsset"("key");
CREATE INDEX "ContentBrandAsset_shopId_createdAt_idx" ON "ContentBrandAsset"("shopId","createdAt");
ALTER TABLE "ContentBrandAsset" ADD CONSTRAINT "ContentBrandAsset_shopId_fkey"
  FOREIGN KEY ("shopId") REFERENCES "ContentBrandShop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
