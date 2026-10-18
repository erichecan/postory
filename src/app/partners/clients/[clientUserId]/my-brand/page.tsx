import { BrandPage } from "@/components/visual/customer-pages";
import { getAgencyDataForClient } from "@/lib/agency/data";
import { requireClientAccess } from "@/lib/auth/agency-access";

export default async function Page({
  params,
}: PageProps<"/partners/clients/[clientUserId]/my-brand">) {
  const { clientUserId } = await params;
  const { clientName } = await requireClientAccess(clientUserId);
  const basePath = `/partners/clients/${clientUserId}`;
  return (
    <BrandPage
      data={await getAgencyDataForClient(clientUserId, clientName, basePath)}
    />
  );
}
