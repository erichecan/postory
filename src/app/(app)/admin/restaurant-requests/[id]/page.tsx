import { notFound } from "next/navigation";
import {
  adminAddRestaurantCampaignContentFormAction,
  adminAddRestaurantMarketingPlanItemFormAction,
  adminLinkRestaurantBriefClientFormAction,
  adminPublishRestaurantCampaignContentFormAction,
  adminSaveRestaurantMarketingPlanFormAction,
  adminSetRestaurantBriefStatusFormAction,
} from "@/lib/actions/restaurant-campaigns";
import { requireAdmin } from "@/lib/auth/session";
import { getRestaurantBriefById } from "@/lib/db/restaurant-campaigns";

export default async function RestaurantRequestAdminPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const brief = await getRestaurantBriefById(id);
  if (!brief) notFound();
  const plan = brief.marketingPlan;

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <a href="/admin/restaurant-requests" className="text-sm text-primary">← All restaurant requests</a>
      <h1 className="mt-3 text-2xl font-semibold">{brief.businessName}</h1>
      <p className="text-sm text-muted-foreground">{brief.contactName} · {brief.contactEmail} · {brief.location}</p>
      <p className="mt-4">{brief.campaignDetails}</p>
      <p className="mt-2 text-sm text-muted-foreground">Direction: {brief.campaignDirection} · Goal: {brief.campaignGoal} · Promotions: {brief.campaignStartDate?.toLocaleDateString("en-IE") ?? "—"} to {brief.campaignEndDate?.toLocaleDateString("en-IE") ?? "—"} · Platforms: {brief.platforms.join(", ")}</p>
      {brief.referrer && <p className="mt-2 text-sm">Referred by {brief.referrer.name ?? brief.referrer.email}</p>}

      <section className="mt-8 rounded-xl border p-5">
        <h2 className="font-semibold">Internal workflow and account</h2>
        <form action={adminSetRestaurantBriefStatusFormAction} className="mt-4 grid gap-3">
          <input type="hidden" name="briefId" value={brief.id} />
          <select name="status" defaultValue={brief.status} className="rounded-lg border px-3 py-2">{["SUBMITTED", "IN_REVIEW", "IN_PRODUCTION", "ACTIVE", "CLOSED"].map((s) => <option key={s}>{s}</option>)}</select>
          <textarea name="internalNotes" defaultValue={brief.internalNotes ?? ""} maxLength={5000} rows={3} placeholder="Internal notes" className="rounded-lg border px-3 py-2" />
          <button className="w-fit rounded-lg border px-4 py-2">Save workflow status</button>
        </form>
        <form action={adminLinkRestaurantBriefClientFormAction} className="mt-5 flex flex-wrap gap-2">
          <input type="hidden" name="briefId" value={brief.id} />
          <input name="email" type="email" required defaultValue={brief.client?.email ?? ""} placeholder="Customer’s verified PoStory account email" className="min-w-64 rounded-lg border px-3 py-2" />
          <button className="rounded-lg border px-4 py-2">Link customer account</button>
        </form>
        <p className="mt-2 text-xs text-muted-foreground">The customer can also claim this request directly from its private link, using the verified email supplied in the brief.</p>
      </section>

      <section className="mt-8 rounded-xl border p-5">
        <h2 className="font-semibold">Build the forward marketing plan</h2>
        <p className="mt-1 text-sm text-muted-foreground">This is the strategy and calendar the restaurant owner will keep seeing in their PoStory account.</p>
        <form action={adminSaveRestaurantMarketingPlanFormAction} className="mt-4 grid gap-3">
          <input type="hidden" name="briefId" value={brief.id} />
          <input required name="title" maxLength={160} defaultValue={plan?.title ?? `${brief.businessName} · 30-day marketing plan`} placeholder="Plan title" className="rounded-lg border px-3 py-2" />
          <textarea required name="overview" maxLength={10000} rows={5} defaultValue={plan?.overview ?? ""} placeholder="Explain the strategy, audience, campaign mix, and how the content supports the restaurant’s goals." className="rounded-lg border px-3 py-2" />
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="grid gap-1 text-sm">Plan starts<input required name="startDate" type="date" defaultValue={plan?.startDate.toISOString().slice(0, 10) ?? brief.campaignStartDate?.toISOString().slice(0, 10)} className="rounded-lg border px-3 py-2" /></label>
            <label className="grid gap-1 text-sm">Plan ends<input required name="endDate" type="date" defaultValue={plan?.endDate.toISOString().slice(0, 10) ?? brief.campaignEndDate?.toISOString().slice(0, 10)} className="rounded-lg border px-3 py-2" /></label>
            <label className="grid gap-1 text-sm">Posting rhythm<input required name="cadence" maxLength={160} defaultValue={plan?.cadence ?? "3 posts per week · Instagram + Facebook"} placeholder="e.g. 3 posts/week" className="rounded-lg border px-3 py-2" /></label>
          </div>
          <button className="w-fit rounded-lg bg-primary px-4 py-2 text-primary-foreground">Save plan overview</button>
        </form>
      </section>

      {plan && <section className="mt-5 rounded-xl border p-5">
        <h2 className="font-semibold">Add a planned campaign moment</h2>
        <form action={adminAddRestaurantMarketingPlanItemFormAction} className="mt-4 grid gap-3">
          <input type="hidden" name="briefId" value={brief.id} />
          <input required name="title" maxLength={160} placeholder="Post title, e.g. Friday sushi sharing set" className="rounded-lg border px-3 py-2" />
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="grid gap-1 text-sm">Planned date<input required name="date" type="date" min={plan.startDate.toISOString().slice(0, 10)} max={plan.endDate.toISOString().slice(0, 10)} className="rounded-lg border px-3 py-2" /></label>
            <label className="grid gap-1 text-sm">Planned time (Ireland)<input name="scheduledTime" type="time" className="rounded-lg border px-3 py-2" /></label>
            <label className="grid gap-1 text-sm">Theme<input required name="theme" maxLength={160} placeholder="Signature rolls / lunch set / local story" className="rounded-lg border px-3 py-2" /></label>
          </div>
          <input required name="objective" maxLength={2000} placeholder="What should this post achieve?" className="rounded-lg border px-3 py-2" />
          <textarea required name="concept" maxLength={5000} rows={3} placeholder="Describe the creative direction and content idea the customer will see." className="rounded-lg border px-3 py-2" />
          <fieldset className="text-sm"><legend>Channels</legend>{brief.platforms.map((p) => <label key={p} className="mr-4 inline-flex items-center gap-2"><input type="checkbox" name="platforms" value={p} defaultChecked />{p}</label>)}</fieldset>
          <button className="w-fit rounded-lg border px-4 py-2">Add to customer’s forward calendar</button>
        </form>
        {plan.items.length > 0 && <div className="mt-5 divide-y">{plan.items.map((item) => <div key={item.id} className="py-3 text-sm"><strong>{item.date.toLocaleDateString("en-IE", { timeZone: "UTC" })} {item.scheduledTime && `· ${item.scheduledTime}`} · {item.title}</strong><p className="text-muted-foreground">{item.theme} · {item.platforms.join(", ")} · {item.status}</p>{item.submissions.map((submission)=><div key={submission.id} className="mt-2 rounded-lg bg-muted/50 p-3"><p>{submission.note}</p><div className="mt-2 flex gap-2">{submission.references.map((ref)=><img key={ref.id} src={`/api/restaurant-campaign-media/${ref.storageKey}`} alt="Customer reference" className="size-16 rounded object-cover"/>)}</div></div>)}</div>)}</div>}
      </section>}
      {plan?.submissions.some((submission) => !submission.planItemId) && <section className="mt-5 rounded-xl border p-5"><h2 className="font-semibold">Customer requests for open calendar dates</h2>{plan.submissions.filter((submission) => !submission.planItemId).map((submission)=><div key={submission.id} className="mt-3 rounded-lg bg-muted/50 p-3 text-sm"><strong>{submission.date.toLocaleDateString("en-IE", { timeZone: "UTC" })}</strong><p className="mt-1">{submission.note}</p><div className="mt-2 flex gap-2">{submission.references.map((ref)=><img key={ref.id} src={`/api/restaurant-campaign-media/${ref.storageKey}`} alt="Customer reference" className="size-16 rounded object-cover"/>)}</div></div>)}</section>}

      <section className="mt-8 rounded-xl border p-5">
        <h2 className="font-semibold">Add finished content for customer review</h2>
        <form action={adminAddRestaurantCampaignContentFormAction} className="mt-4 grid gap-3">
          <input type="hidden" name="briefId" value={brief.id} />
          <input required name="title" maxLength={128} placeholder="Post title" className="rounded-lg border px-3 py-2" />
          <textarea required name="caption" maxLength={5000} rows={4} placeholder="Final caption / post copy" className="rounded-lg border px-3 py-2" />
          {plan?.items.length ? <label className="grid gap-1 text-sm">Link this creative to a planned calendar moment<select name="planItemId" defaultValue="" className="rounded-lg border px-3 py-2"><option value="">Standalone content</option>{plan.items.map((item) => <option key={item.id} value={item.id}>{item.date.toLocaleDateString("en-IE", { timeZone: "UTC" })} · {item.title}</option>)}</select></label> : <input type="hidden" name="planItemId" value="" />}
          <label className="text-sm">Artwork image<input required name="asset" type="file" accept="image/png,image/jpeg,image/webp" className="mt-1 block" /></label>
          <fieldset className="text-sm"><legend>Publish to</legend>{brief.platforms.map((p) => <label key={p} className="mr-4 inline-flex items-center gap-2"><input type="checkbox" name="platforms" value={p} defaultChecked />{p}</label>)}</fieldset>
          <label className="grid gap-1 text-sm">Proposed posting date and time (Ireland)<input required name="scheduledAt" type="datetime-local" className="w-fit rounded-lg border px-3 py-2" /></label>
          <button className="w-fit rounded-lg bg-primary px-4 py-2 text-primary-foreground">Send draft for approval</button>
        </form>
        <p className="mt-2 text-xs text-muted-foreground">Prepare the visual and copy in the sushi workflow, then connect it to the corresponding planned moment.</p>
      </section>

      <section className="mt-8 grid gap-4">{brief.content.map((item) => <article key={item.id} className="rounded-xl border p-4"><h3 className="font-semibold">{item.title} · {item.status}</h3><p className="mt-1 whitespace-pre-wrap text-sm">{item.caption}</p>{item.revisionNote && <p className="mt-2 text-sm">Change requested: {item.revisionNote}</p>}<p className="mt-2 text-xs text-muted-foreground">{item.platforms.join(", ")} · proposed {item.scheduledAt?.toLocaleString("en-IE") ?? "unscheduled"}</p>{item.status === "APPROVED" && <form action={adminPublishRestaurantCampaignContentFormAction} className="mt-3"><input type="hidden" name="contentId" value={item.id} /><button className="rounded-lg border px-4 py-2">Schedule approved post</button></form>}</article>)}</section>
    </main>
  );
}
