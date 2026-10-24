import { notFound } from "next/navigation";
import { Link2, MapPin } from "lucide-react";
import { RestaurantMarketingCalendar } from "@/components/restaurant/restaurant-marketing-calendar";
import { requireUser } from "@/lib/auth/session";
import { getRestaurantBriefForClient } from "@/lib/db/restaurant-campaigns";

export default async function RestaurantCampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const brief = await getRestaurantBriefForClient(id, user.id);
  if (!brief) notFound();
  const plan = brief.marketingPlan;

  return (
    <main className="mx-auto max-w-[1440px] px-4 py-8 lg:px-8">
      <a href="/restaurant/campaigns" className="text-sm text-primary">← All restaurant plans</a>
      <header className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-card px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Marketing calendar</p>
            <h1 className="mt-1 text-xl font-semibold sm:text-2xl">{plan?.title ?? `${brief.businessName} marketing plan`}</h1>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground"><MapPin size={15}/>{brief.businessName} · {brief.location}</p>
          </div>
          <a href="/profile#connections" className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"><Link2 size={15}/>Connect social accounts</a>
        </div>
      </header>

      {plan ? <>
        <div className="mt-5"><RestaurantMarketingCalendar briefId={brief.id} planId={plan.id} startDate={plan.startDate} endDate={plan.endDate} items={plan.items} submissions={plan.submissions} cadence={plan.cadence}/></div>
      </> : <section className="mt-6 rounded-2xl border border-dashed p-8"><h2 className="text-lg font-semibold">Your team is building the calendar</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">We’re mapping the next 30 days around your dishes, promotion dates, and local audience. Your calendar will appear here with planned post dates, channels, and creative direction. You can then add details and reference photos to each planned moment.</p></section>}
    </main>
  );
}
