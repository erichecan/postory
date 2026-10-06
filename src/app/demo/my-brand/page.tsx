import { BrandPage } from "@/components/visual/customer-pages";
import { getDemoData } from "@/lib/agency/demo";
export default async function Page() {
  return <BrandPage data={await getDemoData()} />;
}
