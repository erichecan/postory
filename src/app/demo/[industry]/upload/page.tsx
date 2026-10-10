import { NailsUpload } from "@/components/demo/nails/upload";
import { SushiComingSoon } from "@/components/demo/sushi-coming-soon";

export default async function DemoUploadPage({ params }: { params: Promise<{ industry: string }> }) {
  const { industry } = await params;
  if (industry === "nails") return <NailsUpload />;
  return <SushiComingSoon step="02 Upload" />;
}
