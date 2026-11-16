"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { readVideoMarketingPlanHandoff, type VideoMarketingPlanHandoff } from "@/lib/ai/video-marketing-plan-handoff";
import { SUSHI_MARKETING_DEMO } from "@/lib/ai/sushi-marketing-demo";

type PostProgress = { status: "draft" | "approved" | "published"; copy: string; callToAction: string; visualDirection: string; reach: string; visits: string };
type PostProgressMap = Record<string, PostProgress>;
type ScheduledPost = NonNullable<VideoMarketingPlanHandoff["generatedPlan"]>["schedule"][number];

function SocialPlatformIcon({ platform }: { platform: string }) {
  const normalized = platform.trim().toLowerCase();
  const label = normalized === "instagram" ? "Instagram" : normalized === "facebook" ? "Facebook" : normalized === "tiktok" ? "TikTok" : normalized === "小红书" || normalized === "rednote" ? "小红书" : platform;

  if (normalized === "instagram") return <span role="img" aria-label={label} title={label} className="inline-flex size-6 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-amber-300 via-pink-500 to-violet-600 text-white shadow-sm"><svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".75" fill="currentColor" stroke="none"/></svg></span>;
  if (normalized === "facebook") return <span role="img" aria-label={label} title={label} className="inline-flex size-6 shrink-0 items-center justify-center rounded-md bg-[#1877f2] text-white shadow-sm"><svg viewBox="0 0 24 24" className="size-4" fill="currentColor"><path d="M13.5 21v-8h2.7l.4-3h-3.1V8.1c0-.9.3-1.5 1.6-1.5h1.7V3.9c-.3 0-1.4-.1-2.6-.1-2.6 0-4.3 1.6-4.3 4.5V10H7v3h2.9v8z"/></svg></span>;
  if (normalized === "tiktok") return <span role="img" aria-label={label} title={label} className="inline-flex size-6 shrink-0 items-center justify-center rounded-md bg-[#111] text-white shadow-sm"><svg viewBox="0 0 24 24" className="size-4"><path fill="#25f4ee" d="M14.2 3h3c.2 1.8 1.1 3 2.8 3.5v3a8 8 0 0 1-2.8-.9v5.8a5.6 5.6 0 1 1-5.6-5.6c.4 0 .8 0 1.2.1v3.1a2.7 2.7 0 1 0 1.2 2.4z"/><path fill="#fe2c55" d="M13.1 4.2c.7 1.4 1.7 2.2 3.2 2.6v1a8 8 0 0 1-3.2-.9z"/></svg></span>;
  if (normalized === "小红书" || normalized === "rednote") return <span role="img" aria-label={label} title={label} className="inline-flex h-6 shrink-0 items-center justify-center rounded-md bg-[#ff2442] px-1 text-[9px] font-bold text-white shadow-sm">RED</span>;
  return <span role="img" aria-label={label} title={label} className="inline-flex size-6 shrink-0 items-center justify-center rounded-md border bg-background text-[10px] font-bold text-muted-foreground">{label.slice(0, 1).toUpperCase()}</span>;
}

function isoDate(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

function calculatedDiscount(currentPrice: string | undefined, promotionalPrice: string | undefined) {
  if (!currentPrice || !promotionalPrice) return null;
  const current = Number(currentPrice.replace(/[$,\s]/g, ""));
  const promo = Number(promotionalPrice.replace(/[$,\s]/g, ""));
  if (!Number.isFinite(current) || !Number.isFinite(promo) || current <= 0 || promo < 0 || promo >= current) return null;
  return Math.round((1 - promo / current) * 100);
}

function calendarMonths(startValue: string, endValue: string) {
  const start = new Date(`${startValue}T00:00:00.000Z`);
  const end = new Date(`${endValue}T00:00:00.000Z`);
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || start > end) return [];
  const months: Array<{ year: number; month: number; cells: Array<string | null> }> = [];
  const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
  const finalMonth = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1));
  while (cursor <= finalMonth && months.length < 4) {
    const year = cursor.getUTCFullYear();
    const month = cursor.getUTCMonth();
    const offset = new Date(Date.UTC(year, month, 1)).getUTCDay();
    const count = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    const cells: Array<string | null> = Array.from({ length: offset }, () => null);
    for (let day = 1; day <= count; day++) cells.push(isoDate(new Date(Date.UTC(year, month, day))));
    while (cells.length % 7) cells.push(null);
    months.push({ year, month, cells });
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return months;
}

