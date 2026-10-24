"use client";

import { useMemo, useState } from "react";
import { useActionState } from "react";
import { ChevronLeft, ChevronRight, Clock3, ImagePlus, Send } from "lucide-react";
import { decideRestaurantCampaignContentFormAction, submitRestaurantPlanItemInfoAction } from "@/lib/actions/restaurant-campaigns";

type Reference = { id: string; storageKey: string; mimeType: string };
type Submission = { id: string; note: string | null; date: Date; createdAt: Date; references: Reference[] };
type Content = { id: string; title: string; caption: string; storageKey: string; status: string; scheduledAt: Date | null; revisionNote: string | null } | null;
type PlanItem = { id: string; date: Date; scheduledTime: string | null; title: string; theme: string; objective: string; concept: string; platforms: string[]; status: string; content: Content; submissions: Submission[] };

const statusCopy: Record<string, string> = { PLANNED: "Planned", IN_PRODUCTION: "In production", AWAITING_APPROVAL: "Needs your review", APPROVED: "Approved", SCHEDULED: "Scheduled", PUBLISHED: "Published", FAILED: "Needs attention" };
const platformShort: Record<string, string> = { instagram: "IG", facebook: "FB", tiktok: "TikTok" };
const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function dayKey(date: Date) { return date.toISOString().slice(0, 10); }
function localDate(date: Date) { const [year, month, day] = dayKey(date).split("-").map(Number); return new Date(year, month - 1, day, 12); }
function localKey(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
function parseDay(key: string) { const [year, month, day] = key.split("-").map(Number); return new Date(year, month - 1, day); }
function monthStart(date: Date) { return new Date(date.getFullYear(), date.getMonth(), 1); }
function shiftMonth(date: Date, amount: number) { return new Date(date.getFullYear(), date.getMonth() + amount, 1); }
function prettyDate(key: string) { return parseDay(key).toLocaleDateString("en-IE", { weekday: "long", day: "numeric", month: "long", year: "numeric" }); }

export function RestaurantMarketingCalendar({ briefId, planId, startDate, endDate, items, submissions }: {
  briefId: string; planId: string; startDate: Date; endDate: Date; items: PlanItem[]; submissions: Submission[];
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

  return <div className="grid gap-5">
    <section className="rounded-2xl border bg-card p-4 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><p className="text-xs font-semibold uppercase tracking-wider text-primary">Marketing calendar</p><h2 className="mt-1 text-xl font-semibold">Your upcoming posts</h2></div>
        <div className="flex items-center gap-3"><button type="button" aria-label="Previous month" disabled={month.getTime() <= minMonth} onClick={() => setMonth((current) => shiftMonth(current, -1))} className="grid size-9 place-items-center rounded-lg border disabled:opacity-35"><ChevronLeft size={17}/></button><p className="min-w-32 text-center font-medium">{month.toLocaleDateString("en-IE", { month: "long", year: "numeric" })}</p><button type="button" aria-label="Next month" disabled={month.getTime() >= maxMonth} onClick={() => setMonth((current) => shiftMonth(current, 1))} className="grid size-9 place-items-center rounded-lg border disabled:opacity-35"><ChevronRight size={17}/></button></div>
      </div>
      <div className="mt-5 grid grid-cols-7 border-b pb-2 text-center text-xs font-medium text-muted-foreground">{weekdays.map((day) => <span key={day}>{day}</span>)}</div>
      <div className="grid grid-cols-7 gap-1 pt-1 sm:gap-2">
        {cells.map((date, index) => {
          if (!date) return <div key={`blank-${index}`} className="min-h-20 rounded-lg sm:min-h-28"/>;
          const key = localKey(date), inPlan = key >= startKey && key <= endKey, dayItems = itemsByDate.get(key) ?? [], selected = key === selectedDate;
          return <div key={key} className={`group relative min-h-20 rounded-lg border p-1.5 transition sm:min-h-32 sm:p-2 ${selected ? "z-10 border-primary bg-primary/5 ring-1 ring-primary" : inPlan ? "border-border hover:z-30 hover:border-primary/60" : "border-transparent opacity-30"}`}>
            <button type="button" disabled={!inPlan} onClick={() => selectDate(key)} aria-label={`${prettyDate(key)}${dayItems.length ? `, ${dayItems.map((item) => `${item.title} on ${item.platforms.join(", ")}`).join("; ")}` : ", no planned post"}`} className="absolute inset-0 z-0 rounded-lg disabled:cursor-default"/>
            <span className={`pointer-events-none relative z-[1] grid size-6 place-items-center rounded-full text-xs ${selected ? "bg-primary text-primary-foreground" : ""}`}>{date.getDate()}</span>
            <div className="pointer-events-none relative z-[1] mt-1.5 grid gap-1">
              {dayItems.slice(0, 2).map((item) => <span key={item.id} className="block rounded bg-violet-500/10 px-1 py-0.5 text-[9px] font-medium leading-3 text-violet-800 sm:px-1.5 sm:py-1 sm:text-[10px]"><span className="block truncate">{item.title}</span><span className="hidden truncate text-[9px] font-normal text-violet-700 sm:block">{item.platforms.map((platform) => platformShort[platform] ?? platform).join(" · ")}</span></span>)}
              {dayItems.length > 2 && <span className="text-[9px] text-muted-foreground">+{dayItems.length - 2} more</span>}
              {submittedDates.has(key) && <span className="block truncate text-[9px] font-medium text-emerald-700">Details sent</span>}
            </div>
            {dayItems.length > 0 && <div className="pointer-events-none absolute left-1/2 top-full z-40 hidden w-60 -translate-x-1/2 rounded-xl border bg-popover p-3 text-popover-foreground shadow-xl group-hover:block group-focus-within:block sm:w-72">
              <p className="mb-2 text-xs font-semibold">{prettyDate(key)}</p>{dayItems.map((item) => <div key={item.id} className="border-t py-2 first:border-0 first:pt-0 last:pb-0"><p className="text-xs font-semibold">{item.theme || item.title}</p><p className="mt-0.5 text-xs leading-5 text-muted-foreground">{item.objective}</p><p className="mt-1 text-[10px] font-medium capitalize text-primary">{item.platforms.join(" · ")}</p></div>)}
            </div>}
          </div>;
        })}
      </div>
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t pt-3 text-xs text-muted-foreground"><span>Hover to preview the promotion direction and platform.</span><span>Click a date to add details or photos.</span></div>
    </section>

    <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="border-b bg-muted/30 px-5 py-4"><p className="text-xs uppercase tracking-widest text-primary">Selected date</p><h2 className="mt-1 text-lg font-semibold">{prettyDate(selectedDate)}</h2></div>
        <div className="grid gap-5 p-5">
          {dateItems.length > 1 && <label className="grid gap-1.5 text-sm font-medium">Marketing moment<select value={selectedItem?.id ?? ""} onChange={(event) => setSelectedItemId(event.target.value)} className="rounded-lg border bg-background px-3 py-2">{dateItems.map((item) => <option key={item.id} value={item.id}>{item.scheduledTime ? `${item.scheduledTime} · ` : ""}{item.title}</option>)}</select></label>}
          {selectedItem ? <div className="rounded-xl border bg-muted/30 p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wider text-primary">{selectedItem.theme}</p><h3 className="mt-1 font-semibold">{selectedItem.title}</h3></div><span className="shrink-0 rounded-full bg-background px-2.5 py-1 text-[10px]">{statusCopy[selectedItem.status] ?? selectedItem.status}</span></div>{selectedItem.scheduledTime && <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground"><Clock3 size={13}/>Planned for {selectedItem.scheduledTime} Ireland time</p>}<p className="mt-3 text-sm"><strong>Promotion direction:</strong> {selectedItem.objective}</p><p className="mt-2 text-sm leading-6 text-muted-foreground">{selectedItem.concept}</p><div className="mt-3 flex flex-wrap gap-1.5">{selectedItem.platforms.map((platform) => <span key={platform} className="rounded-md bg-background px-2 py-1 text-[10px] capitalize">{platform}</span>)}</div>{selectedItem.content && <div className="mt-4 overflow-hidden rounded-xl border bg-background"><img src={`/api/restaurant-campaign-media/${selectedItem.content.storageKey}`} alt={selectedItem.content.title} className="max-h-48 w-full object-contain"/><div className="p-3"><p className="text-xs font-medium">{selectedItem.content.title} · {statusCopy[selectedItem.content.status] ?? selectedItem.content.status}</p><p className="mt-2 whitespace-pre-wrap text-xs leading-5">{selectedItem.content.caption}</p>{selectedItem.content.revisionNote && <p className="mt-2 rounded bg-muted p-2 text-xs">Requested change: {selectedItem.content.revisionNote}</p>}{["AWAITING_APPROVAL", "REVISION_REQUESTED"].includes(selectedItem.content.status) && <div className="mt-3 flex flex-wrap gap-2"><form action={decideRestaurantCampaignContentFormAction}><input type="hidden" name="token" value=""/><input type="hidden" name="contentId" value={selectedItem.content.id}/><input type="hidden" name="decision" value="APPROVED"/><button className="rounded-lg bg-primary px-3 py-2 text-xs text-primary-foreground">Approve content</button></form><form action={decideRestaurantCampaignContentFormAction} className="flex flex-1 gap-2"><input type="hidden" name="token" value=""/><input type="hidden" name="contentId" value={selectedItem.content.id}/><input type="hidden" name="decision" value="REVISION_REQUESTED"/><input required minLength={5} maxLength={2000} name="revisionNote" placeholder="What should we change?" className="min-w-0 flex-1 rounded-lg border px-2 py-1.5 text-xs"/><button className="rounded-lg border px-2 py-1.5 text-xs">Request change</button></form></div>}</div></div>}</div> : <div className="rounded-xl border border-dashed p-4"><p className="font-medium">No post is planned for this day yet.</p><p className="mt-1 text-sm text-muted-foreground">Share what you’d like to promote, and we’ll add it to the calendar.</p></div>}

          {dateSubmissions.length ? <div className="grid gap-2"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Information you’ve sent</p>{dateSubmissions.map((submission) => <div key={submission.id} className="rounded-lg bg-muted/60 p-3 text-xs"><p>{submission.note || "Reference photos attached"}</p><div className="mt-2 flex gap-2">{submission.references.map((reference) => <img key={reference.id} src={`/api/restaurant-campaign-media/${reference.storageKey}`} alt="Your reference" className="size-12 rounded object-cover"/>)}</div></div>)}</div> : null}

          <PlanItemInfoForm key={`${selectedDate}:${selectedItem?.id ?? "general"}`} briefId={briefId} planId={planId} planItemId={selectedItem?.id ?? ""} date={selectedDate}/>
        </div>
      <div className="mt-3 flex items-start gap-2 px-1 text-xs leading-5 text-muted-foreground"><Clock3 size={14} className="mt-0.5 shrink-0"/>Your team will use these details and references when producing this planned post. You’ll see the result here for review.</div>
    </section>
  </div>;
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
