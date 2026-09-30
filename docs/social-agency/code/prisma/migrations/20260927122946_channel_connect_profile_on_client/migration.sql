/*
  Warnings:

  - You are about to drop the column `ayrshareProfileKeyEncrypted` on the `ConnectedChannel` table. All the data in the column will be lost.
  - You are about to drop the column `ayrshareRefId` on the `ConnectedChannel` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "ayrshareProfileKeyEncrypted" TEXT,
ADD COLUMN     "ayrshareRefId" TEXT;

-- AlterTable
ALTER TABLE "ConnectedChannel" DROP COLUMN "ayrshareProfileKeyEncrypted",
DROP COLUMN "ayrshareRefId";
