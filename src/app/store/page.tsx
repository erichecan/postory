import { AudienceWorkspace } from "@/components/visual/audience-workspaces";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Store Self-Service · PoStory", description: "Plan local business marketing with your own photos, videos and offers. Includes 20 content pieces each month." };

export default function StorePage() {
  return <AudienceWorkspace audience="store" />;
}
