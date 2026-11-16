"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { readVideoMarketingPlanHandoff, saveGeneratedVideoMarketingPlan, type VideoMarketingPlanDraft, type VideoMarketingPlanFormValues, type VideoMarketingPlanHandoff } from "@/lib/ai/video-marketing-plan-handoff";

type PlanReply = { ok: true; provider: "codex_cli" | "openai_api"; plan: VideoMarketingPlanDraft } | { ok: false; reason: string };

function discountPercent(currentPrice: string, promotionalPrice: string) {
  const current = Number(currentPrice.replace(/[$,\s]/g, ""));
  const promo = Number(promotionalPrice.replace(/[$,\s]/g, ""));
  if (!Number.isFinite(current) || !Number.isFinite(promo) || current <= 0 || promo < 0 || promo >= current) return null;
  return Math.round((1 - promo / current) * 100);
}

export function VideoMarketingPlanner({ handoffId }: { handoffId: string }) {
  const t = useTranslations("admin.videoLab");
  const router = useRouter();
  const [handoff, setHandoff] = useState<VideoMarketingPlanHandoff | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [goal, setGoal] = useState("store_visits");
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [budget, setBudget] = useState("");
  const [notes, setNotes] = useState("");
  const [activityOfferType, setActivityOfferType] = useState("not_set");
  const [activityDiscount, setActivityDiscount] = useState("");
  const [activityTerms, setActivityTerms] = useState("");
  const [prices, setPrices] = useState<Record<string, { currentPrice: string; promotionalPrice: string; productFacts: string }>>({});
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    readVideoMarketingPlanHandoff(handoffId).then((value) => {
      if (!active) return;
      if (!value || Date.now() - value.createdAt > 24 * 60 * 60 * 1000) setLoadFailed(true);
      else {
        setHandoff(value);
        setGoal(value.formValues?.goal ?? value.goal ?? "store_visits");
        setLocation(value.formValues?.location ?? value.location);
        setStartDate(value.formValues?.startDate ?? value.startDate);
        setEndDate(value.formValues?.endDate ?? value.endDate);
        setPlatforms(value.formValues?.platforms ?? value.platforms);
        setNotes(value.formValues?.notes ?? value.notes);
        setPrices(value.formValues?.prices ?? Object.fromEntries(value.products.map((product) => [product.id, { currentPrice: product.currentPrice, promotionalPrice: product.promotionalPrice, productFacts: product.productFacts }])));
        setActivityOfferType(value.formValues?.activityOfferType ?? "not_set");
        setActivityDiscount(value.formValues?.activityDiscount ?? "");
        setActivityTerms(value.formValues?.activityTerms ?? "");
      }
    }).catch(() => { if (active) setLoadFailed(true); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [handoffId]);

  async function generatePlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!handoff) return;
    if (!startDate || !endDate || endDate < startDate) { setError("plan_dates_invalid"); return; }
    setGenerating(true);
    setError("");
    try {
      const response = await fetch("/api/admin/video-marketing-plan", {
        method: "POST", cache: "no-store", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal, location, startDate, endDate, platforms, budget, notes, customerFacts: handoff.customerFacts, activities: handoff.activities, campaignOffer: { type: activityOfferType, discount: activityDiscount, terms: activityTerms }, products: handoff.products.map((product) => ({ name: product.name, reason: product.reason, ...(prices[product.id] ?? { currentPrice: "", promotionalPrice: "", productFacts: "" }) })) }),
      });
      const body = await response.json() as PlanReply;
      if (!response.ok || !body.ok) { setError(t(`errors.${body.ok ? "plan_failed" : body.reason}` as never)); return; }
      const formValues: VideoMarketingPlanFormValues = { goal, location, startDate, endDate, platforms, budget, notes, prices, activityOfferType, activityDiscount, activityTerms };
      await saveGeneratedVideoMarketingPlan(handoff.id, body.plan, formValues);
      router.push(`/admin/marketing-plan/calendar?handoff=${encodeURIComponent(handoff.id)}`);
    } catch { setError(t("errors.plan_failed")); }
    finally { setGenerating(false); }
  }

  if (loading) return <p className="p-6 text-sm text-muted-foreground">{t("planLoading")}</p>;
  if (loadFailed || !handoff) return <main className="mx-auto max-w-3xl px-4 py-12"><section className="rounded-2xl border bg-card p-6"><h1 className="text-xl font-semibold">{t("planContextMissingTitle")}</h1><p className="mt-2 text-sm text-muted-foreground">{t("planContextMissingHelp")}</p><Link href="/admin/video-lab" className="mt-5 inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground">{t("backToRecognition")}</Link></section></main>;

  return <main className="mx-auto flex max-w-[1080px] flex-col gap-6 px-4 py-8 sm:py-10">
    <div><div className="flex flex-wrap items-center justify-between gap-3"><Link href="/admin/video-lab" className="text-sm font-medium text-primary hover:underline">← {t("backToRecognition")}</Link><Link href="/admin/marketing-plan/calendar?sample=sushi" className="inline-flex h-9 items-center rounded-lg border px-3 text-sm font-medium">{t("openSushiDemo")}</Link></div><p className="mt-6 text-xs font-semibold uppercase tracking-wide text-primary">{t("planStepLabel")}</p><h1 className="mt-1 text-2xl font-semibold tracking-tight">{t("planEntryTitle")}</h1><p className="mt-2 max-w-3xl text-sm text-muted-foreground">{t("planPageIntro")}</p></div>

    <form onSubmit={generatePlan} className="flex flex-col gap-6 rounded-2xl border bg-card p-5 shadow-sm sm:p-7">
      {handoff.activities.length > 0 && <section className="rounded-xl border border-primary/30 bg-primary/5 p-4">
        <h2 className="font-semibold">{t("planActivityContextTitle")}</h2>
        <div className="mt-3 flex flex-col gap-3">{handoff.activities.map((activity) => <article key={activity.id} className="rounded-lg border bg-background p-3"><p className="font-medium">{activity.title} · {t(`theme.${activity.theme}` as never)}</p><p className="mt-1 text-sm text-muted-foreground">{activity.description}</p><p className="mt-1 text-xs text-muted-foreground">{activity.overview} · {activity.videoName}</p></article>)}</div>
        <p className="mt-3 text-xs text-muted-foreground">{t("planActivityContextHelp")}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-sm font-medium">{t("planActivityOfferType")}<select value={activityOfferType} onChange={(event) => setActivityOfferType(event.target.value)} className="h-11 rounded-lg border bg-background px-3 font-normal">{["not_set", "percent_off", "amount_off", "buy_more_save_more", "clearance", "free_gift", "other"].map((item) => <option key={item} value={item}>{t(`planActivityOfferTypes.${item}` as never)}</option>)}</select></label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">{t("planActivityDiscount")}<input inputMode="decimal" value={activityDiscount} onChange={(event) => setActivityDiscount(event.target.value)} placeholder={t("planActivityDiscountPlaceholder")} className="h-11 rounded-lg border bg-background px-3 font-normal" /></label>
          <label className="flex flex-col gap-1.5 text-sm font-medium sm:col-span-2">{t("planActivityTerms")}<textarea value={activityTerms} onChange={(event) => setActivityTerms(event.target.value)} rows={2} maxLength={1000} placeholder={t("planActivityTermsPlaceholder")} className="rounded-lg border bg-background px-3 py-2 font-normal" /></label>
        </div>
      </section>}
      {handoff.products.length > 0 && <section className="rounded-xl border bg-muted/20 p-4">
        <h2 className="font-semibold">{t("planProductsTitle")}</h2>
        <div className="mt-4 flex flex-col gap-4">
          {handoff.products.map((product) => {
            const productPrice = prices[product.id] ?? { currentPrice: "", promotionalPrice: "", productFacts: "" };
            const discount = discountPercent(productPrice.currentPrice, productPrice.promotionalPrice);
            const discountLabel = discount === null ? productPrice.currentPrice && productPrice.promotionalPrice ? t("planNoDiscount") : t("planDiscountPending") : `${discount}%`;
            return <article key={product.id} className="rounded-xl border bg-background p-4">
              <div className="flex items-center gap-3">
                {product.optimizedImageDataUrl ? <Image src={product.optimizedImageDataUrl} width={112} height={112} unoptimized alt={product.name} className="size-20 rounded-lg border bg-white object-contain" /> : product.originalImageDataUrl ? <Image src={product.originalImageDataUrl} width={112} height={112} unoptimized alt={product.name} className="size-20 rounded-lg border bg-white object-contain" /> : <div className="flex size-20 items-center justify-center rounded-lg border text-center text-xs text-muted-foreground">{t("planNoImage")}</div>}
                <div><h3 className="font-semibold">{product.name}</h3><p className="mt-1 text-xs text-muted-foreground">{product.videoName} · {t(`confidence.${product.confidence}` as never)}</p><p className="mt-1 text-xs text-muted-foreground">{product.reason}</p></div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5 text-sm font-medium">{t("planCurrentPrice")}<div className="flex h-11 items-center rounded-lg border bg-background px-3"><span className="mr-2 text-muted-foreground">{t("planCurrency")}</span><input inputMode="decimal" value={productPrice.currentPrice} onChange={(event) => setPrices((current) => ({ ...current, [product.id]: { ...productPrice, currentPrice: event.target.value } }))} placeholder="0.00" className="min-w-0 flex-1 bg-transparent font-normal outline-none" /></div></label>
                <label className="flex flex-col gap-1.5 text-sm font-medium">{t("planPromotionalPrice")}<div className="flex h-11 items-center rounded-lg border bg-background px-3"><span className="mr-2 text-muted-foreground">{t("planCurrency")}</span><input inputMode="decimal" value={productPrice.promotionalPrice} onChange={(event) => setPrices((current) => ({ ...current, [product.id]: { ...productPrice, promotionalPrice: event.target.value } }))} placeholder="0.00" className="min-w-0 flex-1 bg-transparent font-normal outline-none" /></div></label>
                <label className="flex flex-col gap-1.5 text-sm font-medium sm:col-span-2">{t("planProductFacts")}<textarea value={productPrice.productFacts} onChange={(event) => setPrices((current) => ({ ...current, [product.id]: { ...productPrice, productFacts: event.target.value } }))} rows={2} maxLength={600} placeholder={t("planProductFactsPlaceholder")} className="rounded-lg border bg-background px-3 py-2 font-normal" /></label>
              </div>
              <p className="mt-3 text-sm">{t("planDiscountLabel")}: <span className="font-semibold">{discountLabel}</span>{discount !== null && <span className="ml-2 text-xs text-muted-foreground">{t("planSavingsAmount", { amount: (Number(productPrice.currentPrice.replace(/[$,\s]/g, "")) - Number(productPrice.promotionalPrice.replace(/[$,\s]/g, ""))).toFixed(2) })}</span>}</p>
            </article>;
          })}
        </div>
      </section>}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-medium">{t("planGoalLabel")}<select value={goal} onChange={(event) => setGoal(event.target.value)} className="h-11 rounded-lg border bg-background px-3 font-normal">{["store_visits", "sales", "awareness", "leads"].map((item) => <option key={item} value={item}>{t(`planGoals.${item}` as never)}</option>)}</select></label>
        <label className="flex flex-col gap-2 text-sm font-medium">{t("planLocationLabel")}<input value={location} onChange={(event) => setLocation(event.target.value)} maxLength={160} placeholder={t("planLocationPlaceholder")} className="h-11 rounded-lg border bg-background px-3 font-normal" /></label>
        <label className="flex flex-col gap-2 text-sm font-medium">{t("planStartLabel")}<input type="date" required value={startDate} onChange={(event) => setStartDate(event.target.value)} className="h-11 rounded-lg border bg-background px-3 font-normal" /></label>
        <label className="flex flex-col gap-2 text-sm font-medium">{t("planEndLabel")}<input type="date" required value={endDate} onChange={(event) => setEndDate(event.target.value)} className="h-11 rounded-lg border bg-background px-3 font-normal" /></label>
        <label className="flex flex-col gap-2 text-sm font-medium sm:col-span-2">{t("planBudgetLabel")}<input inputMode="decimal" value={budget} onChange={(event) => setBudget(event.target.value)} maxLength={60} placeholder={t("planBudgetPlaceholder")} className="h-11 rounded-lg border bg-background px-3 font-normal" /></label>
      </div>
      <fieldset className="flex flex-col gap-2"><legend className="text-sm font-medium">{t("planPlatformsLabel")}</legend><div className="flex flex-wrap gap-2">{["Instagram", "Facebook", "TikTok", "小红书"].map((platform) => <label key={platform} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"><input type="checkbox" checked={platforms.includes(platform)} onChange={(event) => setPlatforms((current) => event.target.checked ? [...current, platform] : current.filter((item) => item !== platform))} />{platform}</label>)}</div></fieldset>
      <label className="flex flex-col gap-2 text-sm font-medium">{t("planNotesLabel")}<textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} maxLength={2000} placeholder={t("planNotesPlaceholder")} className="rounded-lg border bg-background px-3 py-2.5 font-normal" /></label>
      <p className="rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">{t("planPriceAccuracyHint")}</p>
      {error && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{t(`errors.${error}` as never)}</p>}
      <button type="submit" disabled={generating} className="inline-flex h-12 items-center justify-center self-start rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground disabled:cursor-wait disabled:opacity-60">{generating ? t("generatingMarketingPlan") : t("generateMarketingPlan")}</button>
    </form>

  </main>;
}
