import { NailsSuccess } from "@/components/demo/nails/success";
import { SushiComingSoon } from "@/components/demo/sushi-coming-soon";

export default async function DemoSuccessPage({ params }: { params: Promise<{ industry: string }> }) {
  const { industry } = await params;
  if (industry === "nails") return <NailsSuccess />;
  return <SushiComingSoon step="06 Success" />;
}
