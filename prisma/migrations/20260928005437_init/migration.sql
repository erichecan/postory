-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "AccountSource" AS ENUM ('SELF_SIGNUP', 'OFFLINE');

-- CreateEnum
CREATE TYPE "DesignStatus" AS ENUM ('DRAFT', 'SCHEDULED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" VARCHAR(64) NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "source" "AccountSource" NOT NULL DEFAULT 'SELF_SIGNUP',
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrandProfile" (
    "userId" TEXT NOT NULL,
    "shopName" VARCHAR(64),
    "wechat" VARCHAR(64),
    "phone" VARCHAR(20),
    "address" VARCHAR(255),
    "logoUrl" TEXT,
    "slogan" VARCHAR(255),
    "activity" TEXT,

    CONSTRAINT "BrandProfile_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "Template" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "platform" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "thumbnails" TEXT[],
    "pages" JSONB NOT NULL,
    "editable" BOOLEAN NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "Template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Design" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "title" VARCHAR(128) NOT NULL,
    "pages" JSONB NOT NULL,
    "platforms" TEXT[],
    "scheduledAt" TIMESTAMP(3),
    "status" "DesignStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Design_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE INDEX "Template_platform_sortOrder_idx" ON "Template"("platform", "sortOrder");

-- CreateIndex
CREATE INDEX "Design_userId_updatedAt_idx" ON "Design"("userId", "updatedAt");

-- AddForeignKey
ALTER TABLE "BrandProfile" ADD CONSTRAINT "BrandProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Design" ADD CONSTRAINT "Design_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Design" ADD CONSTRAINT "Design_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
