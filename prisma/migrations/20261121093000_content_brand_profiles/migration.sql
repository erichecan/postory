CREATE TABLE "ContentBrandProfile" (
  "id" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  "industry" VARCHAR(32) NOT NULL,
  "revision" INTEGER NOT NULL DEFAULT 1,
  "data" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ContentBrandProfile_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ContentBrandProfile_ownerId_key" ON "ContentBrandProfile"("ownerId");
ALTER TABLE "ContentBrandProfile" ADD CONSTRAINT "ContentBrandProfile_ownerId_fkey"
  FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ContentBrandAsset" (
  "id" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  "kind" VARCHAR(24) NOT NULL,
  "key" TEXT NOT NULL,
  "mime" VARCHAR(32) NOT NULL,
  "sha256" CHAR(64) NOT NULL,
  "byteSize" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ContentBrandAsset_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ContentBrandAsset_key_key" ON "ContentBrandAsset"("key");
CREATE INDEX "ContentBrandAsset_ownerId_createdAt_idx" ON "ContentBrandAsset"("ownerId", "createdAt");
ALTER TABLE "ContentBrandAsset" ADD CONSTRAINT "ContentBrandAsset_ownerId_fkey"
  FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
