import type { Metadata } from "next";
import { SushiContentWorkbench } from "@/components/content-engine/sushi-content-workbench";

export const metadata: Metadata = {
  title: "寿司店内容工作台 · PoStory",
  description: "使用已批准品牌资料和真实授权图片制作、审核和导出寿司店营销内容。",
};
export default function SushiContentPage() {
  return <SushiContentWorkbench/>;
}
