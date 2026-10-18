import { notFound } from "next/navigation";
import { CampaignDetailPage } from "@/components/visual/customer-pages";
import { getAgencyDataForClient } from "@/lib/agency/data";
import { requireClientAccess } from "@/lib/auth/agency-access";

export default async function Page({
  params,
  searchParams,
}: PageProps<"/partners/clients/[clientUserId]/my-campaign/[campaignId]">) {
  const { clientUserId, campaignId } = await params;
  const sp = await searchParams;
  const { clientName } = await requireClientAccess(clientUserId);
  const basePath = `/partners/clients/${clientUserId}`;
  const data = await getAgencyDataForClient(clientUserId, clientName, basePath);
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
