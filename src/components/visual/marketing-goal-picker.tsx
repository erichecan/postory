"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ArrowRight, Check, ChevronRight, X } from "lucide-react";

export type MarketingGoalChoice = {
  id: string;
  title: string;
  detail: string;
  example: string;
};

type CaseStudy = {
  image: string;
  industry: string;
  headline: string;
  description: string;
  approach: string[];
  outcome: string;
};

const CASES: Record<string, CaseStudy> = {
  footfall: {
    image: "/demo/photos/restaurant-calendar/lunch-set.jpg",
    industry: "餐饮 · 到店与订位",
    headline: "把午餐推荐，变成顾客愿意到店的理由。",
    description: "清楚呈现供应时段、套餐内容与到店方式，减少顾客决定之前需要确认的问题。",
    approach: ["展示门店真实午餐与环境", "写清供应时间及经过确认的价格", "在内容里提供明确的到店或订位方式"],
    outcome: "建议内容：午餐推荐、真实菜单介绍、周边工作日午餐指南"
  },
  promote: {
    image: "/demo/photos/restaurant-calendar/salmon-dragon-roll.jpg",
    industry: "商品推广 · 重点产品",
    headline: "让一件商品，有自己的故事。",
    description: "重点不是把所有商品排在一张图里，而是让顾客理解其中一件值得关注的产品。",
    approach: ["选择本次最值得推广的商品", "说明真实特点或购买场景", "使用实拍素材制作单品与组合内容"],
    outcome: "建议内容：新品亮点、单品介绍、购买场景与活动告知"
  },
  repeat: {
    image: "/demo/photos/nail-1.jpg",
    industry: "美甲 · 老顾客回访",
    headline: "给熟悉的顾客，一个再次预约的理由。",
    description: "围绕新款、会员权益和真实服务安排，提醒顾客这家店一直在提供值得关注的服务。",
    approach: ["展示新的真实服务作品", "清楚介绍经确认的会员权益", "提供预约入口，避免夸大优惠"],
    outcome: "建议内容：新款展示、预约提醒、会员活动说明"
  },
  basket: {
    image: "/demo/photos/restaurant-calendar/sushi-counter.jpg",
    industry: "餐饮 · 搭配与组合",
    headline: "让顾客看到，搭配起来有什么价值。",
    description: "把彼此相关的商品组合在同一个购买场景，而不是机械地罗列更多商品。",
    approach: ["找到适合一起购买的真实商品", "展示组合的使用或消费场景", "核实组合价格与适用条件"],
    outcome: "建议内容：双人组合、搭配推荐、加购说明"
  },
  offpeak: {
    image: "/demo/photos/restaurant-calendar/lunch-set.jpg",
    industry: "餐饮 · 淡时段经营",
    headline: "在安静的时段，创造值得来的理由。",
    description: "针对特定时间的真实消费需求安排内容，不把每天的宣传都做成同一种折扣。",
    approach: ["确认需要改善的日期或时段", "围绕该时段的顾客需要制作内容", "清楚注明活动日期和规则"],
    outcome: "建议内容：工作日午餐、淡时段服务、预约计划"
  },
  awareness: {
    image: "/demo/photos/restaurant-calendar/sushi-counter.jpg",
    industry: "本地商家 · 品牌认知",
    headline: "让附近的人知道，你是谁、在哪里。",
    description: "持续介绍真实门店、团队、服务与商品，让潜在顾客更容易认识这家店。",
    approach: ["展示真实门店及营业信息", "说明商品、服务与经营特色", "围绕不同顾客问题安排持续内容"],
    outcome: "建议内容：门店故事、真实环境、常见问题"
  },
  unsure: {
    image: "/demo/photos/restaurant-calendar/sushi-counter.jpg",
    industry: "门店经营 · 从问题出发",
    headline: "不需要先成为营销专家。",
    description: "从你最想改善的经营情况开始。先选一个方向，再用门店资料把目标变具体。",
    approach: ["描述当前最关心的经营问题", "明确受众及服务地区", "从少量真实商品与信息开始制作"],
    outcome: "建议内容：门店介绍、重点商品和顾客常见问题"
  }
};

