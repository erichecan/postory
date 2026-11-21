import Link from "next/link";
import "@/components/content-engine/sushi-brand.css";
import type { Metadata } from "next";
import { getIndustryConfig } from "@/lib/content-engine/industry-registry";
import { ArrowRight, BookOpen, CalendarDays, Camera, Check, ShieldCheck, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "寿司店营销内容服务 · PoStory",
  description: "为寿司店制定专属营销内容，整理品牌资料、门店实拍和真实菜单，形成有一致品牌表达的社媒内容。",
};

const reasons = [
  { icon: Camera, title: "让菜品自己说话", body: "从真实菜品和环境入手，而不是随意生成一盘不存在的寿司。" },
  { icon: BookOpen, title: "先建立品牌规范", body: "整理店名、Logo、品牌风格和菜单事实，后续每次制作都保持一致。" },
  { icon: CalendarDays, title: "从营销目标出发", body: "午餐到店、主推菜品、多人套餐和老顾客回访，分别设计内容。" },
];

export default function SushiIndustryPage() {
  const config = getIndustryConfig("sushi");
  if (!config) return null;
  return <main className="ps-vertical">
    <header className="ps-vertical-header">
      <Link href="/" className="ps-vertical-wordmark">PoStory<span className="ps-vertical-dot">.</span></Link>
      <span className="ps-vertical-focus">SUSHI & JAPANESE DINING</span>
      <Link href="/for/sushi/brand" className="ps-vertical-header-cta">建立品牌档案 <ArrowRight size={16}/></Link>
    </header>
    <section className="ps-vertical-hero">
      <div className="ps-vertical-hero-copy">
        <span className="ps-vertical-eyebrow">FOR SUSHI RESTAURANTS</span>
        <h1>让你的寿司店，<br/><em>被更多人记住。</em></h1>
        <p>从真实的菜品和门店故事开始。我们把品牌、照片、菜单事实与营销目标整理成持续、专业的社媒内容。</p>
        <Link href="/for/sushi/brand" className="ps-vertical-button">先建立我的 Brand Profile <ArrowRight size={18}/></Link>
        <small><ShieldCheck size={14}/> 先确认事实和风格，再制作发布内容</small>
      </div>
      <div className="ps-vertical-hero-art" aria-label="寿司店营销内容构图示意">
        <div className="ps-vertical-art-top"><span>REAL FOOD. REAL STORY.</span><span>01 / BRAND</span></div>
        <div className="ps-vertical-art-image"/>
        <div className="ps-vertical-art-title">Your table.<br/>Your story.</div>
        <div className="ps-vertical-art-foot">EDITORIAL CONTENT · SUSHI MARKETING</div>
      </div>
    </section>
    <section className="ps-vertical-proof">
      <div className="ps-vertical-section-head"><span className="ps-vertical-eyebrow">MADE FOR SUSHI</span><h2>不是通用模板，<br/>从你的经营场景出发。</h2></div>
      <div className="ps-vertical-reasons">{reasons.map((r) => <article key={r.title}><r.icon size={23}/><h3>{r.title}</h3><p>{r.body}</p></article>)}</div>
    </section>
    <section className="ps-vertical-goals">
      <div><span className="ps-vertical-eyebrow">YOUR OBJECTIVES</span><h2>你最想改善哪一件事？</h2><p>寿司店有自己的经营节奏。不同目标，不该使用同一种海报和文案。</p></div>
      <div className="ps-vertical-goal-list">{config.goals.map((g,i)=><div key={g.id}><span>{String(i+1).padStart(2,"0")}</span><strong>{g.label}</strong><small>{g.example}</small></div>)}</div>
    </section>
    <section className="ps-vertical-last"><Sparkles size={25}/><h2>先把品牌整理好，<br/>再开始做营销。</h2><p>品牌档案是第一次合作中最重要的基础。它决定后续照片、文案和设计如何始终保持同一家店的风格。</p><Link href="/for/sushi/brand" className="ps-vertical-button">开始建立品牌档案 <ArrowRight size={18}/></Link><span><Check size={15}/> 这是一版品牌建档体验，尚未自动发送营销内容</span></section>
  </main>;
}
