import { AudienceWorkspace } from "@/components/visual/audience-workspaces";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Team Workspace · PoStory", description: "Give your in-house marketing team one place for brand assets, approvals, content calendars and publishing status." };

export default function TeamPage() {
  return <AudienceWorkspace audience="team" />;
}
