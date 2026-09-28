-- DropForeignKey
ALTER TABLE "Design" DROP CONSTRAINT "Design_templateId_fkey";

-- AlterTable
ALTER TABLE "Design" ALTER COLUMN "templateId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Design" ADD CONSTRAINT "Design_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template"("id") ON DELETE SET NULL ON UPDATE CASCADE;
