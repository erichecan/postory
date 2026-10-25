import { RestaurantBriefForm } from "@/components/restaurant/restaurant-brief-form";

export default async function RestaurantRequestPage({ searchParams }: { searchParams: Promise<{ ref?: string }> }) {
  const { ref = "" } = await searchParams;
  const referral = /^[A-Za-z0-9_.-]{1,256}$/.test(ref) ? ref : "";
  return <main className="w-full flex-1 bg-background px-4 py-10"><div className="mx-auto mb-7 max-w-6xl"><p className="text-sm font-semibold uppercase tracking-widest text-primary">PoStory · Restaurant Campaign</p><h1 className="mt-3 text-3xl font-semibold">为餐厅规划下一阶段内容</h1><p className="mt-2 text-muted-foreground">先选目标，再确定内容方向，最后选择套餐并查看月度排期。</p></div><RestaurantBriefForm referral={referral} /></main>;
}
