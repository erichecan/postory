import type { Metadata } from "next";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { ContactButton } from "@/components/billing/contact-button";
import { TierCards } from "@/components/billing/tier-cards";
import { LandingHero } from "@/components/landing/landing-hero";
import { CompareSection, FeatureGrid, StepsSection } from "@/components/landing/landing-sections";
import { AppFooter } from "@/components/shell/app-footer";
import { PublicHeader } from "@/components/shell/public-header";
import { buttonVariants } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/session";
import { listTiers } from "@/lib/db/plans";
import { countAllTemplatesCached, listShowcaseTemplates } from "@/lib/db/templates";
import { cn } from "@/lib/utils";

const COMPARE_SAMPLE = "/assets/templates/orshot-assets/6aaffaed46f795d6.jpg";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("landing"))("meta") };
}

export default async function Home() {
  const locale = await getLocale();
  const [user, t, count, showcase, tiers] = await Promise.all([getCurrentUser(), getTranslations("landing.bottom"), countAllTemplatesCached(), listShowcaseTemplates(), listTiers(locale)]);

  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader signedIn={user !== null} />
      <main className="mx-auto flex w-full max-w-[1080px] flex-1 flex-col gap-20 px-4 py-12 sm:py-16">
        <LandingHero count={count} showcase={showcase} />
        <FeatureGrid count={count} />
        <CompareSection sample={COMPARE_SAMPLE} />
        <StepsSection />
        <TierCards tiers={tiers} />
        <section className="flex flex-col items-center gap-3 rounded-2xl border bg-card px-6 py-12 text-center">
          <h2 className="text-2xl font-semibold tracking-tight">{t("title")}</h2>
          <p className="max-w-md text-sm text-muted-foreground">{t("body")}</p>
          <div className="mt-2 flex flex-wrap justify-center gap-3">
            <Link href="/register" className={cn(buttonVariants({ size: "lg" }), "h-10 px-6")}>{t("primary")}</Link>
            <ContactButton label={t("contact")} variant="outline" size="lg" className="h-10 px-6" />
          </div>
        </section>
      </main>
      <AppFooter />
    </div>
  );
}
