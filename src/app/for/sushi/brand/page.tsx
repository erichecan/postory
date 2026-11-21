import type { Metadata } from "next";
import { SushiBrandIntake } from "@/components/content-engine/sushi-brand-intake";

export const metadata: Metadata = {
  title: "建立寿司店 Brand Profile · PoStory",
  description: "整理寿司店名称、服务地区、Logo、门店实景与商品图片，并预览可审核的品牌规范。",
};

export default function SushiBrandPage() {
  return <SushiBrandIntake/>;
}
