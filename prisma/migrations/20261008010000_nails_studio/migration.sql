-- CreateTable
CREATE TABLE "Studio" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" VARCHAR(64) NOT NULL,
    "timeZone" VARCHAR(64) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Studio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Studio_ownerId_key" ON "Studio"("ownerId");

-- AddForeignKey
ALTER TABLE "Studio" ADD CONSTRAINT "Studio_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- The DAL sets this identity transaction-locally from the authenticated session.
-- Production runtime roles must be NOSUPERUSER NOBYPASSRLS.
ALTER TABLE "Studio" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Studio" FORCE ROW LEVEL SECURITY;
CREATE POLICY "studio_owner" ON "Studio"
    USING ("ownerId" = current_setting('app.studio_owner_id', true))
    WITH CHECK ("ownerId" = current_setting('app.studio_owner_id', true));
