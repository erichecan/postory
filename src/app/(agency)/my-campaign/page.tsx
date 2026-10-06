import { CampaignsPage } from "@/components/visual/customer-pages";
import { getAgencyData } from "@/lib/agency/data";
export default async function Page({
  searchParams,
}: PageProps<"/my-campaign">) {
  const sp = await searchParams;
  return (
    <CampaignsPage
      data={await getAgencyData()}
      initialStatus={typeof sp.status === "string" ? sp.status : undefined}
      initialContent={typeof sp.content === "string" ? sp.content : undefined}
    />
  );
}
