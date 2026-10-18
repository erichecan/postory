-- CreateTable
CREATE TABLE "PartnerTrialReference" (
    "id" TEXT NOT NULL,
    "trialRequestId" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mimeType" VARCHAR(32) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PartnerTrialReference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PartnerTrialReference_storageKey_key" ON "PartnerTrialReference"("storageKey");

-- CreateIndex
CREATE INDEX "PartnerTrialReference_trialRequestId_idx" ON "PartnerTrialReference"("trialRequestId");

-- AddForeignKey
ALTER TABLE "PartnerTrialReference" ADD CONSTRAINT "PartnerTrialReference_trialRequestId_fkey" FOREIGN KEY ("trialRequestId") REFERENCES "PartnerTrialRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
