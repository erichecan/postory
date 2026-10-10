import { NailsTemplates } from "@/components/demo/nails/templates";
import { SushiComingSoon } from "@/components/demo/sushi-coming-soon";

export default async function DemoTemplatesPage({ params }: { params: Promise<{ industry: string }> }) {
  const { industry } = await params;
  if (industry === "nails") return <NailsTemplates />;
  return <SushiComingSoon step="03 Templates" />;
}
