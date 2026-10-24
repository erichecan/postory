CREATE TYPE "RestaurantPlanItemStatus" AS ENUM ('PLANNED', 'IN_PRODUCTION', 'AWAITING_APPROVAL', 'APPROVED', 'SCHEDULED', 'PUBLISHED', 'FAILED');

CREATE TABLE "RestaurantMarketingPlan" (
    "id" TEXT NOT NULL,
    "briefId" TEXT NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "overview" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "cadence" VARCHAR(160) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RestaurantMarketingPlan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RestaurantMarketingPlanItem" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "scheduledTime" VARCHAR(8),
    "title" VARCHAR(160) NOT NULL,
    "theme" VARCHAR(160) NOT NULL,
    "objective" TEXT NOT NULL,
    "concept" TEXT NOT NULL,
    "platforms" TEXT[] NOT NULL,
    "status" "RestaurantPlanItemStatus" NOT NULL DEFAULT 'PLANNED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RestaurantMarketingPlanItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RestaurantPlanItemSubmission" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "planItemId" TEXT,
    "date" DATE NOT NULL,
    "clientUserId" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RestaurantPlanItemSubmission_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "RestaurantCampaignContent" ADD COLUMN "planItemId" TEXT;
ALTER TABLE "RestaurantCampaignReference" ADD COLUMN "submissionId" TEXT;

CREATE UNIQUE INDEX "RestaurantMarketingPlan_briefId_key" ON "RestaurantMarketingPlan"("briefId");
CREATE INDEX "RestaurantMarketingPlanItem_planId_date_idx" ON "RestaurantMarketingPlanItem"("planId", "date");
CREATE INDEX "RestaurantMarketingPlanItem_status_date_idx" ON "RestaurantMarketingPlanItem"("status", "date");
CREATE INDEX "RestaurantPlanItemSubmission_planId_date_createdAt_idx" ON "RestaurantPlanItemSubmission"("planId", "date", "createdAt");
CREATE INDEX "RestaurantPlanItemSubmission_planItemId_createdAt_idx" ON "RestaurantPlanItemSubmission"("planItemId", "createdAt");
CREATE INDEX "RestaurantPlanItemSubmission_clientUserId_createdAt_idx" ON "RestaurantPlanItemSubmission"("clientUserId", "createdAt");
CREATE UNIQUE INDEX "RestaurantCampaignContent_planItemId_key" ON "RestaurantCampaignContent"("planItemId");

ALTER TABLE "RestaurantMarketingPlan" ADD CONSTRAINT "RestaurantMarketingPlan_briefId_fkey" FOREIGN KEY ("briefId") REFERENCES "RestaurantCampaignBrief"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RestaurantMarketingPlanItem" ADD CONSTRAINT "RestaurantMarketingPlanItem_planId_fkey" FOREIGN KEY ("planId") REFERENCES "RestaurantMarketingPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RestaurantPlanItemSubmission" ADD CONSTRAINT "RestaurantPlanItemSubmission_planId_fkey" FOREIGN KEY ("planId") REFERENCES "RestaurantMarketingPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RestaurantPlanItemSubmission" ADD CONSTRAINT "RestaurantPlanItemSubmission_planItemId_fkey" FOREIGN KEY ("planItemId") REFERENCES "RestaurantMarketingPlanItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RestaurantPlanItemSubmission" ADD CONSTRAINT "RestaurantPlanItemSubmission_clientUserId_fkey" FOREIGN KEY ("clientUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RestaurantCampaignReference" ADD CONSTRAINT "RestaurantCampaignReference_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "RestaurantPlanItemSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RestaurantCampaignContent" ADD CONSTRAINT "RestaurantCampaignContent_planItemId_fkey" FOREIGN KEY ("planItemId") REFERENCES "RestaurantMarketingPlanItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
