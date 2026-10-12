CREATE TYPE "DemoTrialGenerationStatus" AS ENUM ('RESERVED', 'SUCCEEDED', 'FAILED');

CREATE TABLE "DemoTrialGeneration" (
    "id" TEXT NOT NULL,
    "industry" VARCHAR(32) NOT NULL,
    "visitorHash" CHAR(64) NOT NULL,
    "ipHash" CHAR(64) NOT NULL,
    "phoneHash" CHAR(64),
    "idempotencyKey" CHAR(64) NOT NULL,
    "status" "DemoTrialGenerationStatus" NOT NULL DEFAULT 'RESERVED',
    "quality" VARCHAR(8) NOT NULL DEFAULT 'medium',
    "costMicros" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "DemoTrialGeneration_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DemoTrialOverride" (
    "id" TEXT NOT NULL,
    "tokenHash" CHAR(64) NOT NULL,
    "reason" VARCHAR(255),
    "createdById" VARCHAR(64) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),

    CONSTRAINT "DemoTrialOverride_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DemoTrialGeneration_idempotencyKey_key" ON "DemoTrialGeneration"("idempotencyKey");
CREATE INDEX "DemoTrialGeneration_visitorHash_createdAt_idx" ON "DemoTrialGeneration"("visitorHash", "createdAt");
CREATE INDEX "DemoTrialGeneration_ipHash_createdAt_idx" ON "DemoTrialGeneration"("ipHash", "createdAt");
CREATE INDEX "DemoTrialGeneration_phoneHash_createdAt_idx" ON "DemoTrialGeneration"("phoneHash", "createdAt");
CREATE INDEX "DemoTrialGeneration_status_createdAt_idx" ON "DemoTrialGeneration"("status", "createdAt");
CREATE UNIQUE INDEX "DemoTrialOverride_tokenHash_key" ON "DemoTrialOverride"("tokenHash");
CREATE INDEX "DemoTrialOverride_expiresAt_consumedAt_idx" ON "DemoTrialOverride"("expiresAt", "consumedAt");
