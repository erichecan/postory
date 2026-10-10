import { notFound } from "next/navigation";
import { FidelityDemo } from "@/components/demo/fidelity/page";

export default async function Page({ params }: { params: Promise<{ industry: string }> }) {
  const { industry } = await params;
  if (industry !== "nails" && industry !== "sushi") notFound();
  if (industry !== "nails") notFound();
  return <FidelityDemo industry={industry} page="calendar" />;
}
