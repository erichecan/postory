import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { ComparisonTable } from "@/components/billing/comparison-table";
import { AppFooter } from "@/components/shell/app-footer";
import { PublicHeader } from "@/components/shell/public-header";
import { buttonVariants } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/session";
import { CONTACT_HREF } from "@/lib/brand";
import { cn } from "@/lib/utils";
import { MOCK_TIER_FEATURES, mockTagline, mockTiers } from "@/lib/mock/commerce";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("plans"))("meta") };
}

const FAQ = ["1", "2", "3", "4"] as const;

export default async function PlansPage() {
  const [user, t, locale] = await Promise.all([getCurrentUser(), getTranslations("plans"), getLocale()]);
  const tiers = mockTiers(locale).map((tier) => ({
    id: tier.id,
    name: tier.name,
    tagline: mockTagline(locale, tier.id),
    features: MOCK_TIER_FEATURES[tier.id],
    recommended: tier.id === "growth",
  }));

  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader signedIn={user !== null} />
      <main className="mx-auto flex w-full max-w-[1080px] flex-1 flex-col gap-14 px-4 py-14">
        <header className="mx-auto max-w-xl text-center">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t("hero.title")}</h1>
          <p className="mt-3 text-muted-foreground">{t("hero.subtitle")}</p>
        </header>

        <ComparisonTable tiers={tiers} contactHref={CONTACT_HREF} />

        <section className="mx-auto flex w-full max-w-3xl flex-col gap-4">
          <h2 className="text-xl font-semibold">{t("faq.title")}</h2>
          <div className="flex flex-col divide-y rounded-xl border">
            {FAQ.map((n) => (
              <details key={n} className="group px-5 py-4 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                  {t(`faq.q${n}`)}
                  <span className="text-muted-foreground transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(`faq.a${n}`)}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="flex flex-col items-center gap-3 rounded-2xl border bg-card px-6 py-10 text-center">
          <h2 className="text-xl font-semibold">{t("bottom.title")}</h2>
          <p className="max-w-md text-sm text-muted-foreground">{t("bottom.body")}</p>
          <a href={CONTACT_HREF} className={cn(buttonVariants({ size: "lg" }), "mt-2 h-10 px-6")}>{t("cta")}</a>
        </section>
      </main>
      <AppFooter />
    </div>
  );
}
