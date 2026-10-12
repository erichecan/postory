-- Appointment times are absolute instants. Business hours remain studio-local minutes.
CREATE TYPE "NailsAppointmentStatus" AS ENUM ('CONFIRMED', 'CANCELLED');

ALTER TABLE "Studio" ADD COLUMN "defaultDurationMinutes" INTEGER NOT NULL DEFAULT 60;

CREATE TABLE "BusinessHours" (
    "id" TEXT NOT NULL,
    "studioId" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL CHECK ("weekday" BETWEEN 0 AND 6),
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "startMinute" INTEGER NOT NULL DEFAULT 540 CHECK ("startMinute" BETWEEN 0 AND 1439),
    "endMinute" INTEGER NOT NULL DEFAULT 1080 CHECK ("endMinute" BETWEEN 1 AND 1440),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BusinessHours_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "BusinessHours_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BusinessHours_studioId_weekday_key" UNIQUE ("studioId", "weekday"),
    CONSTRAINT "BusinessHours_startBeforeEnd" CHECK ("isClosed" OR "startMinute" < "endMinute")
);

CREATE TABLE "ClosedPeriod" (
    "id" TEXT NOT NULL,
    "studioId" TEXT NOT NULL,
    "startAt" TIMESTAMPTZ(3) NOT NULL,
    "endAt" TIMESTAMPTZ(3) NOT NULL,
    "reason" VARCHAR(120),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ClosedPeriod_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ClosedPeriod_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ClosedPeriod_positiveDuration" CHECK ("startAt" < "endAt")
);
CREATE INDEX "ClosedPeriod_studioId_startAt_idx" ON "ClosedPeriod"("studioId", "startAt");

CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL,
    "studioId" TEXT NOT NULL,
    "startAt" TIMESTAMPTZ(3) NOT NULL,
    "endAt" TIMESTAMPTZ(3) NOT NULL,
    "clientName" VARCHAR(80) NOT NULL,
    "note" VARCHAR(280),
    "status" "NailsAppointmentStatus" NOT NULL DEFAULT 'CONFIRMED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Appointment_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Appointment_positiveDuration" CHECK ("startAt" < "endAt")
);
CREATE INDEX "Appointment_studioId_startAt_idx" ON "Appointment"("studioId", "startAt");

-- Database-level protection closes the concurrent check-then-insert race.
CREATE EXTENSION IF NOT EXISTS btree_gist;
ALTER TABLE "Appointment" ADD CONSTRAINT "appointment_no_overlap"
    EXCLUDE USING gist (
      "studioId" WITH =,
      tstzrange("startAt", "endAt", '[)') WITH &&
    ) WHERE ("status" = 'CONFIRMED');

-- Restrict all tenant data to the identity injected by the authenticated DAL.
DO $$
DECLARE table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['BusinessHours', 'ClosedPeriod', 'Appointment'] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', table_name);
    EXECUTE format(
      'CREATE POLICY %I ON %I USING ("studioId" IN (SELECT "id" FROM "Studio" WHERE "ownerId" = current_setting(''app.studio_owner_id'', true))) WITH CHECK ("studioId" IN (SELECT "id" FROM "Studio" WHERE "ownerId" = current_setting(''app.studio_owner_id'', true)))',
      lower(regexp_replace(table_name, '([a-z])([A-Z])', '\1_\2', 'g')) || '_owner', table_name
    );
  END LOOP;
END $$;
