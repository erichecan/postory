import { notFound } from "next/navigation";
import { CampaignDetailPage } from "@/components/visual/customer-pages";
import { getDemoData } from "@/lib/agency/demo";
export default async function Page({
  params,
  searchParams,
}: PageProps<"/demo/my-campaign/[campaignId]">) {
  const { campaignId } = await params;
  const sp = await searchParams;
  const data = await getDemoData();
  const campaign = data.campaigns.find((c) => c.id === campaignId);
  if (!campaign) notFound();
  return (
    <CampaignDetailPage
      data={data}
      campaign={campaign}
      initialTab={typeof sp.tab === "string" ? sp.tab : undefined}
      initialFilter={typeof sp.filter === "string" ? sp.filter : undefined}
    />
  );
}
