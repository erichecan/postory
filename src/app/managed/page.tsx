import { AudienceWorkspace } from "@/components/visual/audience-workspaces";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Managed Marketing · PoStory", description: "PoStory plans and prepares recurring marketing content with your review and approval." };

export default function ManagedPage() {
  return <AudienceWorkspace audience="managed" />;
}
