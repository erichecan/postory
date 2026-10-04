import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { CalendarMonthGrid } from "@/components/calendar/calendar-month-grid";
import { NlOrderBox } from "@/components/calendar/nl-order-box";
import { requireUser } from "@/lib/auth/session";
import { generateMonthSlots, listMonthSlots } from "@/lib/db/calendar";
import { getCalendarProfile } from "@/lib/db/profiles";
import { listTemplatesByIndustry } from "@/lib/db/templates";

function currentYearMonth() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function shiftMonth(yearMonth: string, delta: number) {
  const [y, m] = yearMonth.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function isValidYearMonth(v: string | undefined): v is string {
  return !!v && /^\d{4}-\d{2}$/.test(v);
}

export default async function CalendarPage({ searchParams }: PageProps<"/calendar">) {
  const user = await requireUser();
  const sp = await searchParams;
  const monthParam = typeof sp.month === "string" ? sp.month : undefined;
  const yearMonth = isValidYearMonth(monthParam) ? monthParam : currentYearMonth();

  const [profile, t] = await Promise.all([getCalendarProfile(user.id), getTranslations("calendar")]);

  if (!profile?.industry || !profile.country || profile.industry === "OTHER") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">{t("missingProfileTitle")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("missingProfileBody")}</p>
        <Link href="/profile" className="mt-6 inline-flex h-10 items-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          {t("missingProfileCta")}
        </Link>
      </div>
    );
  }

  await generateMonthSlots(user.id, yearMonth);
  const [slots, templates] = await Promise.all([listMonthSlots(user.id, yearMonth), listTemplatesByIndustry(profile.industry, 12)]);

  return (
    <div className="mx-auto max-w-[1080px] px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Link href="/calendar/week" className="rounded-md border border-border px-3 py-1.5 hover:bg-accent">
            {t("weekView")}
          </Link>
          <Link href={`/calendar?month=${shiftMonth(yearMonth, -1)}`} className="rounded-md border border-border px-3 py-1.5 hover:bg-accent">
            {t("prevMonth")}
          </Link>
          <span className="min-w-20 text-center font-medium">{yearMonth}</span>
          <Link href={`/calendar?month=${shiftMonth(yearMonth, 1)}`} className="rounded-md border border-border px-3 py-1.5 hover:bg-accent">
            {t("nextMonth")}
          </Link>
        </div>
      </div>

      <NlOrderBox />

      <CalendarMonthGrid
        yearMonth={yearMonth}
        slots={slots.map((s) => ({
          id: s.id,
          date: s.date.toISOString().slice(0, 10),
          status: s.status,
          weeklyRhythmTag: s.weeklyRhythmTag,
          eventName: s.event?.nameZh ?? null,
          campaignName: s.campaignTemplate?.nameZh ?? null,
          designId: s.designId,
          designStatus: s.design?.status ?? null,
        }))}
        templates={templates}
      />
    </div>
  );
}
