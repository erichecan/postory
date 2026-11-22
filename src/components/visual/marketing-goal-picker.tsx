"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { VerticalConfig, GoalConfig } from "@/lib/verticals/config";
import { ArrowRight, Check, ChevronRight, X } from "lucide-react";
import { SUSHI_CAMPAIGNS, SushiCampaignPoster, type SushiCampaignId } from "@/components/visual/sushi-campaign-poster";

export type MarketingGoalChoice = {
  id: string;
  title: string;
  detail: string;
  example: string;
};

export function MarketingGoalPicker({
  goals, selected, onSelect, onContinue, vertical
}: {
  vertical?: VerticalConfig;
  goals: MarketingGoalChoice[];
  selected: string;
  onSelect: (id: string) => void;
  onContinue: () => void;
}) {
  const [open, setOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const active = goals.find((g) => g.id === selected) ?? goals[0];
  const industryGoal: GoalConfig | undefined = vertical?.goals.find(g => g.id === active?.id);
  const isSushi = !vertical || vertical.slug === "sushi";
  const example = isSushi ? (SUSHI_CAMPAIGNS[active.id as SushiCampaignId] ?? SUSHI_CAMPAIGNS.unsure) : undefined;
  const concept = industryGoal?.creative;
  const displayName = vertical?.demoName ?? "SAKURA SUSHI";
  const image = example ? <SushiCampaignPoster campaign={example} /> : <div className="storex-vertical-art" style={{ background: vertical?.theme ?? "#344" }}>
    {concept?.asset ? <Image src={concept.asset} alt={concept.description} fill unoptimized sizes="400px" /> : <div className="storex-vertical-art-placeholder"><span>POStory · CREATIVE DIRECTION</span><strong>{vertical?.serviceLabel}</strong><small>正式作品由门店真实照片制作</small></div>}
    <div className="storex-vertical-art-label"><span>{displayName}</span><strong>{concept?.headline}</strong><small>行业营销创意 · 概念展示</small></div>
  </div>;
  const modalImage = example ? <SushiCampaignPoster campaign={example} modal /> : image;
  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    modalRef.current?.focus();
    function onModalKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") { e.preventDefault(); setOpen(false); return; }
      if (e.key !== "Tab") return;
      const elements = Array.from(modalRef.current?.querySelectorAll<HTMLElement>(
        "button:not([disabled]), a[href], input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])"
      ) ?? []);
      if (!elements.length) { e.preventDefault(); return; }
      const first = elements[0], last = elements[elements.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === modalRef.current)) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    }
    document.addEventListener("keydown", onModalKeyDown);
    return () => {
      document.removeEventListener("keydown", onModalKeyDown);
      document.body.style.overflow = oldOverflow;
      (triggerRef.current ?? previouslyFocused)?.focus();
    };
  }, [open]);

  return <section className="storex-step-panel storex-choice-v2">
    <div className="storex-choice-head">
      <span className="storex-eyebrow">第 1 步 · 营销目的</span>
      <h1>这次营销，你最希望带来什么变化？</h1>
      <p>先选择一个经营目标，右侧展示这一行业的营销方向和案例。PoStory 负责后续内容策划与制作。</p>
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
        <div className="storex-case-meta"><span>{displayName} · 创意展示</span><span>{example?.purpose ?? active.title}</span></div>
        <div className="storex-case-poster-wrap">{image}</div>
        <div className="storex-case-copy">
          <span className="storex-case-kicker">这个创意为什么对应「{active.title}」？</span>
          <p>{example?.description ?? concept?.description}</p>
        </div>
        <div className="storex-case-bottom">
          <span>虚构品牌 / 示意内容 / 非客户业绩</span>
          <button ref={triggerRef} type="button" onClick={() => setOpen(true)}>打开完整案例 <ChevronRight size={17}/></button>
        </div>
      </article>
    </div>
    <div className="storex-choice-footer">
      <span>可随时返回调整，后续资料不会因更改目标而清空。</span>
      <button className="storex-primary storex-choice-next" disabled={!selected} type="button" onClick={onContinue}>确定目的，继续 <ArrowRight size={17}/></button>
    </div>
    {open && <div className="storex-case-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
      <div ref={modalRef} tabIndex={-1} className="storex-case-dialog" role="dialog" aria-modal="true" aria-labelledby="storex-case-dialog-title">
        <button type="button" className="storex-case-close" onClick={() => setOpen(false)} aria-label="关闭案例"><X size={20}/></button>
        <div className="storex-case-dialog-media">{modalImage}</div>
        <div className="storex-case-dialog-body">
          <span className="storex-eyebrow">{displayName} · {example?.purpose ?? active.title}</span>
          <h2 id="storex-case-dialog-title">{example?.headline.replace(/\n/g, " ") ?? concept?.headline}</h2>
          <p>{example.description}</p>
          <h3>这次内容如何实现目标？</h3>
          <ul>{(example?.approach ?? concept?.approach ?? []).map((line) => <li key={line}>{line}</li>)}</ul>
          <h3>发布后可以观察什么？</h3>
          <ul>{(example?.indicators ?? concept?.indicators ?? []).map((line) => <li key={line}>{line}</li>)}</ul>
          <p className="storex-case-disclaimer">这是虚构品牌的行业营销方向示意，不代表真实客户作品或经营业绩。具体商品、价格、项目和活动条件均须由商家确认。</p>
          <button type="button" className="storex-primary" onClick={() => setOpen(false)}>返回营销目的 <ArrowRight size={16}/></button>
        </div>
      </div>
    </div>}
  </section>;
}
