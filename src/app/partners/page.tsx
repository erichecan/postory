import type { Metadata } from "next";
import { PartnerPage } from "@/components/visual/official-pages";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "For Partners · PoStory", description: "White-label social content production for local business agencies." };
}

export default function PartnersLandingPage() { return <PartnerPage />; }
