import { ApplyPage } from "@/components/visual/official-pages";
export default async function Page({ searchParams }: PageProps<"/zh/apply">) {
  const { type, submitted, delivery } = await searchParams;
  return <ApplyPage type={typeof type === "string" ? type : ""} submitted={submitted === "1"} deliveryFailed={delivery === "failed"} chinese />;
}
