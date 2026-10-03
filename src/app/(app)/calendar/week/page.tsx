import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { requireUser } from "@/lib/auth/session";
import { generateMonthSlots, listUpcomingSlots } from "@/lib/db/calendar";
import { getCalendarProfile } from "@/lib/db/profiles";

function yearMonthOf(d: Date) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export default async function CalendarWeekPage() {
  const user = await requireUser();
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

  const today = new Date();
  const nextWeek = new Date(today.getTime() + 6 * 86400000);
  const months = new Set([yearMonthOf(today), yearMonthOf(nextWeek)]);
  for (const ym of months) await generateMonthSlots(user.id, ym);
  const slots = await listUpcomingSlots(user.id, 7);
  const byDate = new Map(slots.map((s) => [s.date.toISOString().slice(0, 10), s]));

  const days = Array.from({ length: 7 }, (_, i) => new Date(today.getTime() + i * 86400000));

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">{t("weekView")}</h1>
        <Link href="/calendar" className="text-sm text-primary hover:underline">
          {t("title")}
        </Link>
      </div>
      <div className="mt-6 flex flex-col gap-2">
        {days.map((d) => {
          const key = d.toISOString().slice(0, 10);
          const slot = byDate.get(key);
          return (
            <div key={key} className="flex items-center gap-4 rounded-lg border border-white/10 p-3">
              <span className="w-24 shrink-0 text-sm text-muted-foreground">{key}</span>
              {slot ? (
                <>
                  <span className="flex-1 text-sm">{slot.event?.nameZh ?? slot.campaignTemplate?.nameZh}</span>
                  <Badge variant={slot.design ? "default" : "outline"}>{t(`status.${slot.status}`)}</Badge>
                  {slot.design?.publishStatus && (
                    <span className="text-xs text-muted-foreground">{slot.design.publishStatus}</span>
                  )}
                  {slot.designId && (
                    <Link href={`/editor/${slot.designId}`} className="text-xs text-primary hover:underline">
                      {t("drawer.pickTemplate")}
                    </Link>
                  )}
                </>
              ) : (
                <span className="flex-1 text-sm text-muted-foreground">—</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
