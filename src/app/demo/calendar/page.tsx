import { CalendarPage } from "@/components/visual/customer-pages";
import { getDemoData } from "@/lib/agency/demo";
export default async function Page() {
  return <CalendarPage data={await getDemoData()} />;
}
