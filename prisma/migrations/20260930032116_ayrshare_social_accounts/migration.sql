-- CreateEnum
CREATE TYPE "PublishStatus" AS ENUM ('PENDING', 'SUCCESS', 'PARTIAL', 'FAILED');

-- AlterTable
ALTER TABLE "Design" ADD COLUMN     "ayrsharePostId" TEXT,
ADD COLUMN     "caption" TEXT,
ADD COLUMN     "exportedImageUrl" TEXT,
ADD COLUMN     "publishError" TEXT,
ADD COLUMN     "publishStatus" "PublishStatus";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "ayrshareProfileKeyEnc" TEXT,
ADD COLUMN     "ayrshareRefId" TEXT;

-- CreateTable
CREATE TABLE "SocialAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "platform" VARCHAR(32) NOT NULL,
    "handle" VARCHAR(128),
    "connectedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialAccount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SocialAccount_userId_platform_key" ON "SocialAccount"("userId", "platform");

-- AddForeignKey
ALTER TABLE "SocialAccount" ADD CONSTRAINT "SocialAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
