"use client";

import { useMemo, useState } from "react";
import { useActionState } from "react";
import { ChevronLeft, ChevronRight, Clock3, ImagePlus, Send } from "lucide-react";
import { decideRestaurantCampaignContentFormAction, submitRestaurantPlanItemInfoAction } from "@/lib/actions/restaurant-campaigns";

type Reference = { id: string; storageKey: string; mimeType: string };
type Submission = { id: string; note: string | null; date: Date; createdAt: Date; references: Reference[] };
type Content = { id: string; title: string; caption: string; storageKey: string; status: string; scheduledAt: Date | null; revisionNote: string | null } | null;
export type PlanItem = { id: string; date: Date; scheduledTime: string | null; title: string; theme: string; objective: string; concept: string; platforms: string[]; status: string; content: Content; submissions: Submission[]; previewImage?: string };

const statusCopy: Record<string, string> = { PLANNED: "Planned", IN_PRODUCTION: "In production", AWAITING_APPROVAL: "Needs your review", APPROVED: "Approved", SCHEDULED: "Scheduled", PUBLISHED: "Published", FAILED: "Needs attention" };
const platformShort: Record<string, string> = { instagram: "IG", facebook: "FB", tiktok: "TikTok" };
const platformLabel: Record<string, string> = { instagram: "Instagram", facebook: "Facebook", tiktok: "TikTok" };
const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function dayKey(date: Date) { return date.toISOString().slice(0, 10); }
function localDate(date: Date) { const [year, month, day] = dayKey(date).split("-").map(Number); return new Date(year, month - 1, day, 12); }
function localKey(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
function parseDay(key: string) { const [year, month, day] = key.split("-").map(Number); return new Date(year, month - 1, day); }
function monthStart(date: Date) { return new Date(date.getFullYear(), date.getMonth(), 1); }
function shiftMonth(date: Date, amount: number) { return new Date(date.getFullYear(), date.getMonth() + amount, 1); }
function prettyDate(key: string) { return parseDay(key).toLocaleDateString("en-IE", { weekday: "long", day: "numeric", month: "long", year: "numeric" }); }

export function RestaurantMarketingCalendar({ briefId, planId, startDate, endDate, items, submissions, cadence, readOnly = false }: {
  briefId: string; planId: string; startDate: Date; endDate: Date; items: PlanItem[]; submissions: Submission[]; cadence?: string; readOnly?: boolean;
}) {
  const firstEvent = items[0]?.date ?? startDate;
  const [month, setMonth] = useState(monthStart(localDate(firstEvent)));
  const [selectedDate, setSelectedDate] = useState(dayKey(firstEvent));
  const [selectedItemId, setSelectedItemId] = useState(items.find((item) => dayKey(item.date) === dayKey(firstEvent))?.id ?? "");
  const startKey = dayKey(startDate), endKey = dayKey(endDate);
  const itemsByDate = useMemo(() => {
    const result = new Map<string, PlanItem[]>();
    for (const item of items) {
      const key = dayKey(item.date);
      result.set(key, [...(result.get(key) ?? []), item]);
    }
    return result;
  }, [items]);
  const dateItems = itemsByDate.get(selectedDate) ?? [];
  const selectedItem = dateItems.find((item) => item.id === selectedItemId) ?? dateItems[0] ?? null;
  const itemReference = selectedItem?.submissions.flatMap((submission) => submission.references)[0] ?? null;
  const previewImage = selectedItem?.content ? `/api/restaurant-campaign-media/${selectedItem.content.storageKey}` : selectedItem?.previewImage ?? (itemReference ? `/api/restaurant-campaign-media/${itemReference.storageKey}` : readOnly ? "/demo/photos/sushi-salmon-nigiri.png" : null);
  const previewImageLabel = selectedItem?.content ? "Content preview" : selectedItem?.previewImage || readOnly ? "Creative direction sample" : itemReference ? "Your reference photo" : "Creative preview";
  const dateSubmissions = submissions.filter((submission) => dayKey(submission.date) === selectedDate);
  const submittedDates = new Set(submissions.map((submission) => dayKey(submission.date)));
  const firstWeekday = (monthStart(month).getDay() + 6) % 7;
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = Array.from({ length: Math.ceil((firstWeekday + daysInMonth) / 7) * 7 }, (_, index) => {
    const dayNumber = index - firstWeekday + 1;
    return dayNumber < 1 || dayNumber > daysInMonth ? null : new Date(month.getFullYear(), month.getMonth(), dayNumber);
  });
  const minMonth = monthStart(localDate(startDate)).getTime(), maxMonth = monthStart(localDate(endDate)).getTime();

  function selectDate(key: string) {
    setSelectedDate(key);
    const next = itemsByDate.get(key) ?? [];
    setSelectedItemId(next[0]?.id ?? "");
  }

  return <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.85fr)]">
    <section className="rounded-2xl border bg-card p-3 shadow-sm sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><p className="text-xs font-semibold uppercase tracking-wider text-primary">Marketing calendar</p><h2 className="mt-1 text-lg font-semibold">Your upcoming posts</h2>{cadence && <p className="mt-1 text-xs text-muted-foreground">Posting rhythm: {cadence}</p>}</div>
        <div className="flex items-center gap-2"><button type="button" aria-label="Previous month" disabled={month.getTime() <= minMonth} onClick={() => setMonth((current) => shiftMonth(current, -1))} className="grid size-8 place-items-center rounded-lg border disabled:opacity-35"><ChevronLeft size={16}/></button><p className="min-w-28 text-center text-sm font-medium">{month.toLocaleDateString("en-IE", { month: "long", year: "numeric" })}</p><button type="button" aria-label="Next month" disabled={month.getTime() >= maxMonth} onClick={() => setMonth((current) => shiftMonth(current, 1))} className="grid size-8 place-items-center rounded-lg border disabled:opacity-35"><ChevronRight size={16}/></button></div>
      </div>
      <div className="mt-4 grid grid-cols-7 border-b pb-2 text-center text-[10px] font-medium text-muted-foreground sm:text-xs">{weekdays.map((day) => <span key={day}>{day}</span>)}</div>
      <div className="grid grid-cols-7 gap-1 pt-1">
        {cells.map((date, index) => {
          if (!date) return <div key={`blank-${index}`} className="min-h-16 rounded-md sm:min-h-24"/>;
          const key = localKey(date), inPlan = key >= startKey && key <= endKey, dayItems = itemsByDate.get(key) ?? [], selected = key === selectedDate;
          return <div key={key} className={`relative min-h-16 rounded-md border p-1 transition sm:min-h-24 sm:p-1.5 ${selected ? "border-primary bg-primary/5 ring-1 ring-primary" : inPlan ? "border-border hover:border-primary/60" : "border-transparent opacity-30"}`}>
            <button type="button" disabled={!inPlan} onMouseEnter={() => inPlan && selectDate(key)} onFocus={() => inPlan && selectDate(key)} onClick={() => selectDate(key)} aria-label={`${prettyDate(key)}${dayItems.length ? `, ${dayItems.map((item) => `${item.title} on ${item.platforms.join(", ")}`).join("; ")}` : ", no planned post"}`} className="absolute inset-0 z-0 rounded-md disabled:cursor-default"/>
            <span className={`pointer-events-none relative z-[1] grid size-6 place-items-center rounded-full text-xs ${selected ? "bg-primary text-primary-foreground" : ""}`}>{date.getDate()}</span>
            <div className="pointer-events-none relative z-[1] mt-1 grid gap-1">
              {dayItems.slice(0, 2).map((item) => <span key={item.id} className="block rounded bg-violet-500/10 px-1 py-0.5 text-[8px] font-medium leading-3 text-violet-800 sm:text-[9px]"><span className="block truncate">{item.title}</span><span className="mt-0.5 flex items-center gap-1">{item.platforms.map((platform) => <PlatformIcon key={platform} platform={platform} compact />)}</span></span>)}
              {dayItems.length > 2 && <span className="text-[9px] text-muted-foreground">+{dayItems.length - 2} more</span>}
              {submittedDates.has(key) && <span className="block truncate text-[9px] font-medium text-emerald-700">Details sent</span>}
            </div>
          </div>;
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t pt-3 text-[10px] text-muted-foreground sm:text-xs"><span>Hover or select a date to preview its direction and platform.</span></div>
    </section>

    <section className="grid content-start overflow-hidden rounded-2xl border bg-card shadow-sm xl:sticky xl:top-24 xl:max-h-[calc(100vh-8rem)] xl:overflow-y-auto">
        <div className="border-b bg-muted/30 px-4 py-3 sm:px-5"><p className="text-[10px] uppercase tracking-widest text-primary">Date preview</p><h2 className="mt-1 text-base font-semibold">{prettyDate(selectedDate)}</h2></div>
        <div className="grid gap-4 p-4 sm:p-5">
          {dateItems.length > 1 && <label className="grid gap-1.5 text-sm font-medium">Marketing moment<select value={selectedItem?.id ?? ""} onChange={(event) => setSelectedItemId(event.target.value)} className="rounded-lg border bg-background px-3 py-2">{dateItems.map((item) => <option key={item.id} value={item.id}>{item.scheduledTime ? `${item.scheduledTime} · ` : ""}{item.title}</option>)}</select></label>}
          {selectedItem ? <div className="grid gap-4"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-semibold uppercase tracking-wider text-primary">{selectedItem.theme}</p><h3 className="mt-1 text-sm font-semibold">{selectedItem.title}</h3></div><span className="shrink-0 rounded-full bg-muted px-2 py-1 text-[10px]">{statusCopy[selectedItem.status] ?? selectedItem.status}</span></div>
            {previewImage ? <div className="relative overflow-hidden rounded-xl border bg-muted"><img src={previewImage} alt={selectedItem.content?.title ?? selectedItem.title} className="aspect-[4/3] w-full object-cover"/><span className="absolute left-3 top-3 rounded-full bg-black/65 px-2.5 py-1 text-[10px] font-medium text-white">{previewImageLabel}</span>{!selectedItem.content && <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-4 pb-4 pt-14 text-white"><p className="text-sm font-semibold">{selectedItem.title}</p><p className="mt-1 text-[11px] leading-4 text-white/85">{selectedItem.objective}</p></div>}</div> : <div className="relative flex aspect-[4/3] flex-col justify-end overflow-hidden rounded-xl border bg-gradient-to-br from-rose-100 via-orange-50 to-amber-100 p-5"><span className="absolute right-5 top-5 size-24 rounded-full bg-white/60 blur-2xl"/><span className="relative text-[10px] font-semibold uppercase tracking-widest text-rose-800">Creative in progress</span><p className="relative mt-2 text-lg font-semibold text-slate-900">{selectedItem.title}</p><p className="relative mt-1 text-xs leading-5 text-slate-700">{selectedItem.objective}</p></div>}
            <div className="rounded-lg bg-muted/40 p-3"><div className="flex items-center justify-between gap-2"><p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Promotion direction</p>{selectedItem.scheduledTime && <p className="inline-flex shrink-0 items-center gap-1 text-[10px] text-muted-foreground"><Clock3 size={12}/>{selectedItem.scheduledTime}</p>}</div><p className="mt-1.5 text-xs leading-5">{selectedItem.objective}</p><p className="mt-2 text-[11px] leading-5 text-muted-foreground">{selectedItem.concept}</p></div>
            <div className="flex flex-wrap gap-1.5">{selectedItem.platforms.map((platform) => <span key={platform} className="inline-flex items-center gap-1.5 rounded-full border bg-background px-2.5 py-1 text-[10px]"><PlatformIcon platform={platform}/>{platformLabel[platform] ?? platform}</span>)}</div>
            {selectedItem.content && <div className="rounded-xl border bg-background p-3"><p className="text-xs font-medium">{selectedItem.content.title} · {statusCopy[selectedItem.content.status] ?? selectedItem.content.status}</p><p className="mt-2 whitespace-pre-wrap text-xs leading-5">{selectedItem.content.caption}</p>{selectedItem.content.revisionNote && <p className="mt-2 rounded bg-muted p-2 text-xs">Requested change: {selectedItem.content.revisionNote}</p>}{["AWAITING_APPROVAL", "REVISION_REQUESTED"].includes(selectedItem.content.status) && <div className="mt-3 flex flex-wrap gap-2"><form action={decideRestaurantCampaignContentFormAction}><input type="hidden" name="token" value=""/><input type="hidden" name="contentId" value={selectedItem.content.id}/><input type="hidden" name="decision" value="APPROVED"/><button className="rounded-lg bg-primary px-3 py-2 text-xs text-primary-foreground">Approve content</button></form><form action={decideRestaurantCampaignContentFormAction} className="flex flex-1 gap-2"><input type="hidden" name="token" value=""/><input type="hidden" name="contentId" value={selectedItem.content.id}/><input type="hidden" name="decision" value="REVISION_REQUESTED"/><input required minLength={5} maxLength={2000} name="revisionNote" placeholder="What should we change?" className="min-w-0 flex-1 rounded-lg border px-2 py-1.5 text-xs"/><button className="rounded-lg border px-2 py-1.5 text-xs">Request change</button></form></div>}</div>}
          </div> : <div className="rounded-xl border border-dashed p-4"><p className="font-medium">No post is planned for this day yet.</p><p className="mt-1 text-sm text-muted-foreground">Share what you’d like to promote, and we’ll add it to the calendar.</p></div>}

          {dateSubmissions.length ? <div className="grid gap-2"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Information you’ve sent</p>{dateSubmissions.map((submission) => <div key={submission.id} className="rounded-lg bg-muted/60 p-3 text-xs"><p>{submission.note || "Reference photos attached"}</p><div className="mt-2 flex gap-2">{submission.references.map((reference) => <img key={reference.id} src={`/api/restaurant-campaign-media/${reference.storageKey}`} alt="Your reference" className="size-12 rounded object-cover"/>)}</div></div>)}</div> : null}

          {!readOnly && <PlanItemInfoForm key={`${selectedDate}:${selectedItem?.id ?? "general"}`} briefId={briefId} planId={planId} planItemId={selectedItem?.id ?? ""} date={selectedDate}/>}
        </div>
      {!readOnly && <div className="px-4 pb-4 text-[10px] leading-4 text-muted-foreground">Add details or photos for your team below. The finished content will appear here for review.</div>}
    </section>
  </div>;
}

function PlatformIcon({ platform, compact = false }: { platform: string; compact?: boolean }) {
  const size = compact ? 12 : 14;
  if (platform === "instagram") return <svg aria-label="Instagram" role="img" width={size} height={size} viewBox="0 0 24 24" className="shrink-0"><defs><linearGradient id="instagram-gradient" x1="0" x2="1" y1="1" y2="0"><stop stopColor="#feda75"/><stop offset=".45" stopColor="#d62976"/><stop offset="1" stopColor="#4f5bd5"/></linearGradient></defs><rect x="2" y="2" width="20" height="20" rx="6" fill="url(#instagram-gradient)"/><rect x="6.5" y="6.5" width="11" height="11" rx="3.5" fill="none" stroke="white" strokeWidth="1.7"/><circle cx="12" cy="12" r="2.5" fill="none" stroke="white" strokeWidth="1.7"/><circle cx="17.1" cy="6.9" r="1" fill="white"/></svg>;
  if (platform === "facebook") return <svg aria-label="Facebook" role="img" width={size} height={size} viewBox="0 0 24 24" className="shrink-0"><circle cx="12" cy="12" r="11" fill="#1877F2"/><path fill="white" d="M13.5 20v-7h2.35l.35-2.72H13.5V8.54c0-.79.22-1.33 1.36-1.33h1.45V4.78c-.25-.03-1.1-.1-2.1-.1-2.08 0-3.5 1.27-3.5 3.6v2H8.36V13h2.35v7z"/></svg>;
  if (platform === "tiktok") return <svg aria-label="TikTok" role="img" width={size} height={size} viewBox="0 0 24 24" className="shrink-0"><path fill="#111" d="M16.5 3c.3 2.2 1.55 3.55 3.5 3.7v3.1a8.2 8.2 0 0 1-3.5-1v6.35a5.85 5.85 0 1 1-5.85-5.85c.42 0 .84.05 1.24.14v3.2a2.7 2.7 0 1 0 1.4 2.37V3z"/><path fill="#25F4EE" d="M15.4 4.3c.55 1.6 1.65 2.55 3.3 2.85v1.05a8.2 8.2 0 0 1-3.3-1zM10.65 12.3c.42 0 .84.05 1.24.14v1.2a2.7 2.7 0 1 0 1.4 2.37v1.2a2.7 2.7 0 1 1-2.64-4.91"/></svg>;
  return <span aria-hidden="true" className="size-3 rounded-full bg-muted-foreground"/>;
}

function PlanItemInfoForm({ briefId, planId, planItemId, date }: { briefId: string; planId: string; planItemId: string; date: string }) {
  const [state, action, pending] = useActionState(submitRestaurantPlanItemInfoAction, undefined);
  return <form action={action} className="grid gap-3 border-t pt-4">
    <input type="hidden" name="briefId" value={briefId}/><input type="hidden" name="planId" value={planId}/><input type="hidden" name="planItemId" value={planItemId}/><input type="hidden" name="date" value={date}/>
    <div><p className="font-semibold">Add details for your team</p><p className="mt-1 text-xs text-muted-foreground">Add dish details, pricing, brand preferences, or other context before we create the post.</p></div>
    <textarea name="note" rows={4} maxLength={5000} placeholder="For example: use the salmon dragon roll, mention our lunch set price, avoid showing alcohol…" className="rounded-lg border bg-background px-3 py-2 text-sm"/>
    <label className="grid cursor-pointer gap-1 rounded-lg border border-dashed p-3 text-sm"><span className="inline-flex items-center gap-2 font-medium"><ImagePlus size={16}/>Add reference photos</span><span className="text-xs text-muted-foreground">Up to 6 images · 10 MB total</span><input name="referenceFiles" type="file" accept="image/png,image/jpeg,image/webp" multiple className="mt-1 block w-full text-xs"/></label>
    {state?.error && <p role="alert" className="text-sm text-destructive">{state.error}</p>}{state?.ok && <p role="status" className="text-sm text-emerald-700">{state.message}</p>}
    <button disabled={pending} className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60"><Send size={15}/>{pending ? "Sending…" : "Send information to the team"}</button>
  </form>;
}
