import { CampaignsPage } from "@/components/visual/customer-pages";
import { getDemoData } from "@/lib/agency/demo";
export default async function Page({
  searchParams,
}: PageProps<"/demo/my-campaign">) {
  const sp = await searchParams;
  return (
    <CampaignsPage
      data={await getDemoData()}
      initialStatus={typeof sp.status === "string" ? sp.status : undefined}
      initialContent={typeof sp.content === "string" ? sp.content : undefined}
    />
  );
}
