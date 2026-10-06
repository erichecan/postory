import { notFound } from "next/navigation";
import { CampaignDetailPage } from "@/components/visual/customer-pages";
import { getAgencyData } from "@/lib/agency/data";
export default async function Page({
  params,
  searchParams,
}: PageProps<"/my-campaign/[campaignId]">) {
  const { campaignId } = await params;
  const sp = await searchParams;
  const data = await getAgencyData();
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
