import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { buttonVariants } from "@/components/ui/button";
import { getDemoData } from "@/lib/agency/demo";

const STEPS = ["intake", "plan", "samples", "confirm", "client", "summary"] as const;

export async function PartnerDemoJourney() {
  const [t, data] = await Promise.all([getTranslations("partners.demo"), Promise.resolve(getDemoData())]);
  const examples = data.items.slice(0, 3);
  const published = data.items.filter((item) => item.status === "Published").length;
  const scheduled = data.items.filter((item) => item.status === "Scheduled").length;

  return (
    <div className="flex flex-col gap-8">
      <header className="rounded-3xl bg-primary/5 px-5 py-9 text-center sm:px-10 sm:py-12">
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{t("demoBadge")}</span>
        <h1 className="mx-auto mt-4 max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">{t("title")}</h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">{t("subtitle")}</p>
      </header>

      <nav aria-label={t("stepNav")} className="sticky top-0 z-10 -mx-4 overflow-x-auto border-y bg-background/95 px-4 py-3 backdrop-blur">
        <ol className="mx-auto flex min-w-max max-w-[1080px] gap-2">
          {STEPS.map((step, index) => (
            <li key={step}>
              <a href={`#${step}`} className="flex items-center gap-2 rounded-full border bg-card px-3 py-2 text-xs hover:border-primary/40">
                <span className="grid size-5 place-items-center rounded-full bg-primary/10 font-semibold text-primary">{index + 1}</span>
                {t(`steps.${step}.title`)}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <section id="intake" className="scroll-mt-24 rounded-2xl border bg-card p-5 shadow-sm sm:p-7">
        <StepHeading number="1" title={t("steps.intake.title")} body={t("steps.intake.body")} />
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <DemoField label={t("fields.brand")} value={data.profile?.shopName ?? "Sophie Chen Beauty Studio"} />
          <DemoField label={t("fields.industry")} value={t("values.beauty")} />
          <DemoField label={t("fields.area")} value={data.profile?.address ?? "Toronto, Canada"} />
          <DemoField label={t("fields.platforms")} value={data.accounts.map((account) => account.platform).join(" · ")} />
          <DemoField label={t("fields.services")} value={t("values.services")} wide />
          <DemoField label={t("fields.audience")} value={t("values.audience")} wide />
        </div>
        <DemoLink href="/partners/trial" label={t("tryOwn")} />
      </section>

      <section id="plan" className="scroll-mt-24 rounded-2xl border bg-card p-5 shadow-sm sm:p-7">
        <StepHeading number="2" title={t("steps.plan.title")} body={t("steps.plan.body")} />
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {examples.map((item, index) => (
            <article key={item.id} className="flex gap-3 rounded-xl border p-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{index + 1}</span>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold">{item.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{item.category} · {item.platform}</p>
                <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{item.caption}</p>
              </div>
            </article>
          ))}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">{t("planFootnote", { count: data.items.length })}</p>
        <DemoLink href="/demo/my-campaign" label={t("openPlan")} />
        <DemoLink href="/partners/trial" label={t("tryOwn")} />
      </section>

      <section id="samples" className="scroll-mt-24 rounded-2xl border bg-card p-5 shadow-sm sm:p-7">
        <StepHeading number="3" title={t("steps.samples.title")} body={t("steps.samples.body")} />
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {examples.map((item, index) => (
            <article key={item.id} className="overflow-hidden rounded-xl border bg-background">
              <div className="relative aspect-[4/3]">
                <Image src={item.image ?? "/visual/beauty-1.webp"} alt={item.title} fill sizes="(min-width: 640px) 30vw, 90vw" className="object-cover" />
              </div>
              <div className="p-3">
                <h3 className="text-sm font-semibold">{t("imageNumber", { number: index + 1 })} · {item.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{t("sameContent")}</p>
                <p className="mt-2 rounded-lg bg-muted/50 px-3 py-2 text-xs">{item.caption}</p>
              </div>
            </article>
          ))}
        </div>
        <p className="mt-4 rounded-xl bg-primary/5 px-4 py-3 text-sm leading-relaxed">{t("quotaExample")}</p>
        <DemoLink href="/demo/my-campaign" label={t("openSamples")} />
        <DemoLink href="/partners/trial" label={t("tryOwn")} />
      </section>

      <section id="confirm" className="scroll-mt-24 rounded-2xl border bg-card p-5 shadow-sm sm:p-7">
        <StepHeading number="4" title={t("steps.confirm.title")} body={t("steps.confirm.body")} />
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <DemoField label={t("fields.scope")} value={t("values.scope")} />
          <DemoField label={t("fields.prepayment")} value={t("values.simulated")} />
          <DemoField label={t("fields.publish")} value={t("values.notPublished")} />
        </div>
        <p className="mt-3 text-xs text-muted-foreground">{t("noPayment")}</p>
        <DemoLink href="/partners/trial" label={t("tryOwn")} />
      </section>

      <section id="client" className="scroll-mt-24 rounded-2xl border bg-card p-5 shadow-sm sm:p-7">
        <StepHeading number="5" title={t("steps.client.title")} body={t("steps.client.body")} />
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <DemoField label={t("fields.clientLink")} value={t("values.sampleLink")} />
          <DemoField label={t("fields.account")} value={t("values.mockConnected")} />
        </div>
        <DemoLink href="/demo/my-brand" label={t("openClientView")} />
        <DemoLink href="/partners/trial" label={t("tryOwn")} />
      </section>

      <section id="summary" className="scroll-mt-24 rounded-2xl border bg-card p-5 shadow-sm sm:p-7">
        <StepHeading number="6" title={t("steps.summary.title")} body={t("steps.summary.body")} />
        <h3 className="mt-5 text-sm font-semibold">{t("reportTitle")}</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <Metric label={t("metrics.clients")} value="1" />
          <Metric label={t("metrics.published")} value={String(published)} />
          <Metric label={t("metrics.scheduled")} value={String(scheduled)} />
        </div>
        <p className="mt-4 text-xs text-muted-foreground">{t("noPerformance")}</p>
        <DemoLink href="/demo/dashboard" label={t("openSummary")} />
        <DemoLink href="/partners/trial" label={t("tryOwn")} />
      </section>

      <section className="flex flex-col items-center gap-3 rounded-3xl bg-primary/5 px-5 py-9 text-center">
        <h2 className="text-2xl font-semibold tracking-tight">{t("closingTitle")}</h2>
        <p className="max-w-xl text-sm text-muted-foreground">{t("closingBody")}</p>
        <Link href="/partners/trial" className={buttonVariants({ size: "lg", className: "mt-1" })}>{t("cta")}</Link>
      </section>
    </div>
  );
}

function StepHeading({ number, title, body }: { number: string; title: string; body: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">{number}</span>
      <div>
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{body}</p>
      </div>
    </div>
  );
}

function DemoField({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return <div className={`rounded-xl border bg-background p-3 ${wide ? "sm:col-span-2" : ""}`}><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-sm font-medium">{value}</p></div>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border bg-background p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p></div>;
}

function DemoLink({ href, label }: { href: string; label: string }) {
  return <Link href={href} className="mt-4 inline-flex w-fit text-sm font-medium text-primary hover:underline">{label} →</Link>;
}
