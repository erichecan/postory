-- CreateEnum
CREATE TYPE "NailsPostStatus" AS ENUM ('DRAFT', 'EXPORTED', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "NailsPostTheme" AS ENUM ('SHOWCASE', 'OPEN_SLOTS', 'PROMOTION', 'DAILY');

-- CreateEnum
CREATE TYPE "NailsPostTemplate" AS ENUM ('WORK', 'SLOTS', 'PROMOTION');

-- CreateTable
CREATE TABLE "NailsPost" (
    "id" TEXT NOT NULL,
    "studioId" TEXT NOT NULL,
    "theme" "NailsPostTheme" NOT NULL DEFAULT 'SHOWCASE',
    "template" "NailsPostTemplate" NOT NULL DEFAULT 'WORK',
    "title" VARCHAR(100) NOT NULL DEFAULT '',
    "body" VARCHAR(3000) NOT NULL DEFAULT '',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "platform" VARCHAR(32) NOT NULL DEFAULT 'XIAOHONGSHU',
    "status" "NailsPostStatus" NOT NULL DEFAULT 'DRAFT',
    "aiGenerationCount" INTEGER NOT NULL DEFAULT 0,
    "exportedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NailsPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NailsPostMedia" (
    "postId" TEXT NOT NULL,
    "mediaAssetId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "NailsPostMedia_pkey" PRIMARY KEY ("postId","mediaAssetId")
);

-- CreateTable
CREATE TABLE "NailsPostAvailability" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "startAt" TIMESTAMPTZ(3) NOT NULL,
    "endAt" TIMESTAMPTZ(3) NOT NULL,
    "timeZone" VARCHAR(64) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NailsPostAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NailsPostExport" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mimeType" VARCHAR(32) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NailsPostExport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NailsPost_studioId_updatedAt_idx" ON "NailsPost"("studioId", "updatedAt");

-- CreateIndex
CREATE INDEX "NailsPost_studioId_status_createdAt_idx" ON "NailsPost"("studioId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "NailsPostMedia_mediaAssetId_idx" ON "NailsPostMedia"("mediaAssetId");

-- CreateIndex
CREATE UNIQUE INDEX "NailsPostMedia_postId_position_key" ON "NailsPostMedia"("postId", "position");

-- CreateIndex
CREATE INDEX "NailsPostAvailability_postId_startAt_idx" ON "NailsPostAvailability"("postId", "startAt");

-- CreateIndex
CREATE UNIQUE INDEX "NailsPostExport_storageKey_key" ON "NailsPostExport"("storageKey");

-- CreateIndex
CREATE INDEX "NailsPostExport_postId_createdAt_idx" ON "NailsPostExport"("postId", "createdAt");

-- AddForeignKey
ALTER TABLE "NailsPost" ADD CONSTRAINT "NailsPost_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NailsPostMedia" ADD CONSTRAINT "NailsPostMedia_postId_fkey" FOREIGN KEY ("postId") REFERENCES "NailsPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NailsPostMedia" ADD CONSTRAINT "NailsPostMedia_mediaAssetId_fkey" FOREIGN KEY ("mediaAssetId") REFERENCES "MediaAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NailsPostAvailability" ADD CONSTRAINT "NailsPostAvailability_postId_fkey" FOREIGN KEY ("postId") REFERENCES "NailsPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NailsPostExport" ADD CONSTRAINT "NailsPostExport_postId_fkey" FOREIGN KEY ("postId") REFERENCES "NailsPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;


ALTER TABLE "NailsPost" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "NailsPost" FORCE ROW LEVEL SECURITY;
CREATE POLICY "nails_post_owner" ON "NailsPost"
  USING ("studioId" IN (SELECT "id" FROM "Studio" WHERE "ownerId" = current_setting('app.studio_owner_id', true)))
  WITH CHECK ("studioId" IN (SELECT "id" FROM "Studio" WHERE "ownerId" = current_setting('app.studio_owner_id', true)));

ALTER TABLE "NailsPostMedia" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "NailsPostMedia" FORCE ROW LEVEL SECURITY;
CREATE POLICY "nails_post_media_owner" ON "NailsPostMedia"
  USING ("postId" IN (SELECT p."id" FROM "NailsPost" p JOIN "Studio" s ON s."id" = p."studioId" WHERE s."ownerId" = current_setting('app.studio_owner_id', true)))
  WITH CHECK ("postId" IN (SELECT p."id" FROM "NailsPost" p JOIN "Studio" s ON s."id" = p."studioId" WHERE s."ownerId" = current_setting('app.studio_owner_id', true)));

ALTER TABLE "NailsPostAvailability" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "NailsPostAvailability" FORCE ROW LEVEL SECURITY;
CREATE POLICY "nails_post_availability_owner" ON "NailsPostAvailability"
  USING ("postId" IN (SELECT p."id" FROM "NailsPost" p JOIN "Studio" s ON s."id" = p."studioId" WHERE s."ownerId" = current_setting('app.studio_owner_id', true)))
  WITH CHECK ("postId" IN (SELECT p."id" FROM "NailsPost" p JOIN "Studio" s ON s."id" = p."studioId" WHERE s."ownerId" = current_setting('app.studio_owner_id', true)));

ALTER TABLE "NailsPostExport" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "NailsPostExport" FORCE ROW LEVEL SECURITY;
CREATE POLICY "nails_post_export_owner" ON "NailsPostExport"
  USING ("postId" IN (SELECT p."id" FROM "NailsPost" p JOIN "Studio" s ON s."id" = p."studioId" WHERE s."ownerId" = current_setting('app.studio_owner_id', true)))
  WITH CHECK ("postId" IN (SELECT p."id" FROM "NailsPost" p JOIN "Studio" s ON s."id" = p."studioId" WHERE s."ownerId" = current_setting('app.studio_owner_id', true)));
