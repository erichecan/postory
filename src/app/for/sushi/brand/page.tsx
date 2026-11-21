import type { Metadata } from "next";
import Link from "next/link";
import { SushiBrandIntake } from "@/components/content-engine/sushi-brand-intake";

export const metadata: Metadata = {
  title: "建立寿司店 Brand Profile · PoStory",
  description: "整理寿司店名称、服务地区、Logo、门店实景与商品图片，并预览可审核的品牌规范。",
};

export default function SushiBrandPage() {
  return <><SushiBrandIntake/><div className="mx-auto max-w-6xl px-5 pb-10"><Link href="/for/sushi/content" className="inline-block rounded-lg border px-5 py-3 text-sm font-semibold">进入内容制作与审批工作台 →</Link></div></>;
}
