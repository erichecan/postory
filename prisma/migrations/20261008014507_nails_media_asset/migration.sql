-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" TEXT NOT NULL,
    "studioId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "mimeType" VARCHAR(32) NOT NULL,
    "byteSize" INTEGER NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MediaAsset_key_key" ON "MediaAsset"("key");

-- CreateIndex
CREATE INDEX "MediaAsset_studioId_createdAt_idx" ON "MediaAsset"("studioId", "createdAt");

-- AddForeignKey
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Same RLS convention as Studio: the DAL sets app.studio_owner_id transaction-locally from the
-- authenticated session. Production runtime roles must be NOSUPERUSER NOBYPASSRLS.
ALTER TABLE "MediaAsset" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MediaAsset" FORCE ROW LEVEL SECURITY;
CREATE POLICY "media_asset_owner" ON "MediaAsset"
    USING ("studioId" IN (SELECT "id" FROM "Studio" WHERE "ownerId" = current_setting('app.studio_owner_id', true)))
    WITH CHECK ("studioId" IN (SELECT "id" FROM "Studio" WHERE "ownerId" = current_setting('app.studio_owner_id', true)));