export function VideoMarketingCalendar({ handoffId, sample = false }: { handoffId: string; sample?: boolean }) {
  const t = useTranslations("admin.videoLab");
  const [handoff, setHandoff] = useState<VideoMarketingPlanHandoff | null>(null);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<{ src: string; alt: string } | null>(null);
  const [progress, setProgress] = useState<PostProgressMap>({});
  const [editing, setEditing] = useState<{ key: string; item: ScheduledPost } | null>(null);
  const progressKey = `postory-marketing-post-progress:${handoffId}`;

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      const saved = localStorage.getItem(progressKey);
      if (saved) { try { setProgress(JSON.parse(saved) as PostProgressMap); } catch { localStorage.removeItem(progressKey); } }
    });
    (sample ? Promise.resolve(SUSHI_MARKETING_DEMO) : readVideoMarketingPlanHandoff(handoffId)).then((value) => { if (active) setHandoff(value); }).catch(() => { if (active) setHandoff(null); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [handoffId, progressKey, sample]);

  const months = useMemo(() => handoff?.generatedPlan ? calendarMonths(handoff.formValues?.startDate ?? handoff.startDate, handoff.formValues?.endDate ?? handoff.endDate) : [], [handoff]);

  if (loading) return <p className="p-6 text-sm text-muted-foreground">{t("planLoading")}</p>;
  const currentHandoff = handoff;
  if (!currentHandoff?.generatedPlan) return <main className="mx-auto max-w-3xl px-4 py-12"><section className="rounded-2xl border bg-card p-6"><h1 className="text-xl font-semibold">{t("generatedPlanMissingTitle")}</h1><p className="mt-2 text-sm text-muted-foreground">{t("generatedPlanMissingHelp")}</p><Link href={`/admin/marketing-plan?handoff=${encodeURIComponent(handoffId)}`} className="mt-5 inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground">{t("backToPlanSetup")}</Link></section></main>;

  const plan = currentHandoff.generatedPlan;
  const form = currentHandoff.formValues;
  const products = currentHandoff.products;
  const activities = currentHandoff.activities;
  const calendarStart = form?.startDate ?? currentHandoff.startDate;
  const calendarEnd = form?.endDate ?? currentHandoff.endDate;
  const itemsByDate = new Map<string, typeof plan.schedule>();
  for (const item of plan.schedule) itemsByDate.set(item.date, [...(itemsByDate.get(item.date) ?? []), item]);

  function imageFor(productName: string) {
    const key = productName.trim().toLocaleLowerCase();
    const product = products.find((item) => item.name.trim().toLocaleLowerCase() === key || key.includes(item.name.trim().toLocaleLowerCase()));
    if (product?.optimizedImageDataUrl) return product.optimizedImageDataUrl;
    if (product?.originalImageDataUrl) return product.originalImageDataUrl;
    return activities.find((item) => item.referenceImageDataUrl)?.referenceImageDataUrl ?? null;
  }

  function savePost(key: string, value: PostProgress) {
    setProgress((current) => {
      const next = { ...current, [key]: value };
      localStorage.setItem(progressKey, JSON.stringify(next));
      return next;
    });
    setEditing(null);
  }

  function exportContentPack() {
    const lines = [`# ${plan.campaignTitle}`, "", plan.strategySummary, "", `计划周期：${calendarStart} – ${calendarEnd}`, "", `目标顾客：${plan.targetAudience}`, "", `优惠策略：${plan.offerStrategy}`, "", "## 发布内容", ""];
    plan.schedule.forEach((item, index) => {
      const key = `${item.date}:${item.platform}:${index}`;
      const itemProgress = progress[key];
      lines.push(`### ${item.date} · ${item.platform} · ${itemProgress?.status === "approved" ? "已审核" : itemProgress?.status === "published" ? "已发布" : "待审核"}`,
        `**主题：** ${item.concept}`, `**目标：** ${item.objective}`, "", itemProgress?.copy ?? item.copy, "", `**行动引导：** ${itemProgress?.callToAction ?? item.callToAction}`, `**素材建议：** ${itemProgress?.visualDirection ?? item.visualDirection}`, "");
    });
    lines.push("## 发布前确认", ...plan.confirmations.map((item) => `- ${item}`), "", "## 效果回看", ...plan.successMeasures.map((item) => `- ${item}`));
    const url = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/markdown;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `${plan.campaignTitle.replace(/[^\p{L}\p{N}-]+/gu, "-")}-执行资料.md`; anchor.click(); URL.revokeObjectURL(url);
  }

  return <main className="mx-auto flex max-w-[1440px] flex-col gap-6 px-3 py-7 sm:px-5 sm:py-10">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>{!sample && <Link href={`/admin/marketing-plan?handoff=${encodeURIComponent(handoffId)}`} className="text-sm font-medium text-primary hover:underline">← {t("backToPlanSetup")}</Link>}<p className="mt-5 text-xs font-semibold uppercase tracking-wide text-primary">{sample ? t("sushiDemoBadge") : t("generatedPlanLabel")}</p><h1 className="mt-1 text-2xl font-semibold tracking-tight">{plan.campaignTitle}</h1><p className="mt-2 max-w-4xl text-sm text-muted-foreground">{plan.strategySummary}</p></div>
      <div className="flex flex-wrap gap-2"><button type="button" onClick={exportContentPack} className="inline-flex h-10 shrink-0 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground">{t("exportContentPack")}</button>{!sample && <Link href="/admin/video-lab" className="inline-flex h-10 shrink-0 items-center justify-center rounded-lg border px-4 text-sm font-medium">{t("backToRecognition")}</Link>}</div>
    </div>

    {sample && <aside className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"><h2 className="font-semibold">{t("sushiDemoNoticeTitle")}</h2><p className="mt-1">{t("sushiDemoNoticeBody")}</p></aside>}

    <div className="grid gap-3 sm:grid-cols-2"><article className="rounded-xl border bg-card p-4"><h2 className="text-sm font-semibold">{t("planAudienceTitle")}</h2><p className="mt-2 text-sm text-muted-foreground">{plan.targetAudience}</p></article><article className="rounded-xl border bg-card p-4"><h2 className="text-sm font-semibold">{t("planOfferTitle")}</h2><p className="mt-2 text-sm text-muted-foreground">{plan.offerStrategy}</p></article></div>

    {activities.length > 0 && <section className="rounded-xl border border-primary/30 bg-primary/5 p-4"><h2 className="font-semibold">{t("planActivityContextTitle")}</h2><div className="mt-3 flex flex-wrap gap-3">{activities.map((activity) => <div key={activity.id} className="flex min-w-0 items-center gap-3 rounded-lg border bg-background p-2 sm:max-w-xl">{activity.referenceImageDataUrl && <button type="button" onClick={() => setPreview({ src: activity.referenceImageDataUrl!, alt: activity.title })} className="relative size-16 shrink-0 overflow-hidden rounded-md bg-white"><Image src={activity.referenceImageDataUrl} fill unoptimized alt={activity.title} className="object-contain" /></button>}<span><span className="block text-sm font-medium">{activity.title}</span><span className="mt-1 block text-xs text-muted-foreground">{activity.description}</span></span></div>)}</div><div className="mt-3 grid gap-2 text-sm sm:grid-cols-3"><p><span className="font-medium">{t("planActivityOfferType")}:</span> {t(`planActivityOfferTypes.${form?.activityOfferType ?? "not_set"}` as never)}</p>{form?.activityDiscount && <p><span className="font-medium">{t("planActivityDiscount")}:</span> {form.activityDiscount}</p>}{form?.activityTerms && <p className="sm:col-span-3"><span className="font-medium">{t("planActivityTerms")}:</span> {form.activityTerms}</p>}</div></section>}

    {plan.productPlans.length > 0 && <section className="rounded-xl border bg-card p-4"><h2 className="font-semibold">{t("planProductStrategies")}</h2><div className="mt-3 grid gap-3 sm:grid-cols-2">{plan.productPlans.map((item, index) => {
      const product = products.find((candidate) => candidate.name.trim().toLocaleLowerCase() === item.productName.trim().toLocaleLowerCase()) ?? products[index];
      const productPrice = product ? form?.prices[product.id] : undefined;
      const discount = calculatedDiscount(productPrice?.currentPrice, productPrice?.promotionalPrice);
      return <article key={`${item.productName}-${index}`} className="rounded-xl border p-4"><h3 className="font-semibold">{item.productName}</h3><p className="mt-2 text-sm text-muted-foreground">{item.positioning}</p><p className="mt-2 text-sm"><span className="font-medium">{t("planOfferRecommendationLabel")}:</span> {item.offerRecommendation}</p><p className="mt-2 text-sm font-semibold">{t("planPriceSummary", { currency: t("planCurrency"), current: productPrice?.currentPrice || t("planPricePending"), promo: productPrice?.promotionalPrice || t("planPricePending"), discount: discount === null ? t("planDiscountPending") : `${discount}%` })}</p></article>;
    })}</div></section>}

    <section className="rounded-2xl border bg-card p-3 shadow-sm sm:p-5">
      <div className="flex flex-col gap-1 p-2"><h2 className="text-lg font-semibold">{t("planCalendarTitle")}</h2><p className="text-sm text-muted-foreground">{calendarStart} – {calendarEnd}</p></div>
      <div className="mt-3 flex flex-col gap-6">
        {months.map(({ year, month, cells }) => <section key={`${year}-${month}`}>
          <h3 className="mb-2 px-2 text-base font-semibold">{new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(year, month, 1)))}</h3>
          <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border bg-border">
            {Array.from({ length: 7 }, (_, index) => <div key={`weekday-${index}`} className="bg-muted px-1 py-2 text-center text-xs font-medium text-muted-foreground sm:px-2">{t(`weekdays.${index}` as never)}</div>)}
            {cells.map((date, index) => {
              const inRange = date !== null && date >= calendarStart && date <= calendarEnd;
              const dayItems = date ? itemsByDate.get(date) ?? [] : [];
              return <div key={date ?? `empty-${index}`} className={`min-h-28 bg-background p-1 sm:min-h-48 sm:p-2 ${!inRange ? "opacity-40" : ""}`}>
                {date && <p className={`mb-1 text-xs ${inRange ? "font-semibold" : "text-muted-foreground"}`}>{Number(date.slice(-2))}</p>}
                {inRange && dayItems.length > 0 && <div className="flex flex-col gap-2">{dayItems.map((item, itemIndex) => {
                  const image = item.referenceImageDataUrl ?? imageFor(item.productName);
                  const workflowId = `${item.date}:${item.platform}:${plan.schedule.indexOf(item)}`;
                  const itemProgress = progress[workflowId];
                  return <article key={`${item.platform}-${itemIndex}`} className="overflow-hidden rounded-md border bg-card">
                    <div className="flex items-center justify-between gap-1 border-b bg-primary/5 px-1.5 py-1 sm:px-2"><div className="flex items-center gap-1.5"><SocialPlatformIcon platform={item.platform}/><span className="text-[9px] font-medium text-muted-foreground">{itemProgress?.status === "published" ? t("postPublished") : itemProgress?.status === "approved" ? t("postApproved") : t("postNeedsReview")}</span></div><span className="ml-auto truncate text-[10px] text-muted-foreground sm:inline">{item.productName}</span></div>
                    {image && <button type="button" onClick={() => setPreview({ src: image, alt: item.concept })} className="relative flex aspect-[4/3] w-full items-center justify-center bg-white"><Image src={image} fill unoptimized alt={item.concept} className="object-contain p-1" /></button>}
                    <div className="p-1.5 sm:p-2"><h4 className="line-clamp-2 text-[10px] font-semibold leading-snug sm:text-xs">{item.concept}</h4><p className="mt-1 line-clamp-3 whitespace-pre-wrap text-[10px] leading-snug text-muted-foreground sm:text-xs">{itemProgress?.copy ?? item.copy}</p><p className="mt-1 hidden text-[10px] sm:block"><span className="font-medium">{t("planCtaLabel")}:</span> {itemProgress?.callToAction ?? item.callToAction}</p><button type="button" onClick={() => setEditing({ key: workflowId, item })} className="mt-2 inline-flex h-7 items-center rounded-md border px-2 text-[10px] font-medium sm:text-xs">{t("reviewEditPost")}</button></div>
                  </article>;
                })}</div>}
              </div>;
            })}
          </div>
        </section>)}
      </div>
    </section>

    <div className="grid gap-4 sm:grid-cols-2"><article className="rounded-xl border bg-card p-4"><h2 className="font-semibold">{t("planBudgetStrategyTitle")}</h2><p className="mt-2 text-sm text-muted-foreground">{plan.budgetStrategy}</p></article><article className="rounded-xl border bg-card p-4"><h2 className="font-semibold">{t("planSuccessMeasuresTitle")}</h2><ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground">{plan.successMeasures.map((item, index) => <li key={index}>{item}</li>)}</ul></article></div>
    {plan.confirmations.length > 0 && <section className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-950"><h2 className="font-semibold">{t("planConfirmationsTitle")}</h2><ul className="mt-2 list-disc pl-5 text-sm">{plan.confirmations.map((item, index) => <li key={index}>{item}</li>)}</ul></section>}

    {editing && <PostReviewDialog key={editing.key} item={editing.item} initial={progress[editing.key]} title={t("reviewEditPost")} labels={{ date: editing.item.date, objective: editing.item.objective, copy: t("reviewCopyLabel"), cta: t("planCtaLabel"), visual: t("planVisualLabel"), approve: t("approvePost"), published: t("markPostPublished"), reach: t("resultReach"), visits: t("resultStoreVisits"), save: t("savePostReview"), close: t("closeImagePreview"), pending: t("postNeedsReview"), approved: t("postApproved"), publishedStatus: t("postPublished") }} onClose={() => setEditing(null)} onSave={(value) => savePost(editing.key, value)} />}

    {preview && <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"><button type="button" className="absolute inset-0 bg-black/85" onClick={() => setPreview(null)} aria-label={t("closeImagePreview")} /><div role="dialog" aria-modal="true" aria-label={preview.alt} className="relative z-10 flex max-h-full max-w-full flex-col items-end gap-2"><button type="button" onClick={() => setPreview(null)} className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-black">{t("closeImagePreview")}</button><div className="flex max-h-[85vh] max-w-[92vw] items-center justify-center overflow-hidden rounded-lg bg-white p-2"><Image src={preview.src} width={1200} height={1200} unoptimized alt={preview.alt} className="max-h-[82vh] max-w-[90vw] object-contain" /></div></div></div>}
  </main>;
}