export function MarketingGoalPicker({
  goals, selected, onSelect, onContinue
}: {
  goals: MarketingGoalChoice[];
  selected: string;
  onSelect: (id: string) => void;
  onContinue: () => void;
}) {
  const [open, setOpen] = useState(false);
  const active = goals.find((g) => g.id === selected) ?? goals[0];
  const example = CASES[active.id] ?? CASES.unsure;
  useEffect(() => {
    if (!open) return;
    function onEscape(e: KeyboardEvent) { if (e.key === "Escape") setOpen(false); }
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [open]);

  return <section className="storex-step-panel storex-choice-v2">
    <div className="storex-choice-head">
      <span className="storex-eyebrow">第 1 步 · 营销目的</span>
      <h1>这次营销，你最希望带来什么变化？</h1>
      <p>先选择一个主要经营目标。右侧会展示相应的营销案例思路，之后再决定怎么制作内容。</p>
    </div>
    <div className="storex-choice-layout">
      <div className="storex-goal-list" role="radiogroup" aria-label="选择营销目的">
        {goals.map((item, index) => <button
          key={item.id}
          type="button"
          role="radio"
          aria-checked={selected === item.id}
          className={`storex-goal-row ${selected === item.id ? "is-selected" : ""}`}
          onClick={() => onSelect(item.id)}
        >
          <span className="storex-goal-symbol" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
          <span className="storex-goal-label"><strong>{item.title}</strong><span>{item.detail}</span></span>
          <span className="storex-goal-check" aria-hidden="true">{selected === item.id && <Check size={14}/>}</span>
        </button>)}
      </div>
      <article className="storex-case-card">
        <div className="storex-case-meta"><span>创意案例 · 场景演示</span><span>{example.industry}</span></div>
        <div className="storex-case-image"><Image key={example.image} src={example.image} alt={example.industry + "营销场景示例"} fill sizes="(max-width: 700px) 100vw, 480px" unoptimized /></div>
        <div className="storex-case-copy">
          <span className="storex-case-kicker">{active.title}</span>
          <h2>{example.headline}</h2>
          <p>{example.description}</p>
        </div>
        <div className="storex-case-bottom">
          <span>演示案例 · 非客户业绩</span>
          <button type="button" onClick={() => setOpen(true)}>查看案例思路 <ChevronRight size={17}/></button>
        </div>
      </article>
    </div>
    <div className="storex-choice-footer">
      <span>可随时返回调整，后续资料不会因更改目标而清空。</span>
      <button className="storex-primary storex-choice-next" disabled={!selected} type="button" onClick={onContinue}>确定目的，继续 <ArrowRight size={17}/></button>
    </div>
    {open && <div className="storex-case-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
      <div className="storex-case-dialog" role="dialog" aria-modal="true" aria-labelledby="storex-case-dialog-title">
        <button type="button" className="storex-case-close" onClick={() => setOpen(false)} aria-label="关闭案例"><X size={20}/></button>
        <div className="storex-case-dialog-media"><Image src={example.image} alt={example.industry} fill sizes="(max-width: 700px) 100vw, 420px" unoptimized/></div>
        <div className="storex-case-dialog-body">
          <span className="storex-eyebrow">{example.industry}</span>
          <h2 id="storex-case-dialog-title">{example.headline}</h2>
          <p>{example.description}</p>
          <h3>可以怎样开展？</h3>
          <ul>{example.approach.map((line) => <li key={line}>{line}</li>)}</ul>
          <div className="storex-case-outcome">{example.outcome}</div>
          <p className="storex-case-disclaimer">这是使用公开演示素材构建的创意方向，不是已完成的客户服务或流量效果证明。商品价格、规则与库存须由商家确认。</p>
          <button type="button" className="storex-primary" onClick={() => setOpen(false)}>返回营销目的 <ArrowRight size={16}/></button>
        </div>
      </div>
    </div>}
  </section>;
}
