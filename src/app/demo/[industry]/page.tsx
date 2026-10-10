import { NailsLanding } from "@/components/demo/nails/landing";
import { SushiComingSoon } from "@/components/demo/sushi-coming-soon";

export default async function DemoLandingPage({ params }: { params: Promise<{ industry: string }> }) {
  const { industry } = await params;
  if (industry === "nails") return <NailsLanding />;
  return <SushiComingSoon step="01 Landing" />;
}
