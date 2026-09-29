-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('EUR', 'CAD');

-- CreateEnum
CREATE TYPE "PlanStatus" AS ENUM ('DRAFT', 'PENDING_PAYMENT', 'ACTIVE', 'PAST_DUE', 'CANCELED');

-- CreateEnum
CREATE TYPE "PlanBilling" AS ENUM ('STRIPE', 'OFFLINE');

-- CreateEnum
CREATE TYPE "GrantSource" AS ENUM ('SIGNUP_GIFT', 'MONTHLY', 'TOPUP', 'ADMIN', 'REFUND_RETURN');

-- CreateEnum
CREATE TYPE "GrantScope" AS ENUM ('ANY', 'TEMPLATE_ONLY');

-- CreateEnum
CREATE TYPE "GrantUnit" AS ENUM ('CREDIT', 'VIDEO');

-- CreateEnum
CREATE TYPE "TxnKind" AS ENUM ('GRANT', 'DEBIT', 'REFUND', 'EXPIRE', 'ADJUST');

-- CreateEnum
CREATE TYPE "ChargeKind" AS ENUM ('TEMPLATE_EXPORT', 'AI_STANDARD', 'AI_HD');

-- CreateEnum
CREATE TYPE "GenerationMode" AS ENUM ('PHOTO_ENHANCE', 'TEXT_TO_IMAGE');

-- CreateEnum
CREATE TYPE "GenerationStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED');

-- AlterTable
ALTER TABLE "Design" ADD COLUMN     "chargedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "email" VARCHAR(254),
ADD COLUMN     "emailVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "stripeCustomerId" TEXT,
ALTER COLUMN "phone" DROP NOT NULL;

-- CreateTable
CREATE TABLE "EmailToken" (
    "id" TEXT NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "purpose" VARCHAR(16) NOT NULL,
    "codeHash" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MembershipTier" (
    "id" TEXT NOT NULL,
    "slug" VARCHAR(32) NOT NULL,
    "nameZh" VARCHAR(64) NOT NULL,
    "nameEn" VARCHAR(64) NOT NULL,
    "taglineZh" VARCHAR(64) NOT NULL,
    "taglineEn" VARCHAR(64) NOT NULL,
    "benefitsZh" TEXT[],
    "benefitsEn" TEXT[],
    "features" JSONB NOT NULL,
    "defaultMonthlyCredits" INTEGER NOT NULL DEFAULT 60,
    "defaultMonthlyVideos" INTEGER NOT NULL DEFAULT 4,
    "referenceFee" INTEGER NOT NULL DEFAULT 9900,
    "recommended" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "visible" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "MembershipTier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerPlan" (
    "userId" TEXT NOT NULL,
    "tierId" TEXT NOT NULL,
    "currency" "Currency" NOT NULL,
    "billing" "PlanBilling" NOT NULL DEFAULT 'STRIPE',
    "baseFee" INTEGER NOT NULL,
    "extraPlatforms" TEXT[],
    "extraPlatformFee" INTEGER NOT NULL,
    "allInclusiveFee" INTEGER,
    "monthlyCredits" INTEGER NOT NULL,
    "monthlyVideos" INTEGER NOT NULL,
    "topupUnitPrice" INTEGER NOT NULL DEFAULT 100,
    "status" "PlanStatus" NOT NULL DEFAULT 'DRAFT',
    "stripeSubscriptionId" TEXT,
    "currentPeriodEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerPlan_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "CreditGrant" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "unit" "GrantUnit" NOT NULL DEFAULT 'CREDIT',
    "source" "GrantSource" NOT NULL,
    "scope" "GrantScope" NOT NULL DEFAULT 'ANY',
    "amount" INTEGER NOT NULL,
    "remaining" INTEGER NOT NULL,
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "refId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditGrant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditTxn" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" "TxnKind" NOT NULL,
    "charge" "ChargeKind",
    "source" "GrantSource",
    "delta" INTEGER NOT NULL,
    "allocations" JSONB,
    "refId" TEXT,
    "note" VARCHAR(255),
    "actorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditTxn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Generation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "parentId" TEXT,
    "mode" "GenerationMode" NOT NULL,
    "quality" VARCHAR(8) NOT NULL,
    "size" VARCHAR(16) NOT NULL,
    "userPrompt" TEXT NOT NULL,
    "finalPrompt" TEXT,
    "inputUrl" TEXT,
    "outputUrl" TEXT,
    "credits" INTEGER NOT NULL,
    "costMicros" INTEGER,
    "status" "GenerationStatus" NOT NULL DEFAULT 'PENDING',
    "error" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Generation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StripeEvent" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StripeEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmailToken_email_purpose_idx" ON "EmailToken"("email", "purpose");

-- CreateIndex
CREATE UNIQUE INDEX "MembershipTier_slug_key" ON "MembershipTier"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerPlan_stripeSubscriptionId_key" ON "CustomerPlan"("stripeSubscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "CreditGrant_refId_key" ON "CreditGrant"("refId");

-- CreateIndex
CREATE INDEX "CreditGrant_userId_unit_expiresAt_idx" ON "CreditGrant"("userId", "unit", "expiresAt");

-- CreateIndex
CREATE INDEX "CreditTxn_userId_createdAt_idx" ON "CreditTxn"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CreditTxn_userId_kind_refId_key" ON "CreditTxn"("userId", "kind", "refId");

-- CreateIndex
CREATE INDEX "Generation_userId_createdAt_idx" ON "Generation"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Generation_status_createdAt_idx" ON "Generation"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_stripeCustomerId_key" ON "User"("stripeCustomerId");

-- AddForeignKey
ALTER TABLE "CustomerPlan" ADD CONSTRAINT "CustomerPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerPlan" ADD CONSTRAINT "CustomerPlan_tierId_fkey" FOREIGN KEY ("tierId") REFERENCES "MembershipTier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditGrant" ADD CONSTRAINT "CreditGrant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditTxn" ADD CONSTRAINT "CreditTxn_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Generation" ADD CONSTRAINT "Generation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 发布平台存储值改为 id
UPDATE "Design" SET "platforms" = (
  SELECT COALESCE(array_agg(DISTINCT CASE p
    WHEN '小红书' THEN 'xiaohongshu'
    WHEN '微信朋友圈' THEN 'wechat-moments'
    WHEN '抖音' THEN 'douyin'
    WHEN 'Instagram' THEN 'instagram'
    WHEN 'Facebook' THEN 'facebook'
    WHEN 'X / Twitter' THEN 'x'
    ELSE p END), '{}')
  FROM unnest("platforms") AS p
) WHERE cardinality("platforms") > 0;
