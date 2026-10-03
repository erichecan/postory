-- CreateEnum
CREATE TYPE "Industry" AS ENUM ('FOOD_TAKEAWAY', 'BEAUTY_HAIR', 'FITNESS', 'PHONE_REPAIR', 'OTHER');

-- CreateEnum
CREATE TYPE "Country" AS ENUM ('IE', 'CA');

-- CreateEnum
CREATE TYPE "EventRegion" AS ENUM ('IE', 'CA', 'BOTH', 'CHINESE_COMMUNITY');

-- CreateEnum
CREATE TYPE "PromoMechanism" AS ENUM ('OFF_PEAK_DISCOUNT', 'LOYALTY_POINTS', 'BOUNCE_BACK_COUPON', 'REFERRAL', 'BUNDLE_PREPAID', 'LIMITED_TIME', 'BIRTHDAY_PERK', 'OWN_CHANNEL_DISCOUNT');

-- CreateEnum
CREATE TYPE "CalendarSlotStatus" AS ENUM ('SUGGESTED', 'CONFIRMED', 'DESIGN_CREATED', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "ApprovalChannel" AS ENUM ('WHATSAPP');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'AUTO_APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "OutreachType" AS ENUM ('WELCOME', 'THANK_YOU', 'BIRTHDAY', 'RENEWAL_REMINDER', 'WINBACK_1', 'WINBACK_2', 'WINBACK_3');

-- CreateEnum
CREATE TYPE "OutreachChannel" AS ENUM ('EMAIL', 'SMS');

-- CreateEnum
CREATE TYPE "OutreachStatus" AS ENUM ('SCHEDULED', 'SENT', 'SKIPPED');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'CONVERTED');

-- AlterTable
ALTER TABLE "BrandProfile" ADD COLUMN     "country" "Country",
ADD COLUMN     "industry" "Industry",
ADD COLUMN     "marketingEmailOptIn" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "marketingSmsOptIn" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "whatsappNumber" VARCHAR(20);

-- CreateTable
CREATE TABLE "MarketingEvent" (
    "id" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "nameZh" VARCHAR(64) NOT NULL,
    "nameEn" VARCHAR(64) NOT NULL,
    "region" "EventRegion" NOT NULL,
    "industries" "Industry"[],
    "prepWeeks" INTEGER NOT NULL DEFAULT 0,
    "source" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketingEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignTemplate" (
    "id" TEXT NOT NULL,
    "industry" "Industry" NOT NULL,
    "nameZh" VARCHAR(64) NOT NULL,
    "nameEn" VARCHAR(64) NOT NULL,
    "mechanism" "PromoMechanism" NOT NULL,
    "suggestedPostCount" INTEGER NOT NULL DEFAULT 1,
    "eventId" TEXT,
    "captionAngle" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CampaignTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendarSlot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "campaignTemplateId" TEXT,
    "eventId" TEXT,
    "weeklyRhythmTag" VARCHAR(32),
    "status" "CalendarSlotStatus" NOT NULL DEFAULT 'SUGGESTED',
    "designId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalRequest" (
    "id" TEXT NOT NULL,
    "calendarSlotId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "channel" "ApprovalChannel" NOT NULL DEFAULT 'WHATSAPP',
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "respondedAt" TIMESTAMP(3),
    "autoApproveAt" TIMESTAMP(3) NOT NULL,
    "providerMessageId" TEXT,

    CONSTRAINT "ApprovalRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutreachAutomation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endCustomerId" TEXT,
    "type" "OutreachType" NOT NULL,
    "channel" "OutreachChannel" NOT NULL,
    "triggerAt" TIMESTAMP(3) NOT NULL,
    "status" "OutreachStatus" NOT NULL DEFAULT 'SCHEDULED',
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OutreachAutomation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EndCustomer" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" VARCHAR(64),
    "email" VARCHAR(254),
    "phone" VARCHAR(20),
    "lastVisitAt" TIMESTAMP(3),
    "birthday" DATE,
    "source" VARCHAR(32),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EndCustomer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendarLead" (
    "id" TEXT NOT NULL,
    "shopName" VARCHAR(128) NOT NULL,
    "industry" "Industry" NOT NULL,
    "country" "Country" NOT NULL,
    "contactEmail" VARCHAR(254) NOT NULL,
    "contactPhone" VARCHAR(20),
    "generatedPreviewUrl" TEXT,
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CalendarLead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MarketingEvent_startDate_endDate_idx" ON "MarketingEvent"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "CampaignTemplate_industry_idx" ON "CampaignTemplate"("industry");

-- CreateIndex
CREATE UNIQUE INDEX "CalendarSlot_designId_key" ON "CalendarSlot"("designId");

-- CreateIndex
CREATE INDEX "CalendarSlot_userId_date_idx" ON "CalendarSlot"("userId", "date");

-- CreateIndex
CREATE INDEX "ApprovalRequest_status_autoApproveAt_idx" ON "ApprovalRequest"("status", "autoApproveAt");

-- CreateIndex
CREATE INDEX "OutreachAutomation_status_triggerAt_idx" ON "OutreachAutomation"("status", "triggerAt");

-- CreateIndex
CREATE INDEX "EndCustomer_userId_idx" ON "EndCustomer"("userId");

-- AddForeignKey
ALTER TABLE "CampaignTemplate" ADD CONSTRAINT "CampaignTemplate_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "MarketingEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarSlot" ADD CONSTRAINT "CalendarSlot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarSlot" ADD CONSTRAINT "CalendarSlot_campaignTemplateId_fkey" FOREIGN KEY ("campaignTemplateId") REFERENCES "CampaignTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarSlot" ADD CONSTRAINT "CalendarSlot_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "MarketingEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarSlot" ADD CONSTRAINT "CalendarSlot_designId_fkey" FOREIGN KEY ("designId") REFERENCES "Design"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_calendarSlotId_fkey" FOREIGN KEY ("calendarSlotId") REFERENCES "CalendarSlot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutreachAutomation" ADD CONSTRAINT "OutreachAutomation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutreachAutomation" ADD CONSTRAINT "OutreachAutomation_endCustomerId_fkey" FOREIGN KEY ("endCustomerId") REFERENCES "EndCustomer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EndCustomer" ADD CONSTRAINT "EndCustomer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
