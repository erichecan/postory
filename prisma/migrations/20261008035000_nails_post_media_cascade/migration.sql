-- DropForeignKey
ALTER TABLE "NailsPostMedia" DROP CONSTRAINT "NailsPostMedia_mediaAssetId_fkey";

-- AddForeignKey
ALTER TABLE "NailsPostMedia" ADD CONSTRAINT "NailsPostMedia_mediaAssetId_fkey" FOREIGN KEY ("mediaAssetId") REFERENCES "MediaAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
