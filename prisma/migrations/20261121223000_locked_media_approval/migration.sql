-- Persist hashes of EXACT media bytes and the precise caption approved by a client.
ALTER TABLE "RestaurantCampaignContent"
  ADD COLUMN "sourceSha256" VARCHAR(64),
  ADD COLUMN "approvedSha256" VARCHAR(64),
  ADD COLUMN "approvedCaptionSha256" VARCHAR(64),
  ADD COLUMN "approvedAt" TIMESTAMP(3);

ALTER TABLE "Design"
  ADD COLUMN "approvedImageSha256" VARCHAR(64),
  ADD COLUMN "approvedCaptionSha256" VARCHAR(64),
  ADD COLUMN "approvedMediaUrl" TEXT,
  ADD COLUMN "approvedAt" TIMESTAMP(3);
