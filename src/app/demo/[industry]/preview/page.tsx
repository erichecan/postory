import { NailsPreview } from "@/components/demo/nails/preview";
import { SushiComingSoon } from "@/components/demo/sushi-coming-soon";

export default async function DemoPreviewPage({ params }: { params: Promise<{ industry: string }> }) {
  const { industry } = await params;
  if (industry === "nails") return <NailsPreview />;
  return <SushiComingSoon step="05 Preview" />;
}
