import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ContactButton } from "@/components/billing/contact-button";
import { Button } from "@/components/ui/button";

const WHO_IDS = ["1", "2", "3"] as const;
const DIVISION_IDS = ["1", "2", "3"] as const;
const DELIVER_IDS = ["1", "2", "3", "4", "5"] as const;
const HOW_IDS = ["1", "2", "3", "4"] as const;
const FAQ_IDS = ["1", "2", "3", "4", "5", "6"] as const;
const SAMPLE_IMAGES = ["beauty-1", "beauty-2", "campaign-cover"] as const;

export async function PartnerLanding() {
  const t = await getTranslations("partners.landing");

  return (
    <div className="flex flex-col gap-16">
      <section className="flex flex-col items-center gap-6 text-center">
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">{t("hero.tag")}</span>
        <h1 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">{t("hero.title")}</h1>
        <p className="max-w-xl text-muted-foreground">{t("hero.subtitle")}</p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button render={<Link href="/partners/trial" />} size="lg" className="h-10 px-6">
            {t("hero.ctaPrimary")}
          </Button>
          <Button render={<Link href="/demo/my-brand" />} variant="outline" size="lg" className="h-10 px-6">
            {t("hero.ctaSecondary")}
          </Button>
        </div>
        <div className="grid w-full max-w-2xl grid-cols-3 gap-3">
          {SAMPLE_IMAGES.map((name) => (
            <div key={name} className="relative aspect-square overflow-hidden rounded-xl border">
              <Image src={`/visual/${name}.webp`} alt="" fill sizes="33vw" className="object-cover" unoptimized />
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">{t("hero.sampleCaption")}</p>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">{t("who.title")}</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {WHO_IDS.map((n) => (
            <div key={n} className="rounded-xl border p-4">
              <p className="font-medium">{t(`who.title${n}`)}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t(`who.body${n}`)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">{t("division.title")}</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {DIVISION_IDS.map((n) => (
            <div key={n} className="rounded-xl border p-4">
              <p className="font-medium">{t(`division.role${n}`)}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t(`division.body${n}`)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">{t("deliver.title")}</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {DELIVER_IDS.map((n) => (
            <div key={n} className="rounded-xl border p-4">
              <p className="font-medium">{t(`deliver.title${n}`)}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t(`deliver.body${n}`)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">{t("how.title")}</h2>
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {HOW_IDS.map((n) => (
            <li key={n} className="rounded-xl border p-4">
              <span className="text-xs text-muted-foreground">{n}</span>
              <p className="mt-1 font-medium">{t(`how.title${n}`)}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t(`how.body${n}`)}</p>
            </li>
          ))}
        </ol>
        <Link href="/demo/my-brand" className="text-sm font-medium text-primary hover:underline">
          {t("how.demoLink")}
        </Link>
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border bg-card p-6">
        <h2 className="text-xl font-semibold">{t("pricing.title")}</h2>
        <p className="text-sm text-muted-foreground">{t("pricing.body")}</p>
        <p className="rounded-lg bg-muted/40 px-4 py-3 text-sm">{t("pricing.example")}</p>
        <ContactButton label={t("pricing.contact")} variant="outline" className="w-fit" />
      </section>

      <section className="flex flex-col gap-2 rounded-xl border p-5">
        <h2 className="text-xl font-semibold">{t("participate.title")}</h2>
        <p className="text-sm text-muted-foreground">{t("participate.body")}</p>
      </section>

      <section className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <h2 className="text-xl font-semibold">{t("faq.title")}</h2>
        <div className="flex flex-col divide-y rounded-xl border">
          {FAQ_IDS.map((n) => (
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
        <h2 className="text-xl font-semibold">{t("closing.title")}</h2>
        <p className="max-w-md text-sm text-muted-foreground">{t("closing.body")}</p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          <Button render={<Link href="/partners/trial" />} size="lg" className="h-10 px-6">
            {t("closing.ctaPrimary")}
          </Button>
          <ContactButton label={t("closing.ctaSecondary")} variant="outline" className="h-10 px-6" />
        </div>
      </section>
    </div>
  );
}
