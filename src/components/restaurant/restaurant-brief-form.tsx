"use client";

import { useMemo, useState } from "react";
import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { submitRestaurantCampaignBriefAction } from "@/lib/actions/restaurant-campaigns";
import { Platform } from "@/components/visual/primitives";
import { getRestaurantPlatformDistribution, getRestaurantPlatformSequence } from "@/lib/restaurant-campaign-planning";

const goalIds = ["offer-reach", "menu-views", "offer-redemptions", "online-bookings", "dish-discovery", "local-engagement"] as const;
const featuredItemIds = ["signature-dishes", "lunch-offers", "new-seasonal", "takeaway-sharing", "events", "other"] as const;
const directionIds = ["lunch-set", "new-arrival", "limited-offer", "premium-signature", "healthy-light", "seafood-feature", "signature-platter", "date-night"] as const;
const visualStyleIds = ["appetizing", "warm", "minimal", "follow-brand"] as const;
const brandVoiceIds = ["friendly", "casual", "premium", "expert"] as const;
const platformIds = ["instagram", "facebook", "tiktok"] as const;
const weekdayIds = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
const packagePlans = {
  starter: { name: "Starter", price: 149, posts: 20, perPost: "7.45" },
  growth: { name: "Growth", price: 249, posts: 30, perPost: "8.30" },
} as const;

