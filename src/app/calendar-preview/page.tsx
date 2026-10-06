import type { Metadata } from "next";
import { getFormatter, getTranslations } from "next-intl/server";
import { CalendarLeadForm } from "@/components/calendar/calendar-lead-form";
import { AppFooter } from "@/components/shell/app-footer";
import { PublicHeader } from "@/components/shell/public-header";
import { getCurrentUser } from "@/lib/auth/session";
import { getPublicYearPreview } from "@/lib/db/calendar";
import type { Country, Industry } from "@/generated/prisma/client";

const INDUSTRY_OPTIONS = ["FOOD_TAKEAWAY", "BEAUTY_HAIR", "FITNESS", "PHONE_REPAIR"] as const satisfies readonly Industry[];
const COUNTRY_OPTIONS = ["IE", "CA"] as const satisfies readonly Country[];

function isIndustry(v: string | undefined): v is Industry {
  return !!v && (INDUSTRY_OPTIONS as readonly string[]).includes(v);
}
function isCountry(v: string | undefined): v is Country {
  return !!v && (COUNTRY_OPTIONS as readonly string[]).includes(v);
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("calendar.preview"))("title") };
}

export default async function CalendarPreviewPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const industryParam = typeof sp.industry === "string" ? sp.industry : undefined;
  const countryParam = typeof sp.country === "string" ? sp.country : undefined;
  const industry = isIndustry(industryParam) ? industryParam : undefined;
  const country = isCountry(countryParam) ? countryParam : undefined;

  const [user, t, ti, tc, format] = await Promise.all([
    getCurrentUser(),
    getTranslations("calendar.preview"),
    getTranslations("profile.industryOptions"),
    getTranslations("profile.countryOptions"),
    getFormatter(),
  ]);

  const months = industry && country ? await getPublicYearPreview(industry, country) : null;

  return (
    <div className="ds-document  flex min-h-screen flex-col">
      <PublicHeader signedIn={user !== null} />
      <main className="mx-auto flex w-full max-w-[1080px] flex-1 flex-col gap-10 px-4 py-12">
        <header className="flex flex-col gap-2 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="mx-auto max-w-xl text-sm text-muted-foreground">{t("subtitle")}</p>
        </header>

        <form className="mx-auto flex w-full max-w-xl flex-wrap items-end justify-center gap-3" action="/calendar-preview">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="industry" className="text-xs text-muted-foreground">{t("industryLabel")}</label>
            <select id="industry" name="industry" defaultValue={industry ?? ""} className="h-10 rounded-lg border bg-input/30 px-3 text-sm">
              <option value="" disabled>
                {t("industryLabel")}
              </option>
              {INDUSTRY_OPTIONS.map((v) => (
                <option key={v} value={v}>
                  {ti(v)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="country" className="text-xs text-muted-foreground">{t("countryLabel")}</label>
            <select id="country" name="country" defaultValue={country ?? ""} className="h-10 rounded-lg border bg-input/30 px-3 text-sm">
              <option value="" disabled>
                {t("countryLabel")}
              </option>
              {COUNTRY_OPTIONS.map((v) => (
                <option key={v} value={v}>
                  {tc(v)}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="h-10 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            {t("generate")}
          </button>
        </form>

        {months && (
          <>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {months.map((m) => (
                <div key={m.yearMonth} className="flex flex-col gap-1.5 rounded-xl border p-4">
                  <p className="text-xs font-medium text-muted-foreground">
                    {format.dateTime(new Date(`${m.yearMonth}-01T00:00:00Z`), { month: "long", year: "numeric", timeZone: "UTC" })}
                  </p>
                  <p className="text-sm font-semibold">{m.eventName ?? t("emptyEvent")}</p>
                  {m.campaignName && <p className="text-xs text-muted-foreground">{m.campaignName}</p>}
                </div>
              ))}
            </div>

            <CalendarLeadForm industry={industry!} country={country!} />
          </>
        )}
      </main>
      <AppFooter />
    </div>
  );
}
