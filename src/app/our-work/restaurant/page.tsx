import { IndustryDemoPage } from "@/components/visual/public-pages";
export default async function Page({ searchParams }: { searchParams: Promise<{ ref?: string }> }) {
  const { ref } = await searchParams;
  const referral = ref && /^[A-Za-z0-9_.-]{1,256}$/.test(ref) ? `?ref=${encodeURIComponent(ref)}` : "";
  return <IndustryDemoPage
    industry="restaurant"
    requestHref={`/restaurant/request${referral}`}
    title="Show up all month, without the daily scramble."
    body="A steady mix of food, people, stories and timely offers—turned into social content and scheduled for your connected accounts."
    tag="SOCIAL MEDIA FOR RESTAURANTS"
  />;
}
