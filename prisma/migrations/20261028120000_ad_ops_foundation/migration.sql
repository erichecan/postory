CREATE TYPE "AdOpsPlatformAccountStatus" AS ENUM ('NOT_CONNECTED', 'AUTHORIZATION_PENDING', 'AUTHORIZED', 'EXPIRED', 'REVOKED');
CREATE TYPE "AdOpsTaskStatus" AS ENUM ('DRAFT', 'PREFLIGHT_BLOCKED', 'NEEDS_APPROVAL', 'READY', 'SIMULATED_RUNNING', 'PAUSED', 'COMPLETED', 'CANCELLED');
CREATE TYPE "AdOpsApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CHANGES_REQUESTED');

CREATE TABLE "AdOpsClientProfile" (
    "id" TEXT NOT NULL,
    "agencyUserId" TEXT NOT NULL,
    "clientUserId" TEXT NOT NULL,
    "objective" VARCHAR(40) NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'EUR',
    "monthlyBudgetMinor" INTEGER NOT NULL,
    "dailyBudgetMinor" INTEGER NOT NULL,
    "serviceArea" VARCHAR(255) NOT NULL,
    "excludedAreas" VARCHAR(500),
    "timeZone" VARCHAR(64) NOT NULL DEFAULT 'Europe/Dublin',
    "recommendedPlatforms" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "approvedOfferTypes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "autoRunInPolicy" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AdOpsClientProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdOpsPlatformAccount" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "platform" VARCHAR(32) NOT NULL,
    "externalAccountId" VARCHAR(128),
    "displayName" VARCHAR(128),
    "status" "AdOpsPlatformAccountStatus" NOT NULL DEFAULT 'NOT_CONNECTED',
    "authorizedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AdOpsPlatformAccount_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdOpsPromotionTask" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "platformAccountId" TEXT,
    "contentDesignId" TEXT,
    "title" VARCHAR(160) NOT NULL,
    "objective" VARCHAR(40) NOT NULL,
    "platform" VARCHAR(32) NOT NULL,
    "offerType" VARCHAR(40) NOT NULL,
    "offerTitle" VARCHAR(160) NOT NULL,
    "offerDetails" TEXT NOT NULL,
    "startsAt" DATE NOT NULL,
    "endsAt" DATE NOT NULL,
    "dailyBudgetMinor" INTEGER NOT NULL,
    "totalBudgetMinor" INTEGER NOT NULL,
    "serviceAreaSnapshot" VARCHAR(255) NOT NULL,
    "audienceRecommendation" VARCHAR(500) NOT NULL,
    "creativeCopy" TEXT NOT NULL,
    "creativeSource" VARCHAR(160),
    "destinationType" VARCHAR(32) NOT NULL,
    "destinationUrl" TEXT,
    "redemptionInstructions" TEXT,
    "preflight" JSONB,
    "status" "AdOpsTaskStatus" NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "autoApproved" BOOLEAN NOT NULL DEFAULT false,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AdOpsPromotionTask_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdOpsTaskApproval" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "taskVersion" INTEGER NOT NULL,
    "status" "AdOpsApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "reason" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "decidedById" TEXT,
    "decisionNote" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMP(3),
    CONSTRAINT "AdOpsTaskApproval_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdOpsMetricSnapshot" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "periodStart" DATE NOT NULL,
    "periodEnd" DATE NOT NULL,
    "spendMinor" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "voucherClaims" INTEGER NOT NULL DEFAULT 0,
    "confirmedBookings" INTEGER NOT NULL DEFAULT 0,
    "redemptions" INTEGER NOT NULL DEFAULT 0,
    "salesMinor" INTEGER,
    "dataSource" VARCHAR(40) NOT NULL,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdOpsMetricSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdOpsAuditEvent" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "taskId" TEXT,
    "actorUserId" TEXT NOT NULL,
    "action" VARCHAR(48) NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdOpsAuditEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AdOpsClientProfile_agencyUserId_clientUserId_key" ON "AdOpsClientProfile"("agencyUserId", "clientUserId");
CREATE INDEX "AdOpsClientProfile_agencyUserId_updatedAt_idx" ON "AdOpsClientProfile"("agencyUserId", "updatedAt");
CREATE INDEX "AdOpsClientProfile_clientUserId_updatedAt_idx" ON "AdOpsClientProfile"("clientUserId", "updatedAt");
CREATE UNIQUE INDEX "AdOpsPlatformAccount_profileId_platform_externalAccountId_key" ON "AdOpsPlatformAccount"("profileId", "platform", "externalAccountId");
CREATE INDEX "AdOpsPlatformAccount_profileId_status_idx" ON "AdOpsPlatformAccount"("profileId", "status");
CREATE INDEX "AdOpsPromotionTask_profileId_status_startsAt_idx" ON "AdOpsPromotionTask"("profileId", "status", "startsAt");
CREATE INDEX "AdOpsPromotionTask_createdByUserId_createdAt_idx" ON "AdOpsPromotionTask"("createdByUserId", "createdAt");
CREATE UNIQUE INDEX "AdOpsTaskApproval_taskId_taskVersion_key" ON "AdOpsTaskApproval"("taskId", "taskVersion");
CREATE INDEX "AdOpsTaskApproval_status_requestedAt_idx" ON "AdOpsTaskApproval"("status", "requestedAt");
CREATE UNIQUE INDEX "AdOpsMetricSnapshot_taskId_periodStart_periodEnd_dataSource_key" ON "AdOpsMetricSnapshot"("taskId", "periodStart", "periodEnd", "dataSource");
CREATE INDEX "AdOpsMetricSnapshot_taskId_periodEnd_idx" ON "AdOpsMetricSnapshot"("taskId", "periodEnd");
CREATE INDEX "AdOpsAuditEvent_profileId_createdAt_idx" ON "AdOpsAuditEvent"("profileId", "createdAt");
CREATE INDEX "AdOpsAuditEvent_taskId_createdAt_idx" ON "AdOpsAuditEvent"("taskId", "createdAt");

ALTER TABLE "AdOpsClientProfile" ADD CONSTRAINT "AdOpsClientProfile_agencyUserId_fkey" FOREIGN KEY ("agencyUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdOpsClientProfile" ADD CONSTRAINT "AdOpsClientProfile_clientUserId_fkey" FOREIGN KEY ("clientUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdOpsPlatformAccount" ADD CONSTRAINT "AdOpsPlatformAccount_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "AdOpsClientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdOpsPromotionTask" ADD CONSTRAINT "AdOpsPromotionTask_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "AdOpsClientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdOpsPromotionTask" ADD CONSTRAINT "AdOpsPromotionTask_platformAccountId_fkey" FOREIGN KEY ("platformAccountId") REFERENCES "AdOpsPlatformAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AdOpsPromotionTask" ADD CONSTRAINT "AdOpsPromotionTask_contentDesignId_fkey" FOREIGN KEY ("contentDesignId") REFERENCES "Design"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AdOpsPromotionTask" ADD CONSTRAINT "AdOpsPromotionTask_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdOpsTaskApproval" ADD CONSTRAINT "AdOpsTaskApproval_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "AdOpsPromotionTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdOpsTaskApproval" ADD CONSTRAINT "AdOpsTaskApproval_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdOpsTaskApproval" ADD CONSTRAINT "AdOpsTaskApproval_decidedById_fkey" FOREIGN KEY ("decidedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AdOpsMetricSnapshot" ADD CONSTRAINT "AdOpsMetricSnapshot_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "AdOpsPromotionTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdOpsAuditEvent" ADD CONSTRAINT "AdOpsAuditEvent_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "AdOpsClientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdOpsAuditEvent" ADD CONSTRAINT "AdOpsAuditEvent_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "AdOpsPromotionTask"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AdOpsAuditEvent" ADD CONSTRAINT "AdOpsAuditEvent_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AdOpsClientProfile" ADD COLUMN "clientConfirmedAt" TIMESTAMP(3);
