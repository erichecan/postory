import { notFound } from "next/navigation";
import { FidelityDemo } from "@/components/demo/fidelity/page";

export default async function Page({ params }: { params: Promise<{ industry: string }> }) {
  const { industry } = await params;
  if (industry !== "nails" && industry !== "sushi") notFound();
  return <FidelityDemo industry={industry} page="schedule" />;
}
