import { CalendarPage } from "@/components/visual/customer-pages";
import { getAgencyData } from "@/lib/agency/data";
export default async function Page() {
  return <CalendarPage data={await getAgencyData()} />;
}
