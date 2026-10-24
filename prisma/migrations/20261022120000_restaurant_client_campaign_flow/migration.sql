CREATE TYPE "RestaurantBriefStatus" AS ENUM ('SUBMITTED', 'IN_REVIEW', 'IN_PRODUCTION', 'AWAITING_CLIENT', 'ACTIVE', 'CLOSED');

CREATE TYPE "RestaurantContentStatus" AS ENUM ('AWAITING_APPROVAL', 'REVISION_REQUESTED', 'APPROVED', 'SCHEDULED', 'PUBLISHED', 'FAILED');

CREATE TABLE "RestaurantCampaignBrief" (
    "id" TEXT NOT NULL,
    "referralUserId" TEXT,
    "clientUserId" TEXT,
    "token" VARCHAR(64) NOT NULL,
    "status" "RestaurantBriefStatus" NOT NULL DEFAULT 'SUBMITTED',
    "contactName" VARCHAR(100) NOT NULL,
    "contactEmail" VARCHAR(254) NOT NULL,
    "contactPhone" VARCHAR(32),
    "businessName" VARCHAR(128) NOT NULL,
    "location" VARCHAR(160) NOT NULL,
    "websiteUrl" TEXT,
    "campaignDirection" VARCHAR(40) NOT NULL,
    "campaignGoal" VARCHAR(40) NOT NULL,
    "campaignDetails" TEXT NOT NULL,
    "campaignStartDate" DATE,
    "campaignEndDate" DATE,
    "preferredPostWindow" VARCHAR(24) NOT NULL,
    "timeZone" VARCHAR(64) NOT NULL DEFAULT 'Europe/Dublin',
    "platforms" TEXT[] NOT NULL,
    "languagePreference" VARCHAR(8) NOT NULL DEFAULT 'en',
    "internalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RestaurantCampaignBrief_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RestaurantCampaignReference" (
    "id" TEXT NOT NULL,
    "briefId" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mimeType" VARCHAR(32) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RestaurantCampaignReference_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RestaurantCampaignContent" (
    "id" TEXT NOT NULL,
    "briefId" TEXT NOT NULL,
    "title" VARCHAR(128) NOT NULL,
    "caption" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mimeType" VARCHAR(32) NOT NULL,
    "platforms" TEXT[] NOT NULL,
    "scheduledAt" TIMESTAMP(3),
    "status" "RestaurantContentStatus" NOT NULL DEFAULT 'AWAITING_APPROVAL',
    "revisionNote" TEXT,
    "publishStatus" "PublishStatus",
    "publishError" TEXT,
    "providerPostId" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RestaurantCampaignContent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RestaurantCampaignBrief_token_key" ON "RestaurantCampaignBrief"("token");
CREATE INDEX "RestaurantCampaignBrief_status_createdAt_idx" ON "RestaurantCampaignBrief"("status", "createdAt");
CREATE INDEX "RestaurantCampaignBrief_referralUserId_createdAt_idx" ON "RestaurantCampaignBrief"("referralUserId", "createdAt");
CREATE INDEX "RestaurantCampaignBrief_contactEmail_idx" ON "RestaurantCampaignBrief"("contactEmail");
CREATE UNIQUE INDEX "RestaurantCampaignReference_storageKey_key" ON "RestaurantCampaignReference"("storageKey");
CREATE INDEX "RestaurantCampaignReference_briefId_idx" ON "RestaurantCampaignReference"("briefId");
CREATE UNIQUE INDEX "RestaurantCampaignContent_storageKey_key" ON "RestaurantCampaignContent"("storageKey");
CREATE INDEX "RestaurantCampaignContent_briefId_createdAt_idx" ON "RestaurantCampaignContent"("briefId", "createdAt");
CREATE INDEX "RestaurantCampaignContent_status_scheduledAt_idx" ON "RestaurantCampaignContent"("status", "scheduledAt");

ALTER TABLE "RestaurantCampaignBrief" ADD CONSTRAINT "RestaurantCampaignBrief_referralUserId_fkey" FOREIGN KEY ("referralUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RestaurantCampaignBrief" ADD CONSTRAINT "RestaurantCampaignBrief_clientUserId_fkey" FOREIGN KEY ("clientUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RestaurantCampaignReference" ADD CONSTRAINT "RestaurantCampaignReference_briefId_fkey" FOREIGN KEY ("briefId") REFERENCES "RestaurantCampaignBrief"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RestaurantCampaignContent" ADD CONSTRAINT "RestaurantCampaignContent_briefId_fkey" FOREIGN KEY ("briefId") REFERENCES "RestaurantCampaignBrief"("id") ON DELETE CASCADE ON UPDATE CASCADE;
