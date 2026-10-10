import { NailsEdit } from "@/components/demo/nails/edit";
import { SushiComingSoon } from "@/components/demo/sushi-coming-soon";

export default async function DemoEditPage({ params }: { params: Promise<{ industry: string }> }) {
  const { industry } = await params;
  if (industry === "nails") return <NailsEdit />;
  return <SushiComingSoon step="04 Edit" />;
}
