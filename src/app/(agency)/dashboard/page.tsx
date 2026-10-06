import { DashboardPage } from "@/components/visual/customer-pages";
import { getAgencyData } from "@/lib/agency/data";
export default async function Page() {
  return <DashboardPage data={await getAgencyData()} />;
}
