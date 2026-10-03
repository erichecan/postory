-- DropIndex
DROP INDEX IF EXISTS "CalendarSlot_userId_date_idx";

-- CreateIndex
CREATE UNIQUE INDEX "CalendarSlot_userId_date_key" ON "CalendarSlot"("userId", "date");
