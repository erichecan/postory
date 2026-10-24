import { RestaurantBriefForm } from "@/components/restaurant/restaurant-brief-form";

export default async function RestaurantRequestPage({ searchParams }: { searchParams: Promise<{ ref?: string }> }) {
  const { ref = "" } = await searchParams;
  const referral = /^[A-Za-z0-9_.-]{1,256}$/.test(ref) ? ref : "";
  return <main className="min-h-screen bg-background px-4 py-12"><div className="mx-auto mb-8 max-w-3xl"><p className="text-sm font-semibold uppercase tracking-widest text-primary">PoStory · Restaurant Campaign</p><h1 className="mt-3 text-3xl font-semibold">Tell us what you want to promote</h1><p className="mt-3 text-muted-foreground">Share your restaurant details and campaign idea. We’ll prepare tailored social content for your review before anything is published.</p></div><RestaurantBriefForm referral={referral} /></main>;
}
