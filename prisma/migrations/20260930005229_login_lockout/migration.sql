-- AlterTable
ALTER TABLE "User" ADD COLUMN     "loginFailures" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "loginLockedUntil" TIMESTAMP(3);