function PostReviewDialog({ item, initial, title, labels, onClose, onSave }: { item: ScheduledPost; initial?: PostProgress; title: string; labels: Record<string, string>; onClose: () => void; onSave: (value: PostProgress) => void }) {
  const [status, setStatus] = useState<PostProgress["status"]>(initial?.status ?? "draft");
  const [copy, setCopy] = useState(initial?.copy ?? item.copy);
  const [callToAction, setCallToAction] = useState(initial?.callToAction ?? item.callToAction);
  const [visualDirection, setVisualDirection] = useState(initial?.visualDirection ?? item.visualDirection);
  const [reach, setReach] = useState(initial?.reach ?? "");
  const [visits, setVisits] = useState(initial?.visits ?? "");
  return <div className="fixed inset-0 z-[90] flex items-center justify-center overflow-y-auto bg-black/60 p-3 sm:p-6"><section role="dialog" aria-modal="true" aria-label={title} className="my-auto max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-background p-5 shadow-2xl sm:p-7"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-medium text-primary">{item.date} · {item.platform}</p><h2 className="mt-1 text-xl font-semibold">{title}</h2><p className="mt-2 text-sm text-muted-foreground">{item.objective}</p></div><button type="button" onClick={onClose} className="rounded-lg border px-3 py-2 text-sm">{labels.close}</button></div><div className="mt-5 grid gap-4"><label className="grid gap-1.5 text-sm font-medium">{labels.copy}<textarea rows={4} value={copy} onChange={(event) => setCopy(event.target.value)} className="rounded-lg border bg-background px-3 py-2 font-normal"/></label><label className="grid gap-1.5 text-sm font-medium">{labels.cta}<input value={callToAction} onChange={(event) => setCallToAction(event.target.value)} className="h-10 rounded-lg border bg-background px-3 font-normal"/></label><label className="grid gap-1.5 text-sm font-medium">{labels.visual}<textarea rows={3} value={visualDirection} onChange={(event) => setVisualDirection(event.target.value)} className="rounded-lg border bg-background px-3 py-2 font-normal"/></label><div className="flex flex-wrap gap-2"><button type="button" onClick={() => setStatus("approved")} className={`h-9 rounded-lg border px-3 text-sm ${status === "approved" ? "border-emerald-600 bg-emerald-50 text-emerald-800" : ""}`}>{labels.approve}</button><button type="button" onClick={() => setStatus("published")} className={`h-9 rounded-lg border px-3 text-sm ${status === "published" ? "border-primary bg-primary/10 text-primary" : ""}`}>{labels.published}</button><span className="self-center text-xs text-muted-foreground">{status === "approved" ? labels.approved : status === "published" ? labels.publishedStatus : labels.pending}</span></div>{status === "published" && <div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-1 text-sm">{labels.reach}<input inputMode="numeric" value={reach} onChange={(event) => setReach(event.target.value)} className="h-10 rounded-lg border bg-background px-3"/></label><label className="grid gap-1 text-sm">{labels.visits}<input inputMode="numeric" value={visits} onChange={(event) => setVisits(event.target.value)} className="h-10 rounded-lg border bg-background px-3"/></label></div>}</div><div className="mt-6 flex justify-end"><button type="button" onClick={() => onSave({ status, copy, callToAction, visualDirection, reach, visits })} className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground">{labels.save}</button></div></section></div>;
}
