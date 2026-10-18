import { CampaignsPage } from "@/components/visual/customer-pages";
import { getAgencyDataForClient } from "@/lib/agency/data";
import { requireClientAccess } from "@/lib/auth/agency-access";

export default async function Page({
  params,
  searchParams,
}: PageProps<"/partners/clients/[clientUserId]/my-campaign">) {
  const { clientUserId } = await params;
  const sp = await searchParams;
  const { clientName } = await requireClientAccess(clientUserId);
  const basePath = `/partners/clients/${clientUserId}`;
  return (
    <CampaignsPage
      data={await getAgencyDataForClient(clientUserId, clientName, basePath)}
      initialStatus={typeof sp.status === "string" ? sp.status : undefined}
      initialContent={typeof sp.content === "string" ? sp.content : undefined}
    />
  );
}