export function RestaurantBriefForm({ referral = "" }: { referral?: string }) {
  const t = useTranslations("restaurantRequest.form");
  const [state, action, pending] = useActionState(submitRestaurantCampaignBriefAction, undefined);
  const [step, setStep] = useState(1);
  const [goal, setGoal] = useState("offer-reach");
  const [tier, setTier] = useState<keyof typeof packagePlans>("starter");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["instagram", "facebook", "tiktok"]);
  const selectedPlan = packagePlans[tier];
  const platformDistribution = useMemo(() => getRestaurantPlatformDistribution(selectedPlan.posts, selectedPlatforms), [selectedPlan.posts, selectedPlatforms]);
  const platformSequence = useMemo(() => getRestaurantPlatformSequence(selectedPlan.posts, selectedPlatforms), [selectedPlan.posts, selectedPlatforms]);
  const formErrorMessages: Record<string, string> = {
    invalidBrief: t("package.errors.invalidBrief"),
    invalidDates: t("package.errors.invalidDates"),
    choosePlatform: t("package.errors.choosePlatform"),
    tooManyPhotos: t("package.errors.tooManyPhotos"),
    photosTooLarge: t("package.errors.photosTooLarge"),
    photoTooLarge: t("package.errors.photoTooLarge"),
    invalidPhotoFormat: t("package.errors.invalidPhotoFormat"),
    saveFailed: t("package.errors.saveFailed"),
  };
  const days = useMemo(() => {
    let postIndex = 0;
    return Array.from({ length: 30 }, (_, index) => {
      const hasPost = Math.floor((index + 1) * selectedPlan.posts / 30) > Math.floor(index * selectedPlan.posts / 30);
      return { day: index + 1, hasPost, platform: hasPost ? platformSequence[postIndex++] ?? null : null };
    });
  }, [selectedPlan.posts, platformSequence]);

  return <form action={action} noValidate className="mx-auto w-full max-w-6xl rounded-2xl border bg-card p-4 shadow-sm sm:p-6">
    <input type="hidden" name="referral" value={referral}/>
    <input type="hidden" name="campaignGoal" value={goal}/>
    <input type="hidden" name="serviceTier" value={tier}/>
    <div className="mb-6 grid grid-cols-3 gap-2" aria-label="制作流程">
      {[t("steps.goal"), t("steps.direction"), t("steps.package")].map((label, index) => <button key={label} type="button" onClick={() => setStep(index + 1)} aria-current={step === index + 1 ? "step" : undefined} className={`flex items-center gap-2 border-b-2 pb-2 text-left text-xs sm:text-sm ${step === index + 1 ? "border-primary font-semibold text-foreground" : "border-border text-muted-foreground"}`}><span className={`grid size-6 shrink-0 place-items-center rounded-full border text-xs ${step === index + 1 ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>{index + 1}</span><span>{label}</span></button>)}
    </div>

    {step === 1 && <section>
      <h2 className="text-lg font-semibold">{t("goal.title")}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{t("goal.description")}</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{goalIds.map((id) => <button key={id} type="button" onClick={() => setGoal(id)} aria-pressed={goal === id} className={`min-h-24 rounded-xl border p-4 text-left transition ${goal === id ? "border-primary bg-primary/[0.04] ring-1 ring-primary" : "hover:border-primary/50"}`}><span className="font-medium">{t(`goal.goals.${id}.title`)}</span><span className="mt-2 block text-xs leading-5 text-muted-foreground">{t(`goal.goals.${id}.metric`)}</span></button>)}</div>
      <div className="mt-4 rounded-xl border p-4"><p className="text-sm font-medium">{t("goal.activityTitle")}</p><p className="mt-1 text-xs text-muted-foreground">{t("goal.activityHint")}</p><div className="mt-3 grid gap-3 sm:grid-cols-2"><label className="grid gap-1.5 text-sm">{t("goal.startDate")}<input name="campaignStartDate" type="date" className="rounded-lg border bg-background px-3 py-2"/></label><label className="grid gap-1.5 text-sm">{t("goal.endDate")}<input name="campaignEndDate" type="date" className="rounded-lg border bg-background px-3 py-2"/></label></div></div>
      <div className="mt-5 flex justify-end"><button type="button" onClick={() => setStep(2)} className="rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">{t("goal.next")}</button></div>
    </section>}

    {step === 2 && <section>
      <h2 className="text-lg font-semibold">{t("direction.title")}</h2><p className="mt-1 text-sm text-muted-foreground">{t("direction.description")}</p>
      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="grid gap-5">
          <fieldset><legend className="mb-2 text-sm font-medium">{t("direction.featuredTitle")} <span className="ml-1 text-xs font-normal text-muted-foreground">{t("direction.multiSelect")}</span></legend><div className="grid gap-2 sm:grid-cols-2">{featuredItemIds.map((value) => <label key={value} className="flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition has-[:checked]:border-primary has-[:checked]:bg-primary/[0.04]"><input type="checkbox" name="featuredItems" value={value} className="mt-1 accent-primary"/><span><span className="block text-sm font-medium">{t(`direction.featured.${value}.title`)}</span><span className="mt-0.5 block text-xs text-muted-foreground">{t(`direction.featured.${value}.hint`)}</span></span></label>)}</div></fieldset>
          <label className="grid gap-1.5 text-sm">{t("direction.specificOffer")}<textarea name="specificOffer" rows={3} maxLength={1500} placeholder={t("direction.specificOfferPlaceholder")} className="rounded-lg border bg-background px-3 py-2.5"/></label>
          <label className="grid gap-1.5 text-sm">{t("direction.campaignDetails")}<textarea required name="campaignDetails" rows={3} maxLength={3000} placeholder={t("direction.campaignDetailsPlaceholder")} className="rounded-lg border bg-background px-3 py-2.5"/></label>
          <label className="grid gap-1.5 text-sm">{t("direction.audience")}<input name="targetAudience" maxLength={300} placeholder={t("direction.audiencePlaceholder")} className="rounded-lg border bg-background px-3 py-2.5"/></label>
          <fieldset><legend className="mb-2 text-sm font-medium">{t("direction.directionTitle")}</legend><div className="grid gap-2 sm:grid-cols-2"><label className="text-sm">{t("direction.campaignDirection")}<select name="campaignDirection" className="mt-1.5 w-full rounded-lg border bg-background px-3 py-2">{directionIds.map((id) => <option key={id} value={id}>{t(`direction.directions.${id}`)}</option>)}</select></label><label className="text-sm">{t("direction.postWindow")}<select name="preferredPostWindow" className="mt-1.5 w-full rounded-lg border bg-background px-3 py-2">{(["flexible", "lunch", "evening"] as const).map((id) => <option key={id} value={id}>{t(`direction.windows.${id}`)}</option>)}</select></label></div></fieldset>
          <fieldset><legend className="mb-2 text-sm font-medium">{t("direction.visualStyleTitle")}</legend><div className="grid gap-2 sm:grid-cols-2">{visualStyleIds.map((id, index) => <label key={id} className="flex items-center gap-2 rounded-xl border p-3 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/[0.04]"><input type="radio" name="visualStyle" value={id} defaultChecked={index === 0} className="accent-primary"/><span><span className="block font-medium">{t(`direction.visualStyles.${id}.title`)}</span><span className="block text-xs text-muted-foreground">{t(`direction.visualStyles.${id}.hint`)}</span></span></label>)}</div></fieldset>
          <div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-1.5 text-sm">{t("direction.brandVoice")}<select name="brandVoice" className="rounded-lg border bg-background px-3 py-2">{brandVoiceIds.map((id) => <option key={id} value={id}>{t(`direction.brandVoices.${id}`)}</option>)}</select></label><label className="grid gap-1.5 text-sm">{t("direction.languagePreference")}<select name="languagePreference" className="rounded-lg border bg-background px-3 py-2"><option value="en">{t("direction.languages.en")}</option><option value="zh">{t("direction.languages.zh")}</option></select></label></div>
          <fieldset><legend className="mb-2 text-sm font-medium">{t("direction.platformsTitle")} <span className="text-xs font-normal text-muted-foreground">{t("direction.platformsHint")}</span></legend><div className="flex flex-wrap gap-x-5 gap-y-2">{platformIds.map((value) => <label key={value} className="inline-flex items-center gap-2 text-sm"><input type="checkbox" name="platforms" value={value} checked={selectedPlatforms.includes(value)} onChange={(event) => setSelectedPlatforms((current) => { if (event.target.checked) return [...current, value]; const next = current.filter((platform) => platform !== value); return next.length ? next : current; })} className="accent-primary"/>{t(`direction.platformNames.${value}`)}</label>)}</div></fieldset>
          <div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-1.5 text-sm">{t("direction.brandReferences")}<input name="brandReferences" maxLength={500} placeholder={t("direction.brandReferencesPlaceholder")} className="rounded-lg border bg-background px-3 py-2"/></label><label className="grid gap-1.5 text-sm">{t("direction.photos")}<input name="referenceFiles" type="file" accept="image/png,image/jpeg,image/webp" multiple className="rounded-lg border bg-background p-2 text-xs"/><span className="text-xs text-muted-foreground">{t("direction.photosHint")}</span></label></div>
          <label className="grid gap-1.5 text-sm">{t("direction.restrictions")}<textarea name="contentRestrictions" rows={2} maxLength={1000} placeholder={t("direction.restrictionsPlaceholder")} className="rounded-lg border bg-background px-3 py-2.5"/></label>
        </div>
        <aside className="h-fit rounded-xl border bg-muted/30 p-4"><p className="text-xs font-semibold uppercase tracking-wider text-primary">{t("direction.previewLabel")}</p><div className="mt-3 flex aspect-[4/3] flex-col justify-end rounded-lg border border-dashed bg-gradient-to-br from-muted to-background p-4"><span className="text-xs text-muted-foreground">{t("direction.previewImage")}</span><strong className="mt-2 text-lg">{t("direction.previewTitle")}</strong></div><p className="mt-3 text-xs leading-5 text-muted-foreground">{t("direction.previewHint")}</p></aside>
      </div>
      <div className="mt-5 flex items-center justify-between"><button type="button" onClick={() => setStep(1)} className="rounded-lg border px-4 py-2.5 text-sm">{t("direction.back")}</button><button type="button" onClick={() => setStep(3)} className="rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">{t("direction.next")}</button></div>
    </section>}

    {step === 3 && <section>
      <h2 className="text-lg font-semibold">{t("package.title")}</h2><p className="mt-1 text-sm text-muted-foreground">{t("package.description")}</p>
      <div className="mt-5">
        <div><div className="grid gap-3 sm:grid-cols-2">{(Object.entries(packagePlans) as [keyof typeof packagePlans, typeof packagePlans[keyof typeof packagePlans]][]).map(([id, plan]) => <button key={id} type="button" onClick={() => setTier(id)} aria-pressed={tier === id} className={`rounded-xl border p-4 text-left transition ${tier === id ? "border-primary bg-primary/[0.04] ring-1 ring-primary" : "hover:border-primary/50"}`}><span className="flex items-center justify-between font-semibold">{plan.name}{id === "growth" && <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] text-primary">{t("package.moreContent")}</span>}</span><span className="mt-3 block text-3xl font-bold tracking-tight text-primary">€{plan.perPost}<span className="ml-1 text-base font-semibold">{t("package.perPost")}</span></span><span className="mt-1 block text-sm text-muted-foreground">€{(plan.price / 30).toFixed(2)} {t("package.dailyRate")} · {plan.posts} {t("package.monthlyContent")}</span><span className="mt-2 block text-xs text-muted-foreground">{t("package.monthlyFee")} €{plan.price} {t("package.perMonth")} · {t("package.examplePrice")}</span></button>)}</div>
          <section className="mt-4 rounded-xl border bg-card p-4"><div className="flex flex-wrap items-baseline justify-between gap-2"><h3 className="font-semibold">{t("package.calendarTitle", { name: selectedPlan.name })}</h3><span className="text-sm font-semibold text-primary">{t("package.postCount", { count: selectedPlan.posts })}</span></div><p className="mt-1 text-xs text-muted-foreground">{t("package.calendarHint")}</p><div className="mt-3 flex flex-wrap gap-2">{platformDistribution.map(({ id, label, count }) => <span key={id} className="inline-flex items-center gap-1.5 rounded-full border bg-background px-2.5 py-1 text-xs"><Platform name={id} size={16}/><span>{t("package.platformPostCount", { platform: label, count })}</span></span>)}</div><div className="mt-3 grid grid-cols-7 gap-1.5 text-center">{weekdayIds.map((day) => <span key={day} className="py-1 text-[10px] font-medium text-muted-foreground">{t(`package.weekdays.${day}`)}</span>)}{days.map(({ day, hasPost, platform }) => <div key={day} className={`min-h-20 rounded-md border p-1.5 text-left text-[10px] ${hasPost ? "border-primary/40 bg-primary/[0.06]" : "border-border text-muted-foreground"}`}><span>{day}</span>{platform && <span className="restaurant-request-calendar-platforms mt-2 flex items-center gap-1"><Platform name={platform} size={28}/></span>}</div>)}</div></section>
          <div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="grid gap-1.5 text-sm">{t("package.contactName")}<input name="contactName" autoComplete="name" className="rounded-lg border bg-background px-3 py-2.5" placeholder={t("package.contactNamePlaceholder")}/></label><label className="grid gap-1.5 text-sm">{t("package.email")}<input name="contactEmail" type="email" autoComplete="email" className="rounded-lg border bg-background px-3 py-2.5" placeholder="you@example.com"/></label><label className="grid gap-1.5 text-sm">{t("package.phone")}<input name="contactPhone" type="tel" className="rounded-lg border bg-background px-3 py-2.5"/></label><label className="grid gap-1.5 text-sm">{t("package.businessName")}<input name="businessName" className="rounded-lg border bg-background px-3 py-2.5" placeholder={t("package.businessNamePlaceholder")}/></label><label className="grid gap-1.5 text-sm">{t("package.location")}<input name="location" className="rounded-lg border bg-background px-3 py-2.5" placeholder={t("package.locationPlaceholder")}/></label><label className="grid gap-1.5 text-sm">{t("package.website")}<input name="websiteUrl" type="url" placeholder="https://" className="rounded-lg border bg-background px-3 py-2.5"/></label></div>
        </div>
      </div>
      {state?.error && <p role="alert" className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{formErrorMessages[state.error] ?? state.error}</p>}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t pt-4"><button type="button" onClick={() => setStep(2)} className="rounded-lg border px-4 py-2.5 text-sm">{t("package.back")}</button><p className="text-xs text-muted-foreground">{t("package.stepLabel")}</p><button type="submit" disabled={pending} className="rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60">{pending ? t("package.submitting") : t("package.submit")}</button></div>
    </section>}
  </form>;
}
