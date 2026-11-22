import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StoreMarketingExperience } from "@/components/visual/store-marketing-experience";
import { getVerticalConfig, VERTICAL_SLUGS } from "@/lib/verticals/config";

export function generateStaticParams() {
  return VERTICAL_SLUGS.map(industry => ({ industry }));
}

export async function generateMetadata({ params }: { params: Promise<{ industry: string }> }): Promise<Metadata> {
  const { industry } = await params;
  const vertical = getVerticalConfig(industry);
  if (!vertical) return {};
  return {
    title: `${vertical.label}营销代运营 · PoStory`,
    description: vertical.intro,
    robots: { index: true, follow: true },
  };
}

export default async function IndustryLanding({ params }: { params: Promise<{ industry: string }> }) {
  const { industry } = await params;
  const vertical = getVerticalConfig(industry);
  if (!vertical) notFound();
  return <StoreMarketingExperience key={vertical.slug} vertical={vertical} />;
}
