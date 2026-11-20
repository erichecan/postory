import { StoreMarketingExperience } from "@/components/visual/store-marketing-experience";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "门店自助营销 · PoStory", description: "了解门店营销内容制作、日历排期和社媒发布流程，从你的经营目标开始制定营销计划。" };

export default function StorePage() {
  return <StoreMarketingExperience />;
}
