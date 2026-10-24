"use client";

import { useActionState } from "react";
import { submitRestaurantCampaignBriefAction } from "@/lib/actions/restaurant-campaigns";

const directions = [["new-arrival", "New menu arrival"], ["lunch-set", "Lunch set"], ["healthy-light", "Fresh and healthy"], ["limited-offer", "Limited time offer"], ["seafood-feature", "Seafood feature"], ["premium-signature", "Signature dish"], ["signature-platter", "Sharing platter"], ["date-night", "Date night"]];
export function RestaurantBriefForm({ referral = "" }: { referral?: string }) {
  const [state, action, pending] = useActionState(submitRestaurantCampaignBriefAction, undefined);
  return <form action={action} className="mx-auto grid w-full max-w-3xl gap-5 rounded-2xl border bg-card p-6 shadow-sm md:grid-cols-2">
    <input type="hidden" name="referral" value={referral} />
    <label className="grid gap-1.5 text-sm">Your name *<input required name="contactName" autoComplete="name" className="rounded-lg border px-3 py-2" /></label>
    <label className="grid gap-1.5 text-sm">Email *<input required name="contactEmail" type="email" autoComplete="email" className="rounded-lg border px-3 py-2" /></label>
    <label className="grid gap-1.5 text-sm">Phone<input name="contactPhone" type="tel" className="rounded-lg border px-3 py-2" /></label>
    <label className="grid gap-1.5 text-sm">Restaurant name *<input required name="businessName" className="rounded-lg border px-3 py-2" /></label>
    <label className="grid gap-1.5 text-sm">Location *<input required name="location" placeholder="Town, Ireland" className="rounded-lg border px-3 py-2" /></label>
    <label className="grid gap-1.5 text-sm">Website or social link<input name="websiteUrl" type="url" placeholder="https://" className="rounded-lg border px-3 py-2" /></label>
    <label className="grid gap-1.5 text-sm">Campaign direction *<select required name="campaignDirection" className="rounded-lg border px-3 py-2">{directions.map(([v, t]) => <option key={v} value={v}>{t}</option>)}</select></label>
    <label className="grid gap-1.5 text-sm">Main goal *<select required name="campaignGoal" className="rounded-lg border px-3 py-2"><option value="weekday-visits">More weekday visits</option><option value="new-menu">Launch a menu item</option><option value="group-bookings">Group bookings</option><option value="brand-awareness">Local awareness</option></select></label>
    <label className="grid gap-1.5 text-sm">Promotion starts<input name="campaignStartDate" type="date" className="rounded-lg border px-3 py-2" /></label>
    <label className="grid gap-1.5 text-sm">Promotion ends<input name="campaignEndDate" type="date" className="rounded-lg border px-3 py-2" /></label>
    <label className="grid gap-1.5 text-sm">Preferred posting time<select name="preferredPostWindow" className="rounded-lg border px-3 py-2"><option value="flexible">Flexible</option><option value="lunch">Lunch</option><option value="evening">Evening</option></select></label>
    <label className="grid gap-1.5 text-sm">Content language<select name="languagePreference" className="rounded-lg border px-3 py-2"><option value="en">English</option><option value="zh">中文</option></select></label>
    <fieldset className="grid gap-2 text-sm md:col-span-2"><legend>Where do you want us to publish? *</legend>{[["instagram", "Instagram"], ["facebook", "Facebook"], ["tiktok", "TikTok"]].map(([v, t]) => <label key={v} className="mr-5 inline-flex items-center gap-2"><input type="checkbox" name="platforms" value={v} />{t}</label>)}</fieldset>
    <label className="grid gap-1.5 text-sm md:col-span-2">What should we know? *<textarea required minLength={10} maxLength={3000} name="campaignDetails" rows={5} placeholder="Describe the dish or offer, ideal customer, tone, price, and any details that must appear." className="rounded-lg border px-3 py-2" /></label>
    <label className="grid gap-1.5 text-sm md:col-span-2">Reference photos (up to 6)<input name="referenceFiles" type="file" accept="image/png,image/jpeg,image/webp" multiple className="rounded-lg border p-2" /><span className="text-muted-foreground">Photos help us match your real dishes and brand.</span></label>
    {state?.error && <p role="alert" className="text-sm text-destructive md:col-span-2">{state.error}</p>}
    <button disabled={pending} className="rounded-lg bg-primary px-5 py-3 font-medium text-primary-foreground disabled:opacity-60 md:col-span-2">{pending ? "Sending…" : "Send campaign brief"}</button>
    <p className="text-xs text-muted-foreground md:col-span-2">This request starts a content review. Posting dates are confirmed after you approve the finished content.</p>
  </form>;
}
