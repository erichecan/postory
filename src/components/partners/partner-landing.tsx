import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ContactButton } from "@/components/billing/contact-button";
import { buttonVariants } from "@/components/ui/button";

const WHO_IDS = ["1", "2", "3"] as const;
const DIVISION_IDS = ["1", "2", "3"] as const;
const DELIVER_IDS = ["1", "2", "3", "4", "5"] as const;
const HOW_IDS = ["1", "2", "3", "4"] as const;
const FAQ_IDS = ["1", "2", "3", "4", "5", "6"] as const;
const SAMPLE_IMAGES = ["beauty-1", "beauty-2", "campaign-cover"] as const;
const SAMPLE_ALT = ["Beauty studio content sample", "Beauty service detail sample", "Beauty campaign sample"] as const;

export async function PartnerLanding() {
  const t = await getTranslations("partners.landing");

  return (
    <div className="flex flex-col gap-20 sm:gap-24">
      <section className="grid items-center gap-8 overflow-hidden rounded-3xl bg-primary/5 p-5 sm:p-9 lg:grid-cols-[0.92fr_1.08fr] lg:gap-12 lg:p-12">
        <div className="flex flex-col items-start gap-5 py-2">
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{t("hero.tag")}</span>
          <h1 className="max-w-xl text-3xl font-semibold leading-tight tracking-tight sm:text-4xl lg:text-[2.8rem]">{t("hero.title")}</h1>
          <p className="max-w-xl text-base leading-relaxed text-muted-foreground">{t("hero.subtitle")}</p>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Link href="/partners/trial" className={buttonVariants({ size: "lg", className: "h-11 px-6" })}>
              {t("hero.ctaPrimary")}
            </Link>
            <Link href="/partners/demo" className={buttonVariants({ variant: "outline", size: "lg", className: "h-11 bg-background px-6" })}>
              {t("hero.ctaSecondary")}
            </Link>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2 pt-1 text-xs font-medium text-muted-foreground">
            <span>{t("hero.proof1")}</span><span>{t("hero.proof2")}</span><span>{t("hero.proof3")}</span>
          </div>
        </div>
        <div className="grid grid-cols-[1.12fr_0.88fr] gap-3 sm:gap-4">
          {SAMPLE_IMAGES.map((name, index) => (
            <div key={name} className={`relative overflow-hidden rounded-2xl border-4 border-background bg-background shadow-lg ${index === 0 ? "row-span-2 aspect-[4/5]" : "aspect-[5/4]"}`}>
              <Image src={`/visual/${name}.webp`} alt={SAMPLE_ALT[index]} fill sizes="(min-width: 1024px) 28vw, 45vw" className="object-cover" unoptimized />
            </div>
          ))}
          <p className="col-span-2 text-center text-xs text-muted-foreground">{t("hero.sampleCaption")}</p>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-2xl font-semibold tracking-tight">{t("who.title")}</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {WHO_IDS.map((n) => (
            <div key={n} className="rounded-2xl border bg-card p-5 shadow-sm">
              <p className="font-medium">{t(`who.title${n}`)}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t(`who.body${n}`)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-2xl font-semibold tracking-tight">{t("division.title")}</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {DIVISION_IDS.map((n) => (
            <div key={n} className="rounded-2xl border bg-card p-5 shadow-sm">
              <p className="font-medium">{t(`division.role${n}`)}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t(`division.body${n}`)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-2xl font-semibold tracking-tight">{t("deliver.title")}</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {DELIVER_IDS.map((n) => (
            <div key={n} className="rounded-2xl border bg-card p-5 shadow-sm">
              <p className="font-medium">{t(`deliver.title${n}`)}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t(`deliver.body${n}`)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-2xl font-semibold tracking-tight">{t("how.title")}</h2>
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {HOW_IDS.map((n) => (
            <li key={n} className="rounded-2xl border bg-card p-5 shadow-sm">
              <span className="grid size-8 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary">{n}</span>
              <p className="mt-1 font-medium">{t(`how.title${n}`)}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t(`how.body${n}`)}</p>
            </li>
          ))}
        </ol>
        <Link href="/partners/demo" className="text-sm font-medium text-primary hover:underline">
          {t("how.demoLink")}
        </Link>
      </section>

      <section className="flex flex-col gap-3 rounded-3xl border bg-primary/5 p-6 sm:p-8">
        <h2 className="text-2xl font-semibold tracking-tight">{t("pricing.title")}</h2>
        <p className="text-sm text-muted-foreground">{t("pricing.body")}</p>
        <p className="rounded-xl border bg-background px-4 py-4 text-sm leading-relaxed">{t("pricing.example")}</p>
        <ContactButton label={t("pricing.contact")} variant="outline" className="w-fit" />
      </section>

      <section className="flex flex-col gap-2 rounded-2xl border bg-card p-6 shadow-sm">
        <h2 className="text-xl font-semibold">{t("participate.title")}</h2>
        <p className="text-sm text-muted-foreground">{t("participate.body")}</p>
      </section>

      <section className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <h2 className="text-2xl font-semibold tracking-tight">{t("faq.title")}</h2>
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
          <Link href="/partners/trial" className={buttonVariants({ size: "lg", className: "h-10 px-6" })}>
            {t("closing.ctaPrimary")}
          </Link>
          <ContactButton label={t("closing.ctaSecondary")} variant="outline" className="h-10 px-6" />
        </div>
      </section>
    </div>
  );
}
