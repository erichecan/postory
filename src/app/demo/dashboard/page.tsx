import { DashboardPage } from "@/components/visual/customer-pages";
import { getDemoData } from "@/lib/agency/demo";
export default async function Page() {
  return <DashboardPage data={await getDemoData()} />;
}
