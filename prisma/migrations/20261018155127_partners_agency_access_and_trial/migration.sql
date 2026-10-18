-- CreateEnum
CREATE TYPE "PartnerTrialStatus" AS ENUM ('SUBMITTED', 'IN_PROGRESS', 'DELIVERED', 'CONVERTED');

-- CreateEnum
CREATE TYPE "PartnerTrialFeedbackCategory" AS ENUM ('STYLE', 'CONTENT_ACCURACY', 'REVISION_REQUEST');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ChargeKind" ADD VALUE 'VIDEO_STANDARD';
ALTER TYPE "ChargeKind" ADD VALUE 'VIDEO_OVERAGE';

-- AlterEnum
ALTER TYPE "GenerationMode" ADD VALUE 'VIDEO';

-- AlterTable
ALTER TABLE "Design" ADD COLUMN     "revisionCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Generation" ADD COLUMN     "durationSeconds" INTEGER;

-- CreateTable
CREATE TABLE "AgencyAccess" (
    "id" TEXT NOT NULL,
    "agencyUserId" TEXT NOT NULL,
    "clientUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgencyAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnerTrialRequest" (
    "id" TEXT NOT NULL,
    "agencyUserId" TEXT,
    "agencyName" VARCHAR(64) NOT NULL,
    "agencyContact" VARCHAR(128) NOT NULL,
    "clientBrandName" VARCHAR(128) NOT NULL,
    "industry" "Industry" NOT NULL,
    "country" "Country" NOT NULL,
    "productOrService" TEXT NOT NULL,
    "targetAudience" TEXT,
    "highlightNotes" TEXT,
    "platforms" TEXT[],
    "websiteUrl" TEXT,
    "socialHandles" JSONB,
    "languagePreference" VARCHAR(8) NOT NULL DEFAULT 'zh',
    "viewToken" VARCHAR(64) NOT NULL,
    "status" "PartnerTrialStatus" NOT NULL DEFAULT 'SUBMITTED',
    "convertedUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" TIMESTAMP(3),

    CONSTRAINT "PartnerTrialRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnerTrialAsset" (
    "id" TEXT NOT NULL,
    "trialRequestId" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "caption" TEXT,
    "platformVariants" JSONB NOT NULL,
    "revisionCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PartnerTrialAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnerTrialPlanItem" (
    "id" TEXT NOT NULL,
    "trialRequestId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "theme" VARCHAR(128) NOT NULL,
    "platform" VARCHAR(32) NOT NULL,
    "note" TEXT,

    CONSTRAINT "PartnerTrialPlanItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnerTrialFeedback" (
    "id" TEXT NOT NULL,
    "trialRequestId" TEXT NOT NULL,
    "category" "PartnerTrialFeedbackCategory" NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PartnerTrialFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AgencyAccess_clientUserId_idx" ON "AgencyAccess"("clientUserId");

-- CreateIndex
CREATE UNIQUE INDEX "AgencyAccess_agencyUserId_clientUserId_key" ON "AgencyAccess"("agencyUserId", "clientUserId");

-- CreateIndex
CREATE UNIQUE INDEX "PartnerTrialRequest_viewToken_key" ON "PartnerTrialRequest"("viewToken");

-- CreateIndex
CREATE UNIQUE INDEX "PartnerTrialRequest_convertedUserId_key" ON "PartnerTrialRequest"("convertedUserId");

-- CreateIndex
CREATE INDEX "PartnerTrialRequest_clientBrandName_agencyContact_idx" ON "PartnerTrialRequest"("clientBrandName", "agencyContact");

-- CreateIndex
CREATE INDEX "PartnerTrialRequest_status_createdAt_idx" ON "PartnerTrialRequest"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PartnerTrialAsset_storageKey_key" ON "PartnerTrialAsset"("storageKey");

-- CreateIndex
CREATE INDEX "PartnerTrialAsset_trialRequestId_idx" ON "PartnerTrialAsset"("trialRequestId");

-- CreateIndex
CREATE INDEX "PartnerTrialPlanItem_trialRequestId_date_idx" ON "PartnerTrialPlanItem"("trialRequestId", "date");

-- CreateIndex
CREATE INDEX "PartnerTrialFeedback_trialRequestId_createdAt_idx" ON "PartnerTrialFeedback"("trialRequestId", "createdAt");

-- AddForeignKey
ALTER TABLE "AgencyAccess" ADD CONSTRAINT "AgencyAccess_agencyUserId_fkey" FOREIGN KEY ("agencyUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgencyAccess" ADD CONSTRAINT "AgencyAccess_clientUserId_fkey" FOREIGN KEY ("clientUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerTrialRequest" ADD CONSTRAINT "PartnerTrialRequest_agencyUserId_fkey" FOREIGN KEY ("agencyUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerTrialAsset" ADD CONSTRAINT "PartnerTrialAsset_trialRequestId_fkey" FOREIGN KEY ("trialRequestId") REFERENCES "PartnerTrialRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerTrialPlanItem" ADD CONSTRAINT "PartnerTrialPlanItem_trialRequestId_fkey" FOREIGN KEY ("trialRequestId") REFERENCES "PartnerTrialRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerTrialFeedback" ADD CONSTRAINT "PartnerTrialFeedback_trialRequestId_fkey" FOREIGN KEY ("trialRequestId") REFERENCES "PartnerTrialRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
