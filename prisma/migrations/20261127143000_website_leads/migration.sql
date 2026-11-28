CREATE TYPE "WebsiteLeadType" AS ENUM ('SHOP', 'PARTNER');

CREATE TABLE "WebsiteLead" (
    "id" TEXT NOT NULL,
    "type" "WebsiteLeadType" NOT NULL,
    "businessName" VARCHAR(160) NOT NULL,
    "contactName" VARCHAR(128) NOT NULL,
    "industry" VARCHAR(128),
    "email" VARCHAR(254) NOT NULL,
    "phone" VARCHAR(40) NOT NULL,
    "location" VARCHAR(255) NOT NULL,
    "platforms" VARCHAR(255),
    "socialOrClientCount" VARCHAR(255),
    "googleReviewUrl" VARCHAR(500),
    "notes" TEXT,
    "experienceConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WebsiteLead_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WebsiteLead_createdAt_idx" ON "WebsiteLead"("createdAt");
CREATE INDEX "WebsiteLead_type_createdAt_idx" ON "WebsiteLead"("type", "createdAt");
