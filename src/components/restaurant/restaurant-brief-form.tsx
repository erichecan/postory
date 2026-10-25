"use client";

import { useMemo, useState } from "react";
import { useActionState } from "react";
import { submitRestaurantCampaignBriefAction } from "@/lib/actions/restaurant-campaigns";
import { Platform } from "@/components/visual/primitives";

const directions = [["new-arrival", "New menu arrival"], ["lunch-set", "Lunch set"], ["healthy-light", "Fresh and healthy"], ["limited-offer", "Limited time offer"], ["seafood-feature", "Seafood feature"], ["premium-signature", "Signature dish"], ["signature-platter", "Sharing platter"], ["date-night", "Date night"]];
const goals = [
  { id: "offer-reach", title: "让更多人知道午餐有优惠", metric: "关注触达人数、内容浏览量" },
  { id: "menu-views", title: "让更多人查看午餐菜单", metric: "关注菜单页访问、菜单链接点击" },
  { id: "offer-redemptions", title: "让顾客领取或使用优惠", metric: "关注优惠码领取、实际核销" },
  { id: "online-bookings", title: "带来更多在线预订", metric: "关注预订链接点击、完成预订" },
  { id: "dish-discovery", title: "推广一道招牌菜或新品", metric: "关注内容浏览、收藏与分享" },
  { id: "local-engagement", title: "让本地顾客参与互动", metric: "关注评论、私信咨询、分享" },
];
const featuredItems = [
  ["signature-dishes", "招牌菜 / 人气菜", "突出顾客常点的菜品"],
  ["lunch-offers", "午餐 / 套餐优惠", "说明价格、时段和优惠条件"],
  ["new-seasonal", "新品 / 季节限定", "介绍新品亮点与供应时间"],
  ["takeaway-sharing", "外卖 / 分享套餐", "适合外带、多人分享或团购"],
  ["events", "节日 / 聚会活动", "节庆菜单、团体餐或特别场合"],
  ["other", "其他主推内容", "补充你本月想重点宣传的内容"],
];
const packagePlans = {
  starter: { name: "Starter", price: 149, posts: 20, perPost: "7.45" },
  growth: { name: "Growth", price: 249, posts: 30, perPost: "8.30" },
} as const;

export function RestaurantBriefForm({ referral = "" }: { referral?: string }) {
  const [state, action, pending] = useActionState(submitRestaurantCampaignBriefAction, undefined);
  const [step, setStep] = useState(1);
  const [goal, setGoal] = useState("offer-reach");
  const [tier, setTier] = useState<keyof typeof packagePlans>("starter");
  const selectedPlan = packagePlans[tier];
  const days = useMemo(() => Array.from({ length: 30 }, (_, index) => ({
    day: index + 1,
    hasPost: Math.floor((index + 1) * selectedPlan.posts / 30) > Math.floor(index * selectedPlan.posts / 30),
  })), [selectedPlan.posts]);

  return <form action={action} noValidate className="mx-auto w-full max-w-6xl rounded-2xl border bg-card p-4 shadow-sm sm:p-6">
    <input type="hidden" name="referral" value={referral}/>
    <input type="hidden" name="campaignGoal" value={goal}/>
    <input type="hidden" name="serviceTier" value={tier}/>
    <div className="mb-6 grid grid-cols-3 gap-2" aria-label="制作流程">
      {["选择目标", "品牌与内容方向", "套餐与提交"].map((label, index) => <button key={label} type="button" onClick={() => setStep(index + 1)} aria-current={step === index + 1 ? "step" : undefined} className={`flex items-center gap-2 border-b-2 pb-2 text-left text-xs sm:text-sm ${step === index + 1 ? "border-primary font-semibold text-foreground" : "border-border text-muted-foreground"}`}><span className={`grid size-6 shrink-0 place-items-center rounded-full border text-xs ${step === index + 1 ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>{index + 1}</span><span>{label}</span></button>)}
    </div>

    {step === 1 && <section>
      <h2 className="text-lg font-semibold">这次宣传，你最希望顾客做什么？</h2>
      <p className="mt-1 text-sm text-muted-foreground">选一个主要目标。每个目标都对应可观察的数据，方便之后回顾效果。</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{goals.map((item) => <button key={item.id} type="button" onClick={() => setGoal(item.id)} aria-pressed={goal === item.id} className={`min-h-24 rounded-xl border p-4 text-left transition ${goal === item.id ? "border-primary bg-primary/[0.04] ring-1 ring-primary" : "hover:border-primary/50"}`}><span className="font-medium">{item.title}</span><span className="mt-2 block text-xs leading-5 text-muted-foreground">{item.metric}</span></button>)}</div>
      <div className="mt-4 rounded-xl border p-4"><p className="text-sm font-medium">如果有对应活动，可补充日期与优惠</p><p className="mt-1 text-xs text-muted-foreground">例如：工作日午餐套餐 €12.50，11 月 1–30 日供应</p><div className="mt-3 grid gap-3 sm:grid-cols-2"><label className="grid gap-1.5 text-sm">活动开始<input name="campaignStartDate" type="date" className="rounded-lg border bg-background px-3 py-2"/></label><label className="grid gap-1.5 text-sm">活动结束<input name="campaignEndDate" type="date" className="rounded-lg border bg-background px-3 py-2"/></label></div></div>
      <div className="mt-5 flex justify-end"><button type="button" onClick={() => setStep(2)} className="rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">继续：品牌与内容方向 →</button></div>
    </section>}

    {step === 2 && <section>
      <h2 className="text-lg font-semibold">品牌与内容方向</h2><p className="mt-1 text-sm text-muted-foreground">告诉我们要面向谁、主推什么，以及画面希望是什么感觉。</p>
      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="grid gap-5">
          <fieldset><legend className="mb-2 text-sm font-medium">本次主推什么？<span className="ml-1 text-xs font-normal text-muted-foreground">可多选</span></legend><div className="grid gap-2 sm:grid-cols-2">{featuredItems.map(([value, label, hint]) => <label key={value} className="flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition has-[:checked]:border-primary has-[:checked]:bg-primary/[0.04]"><input type="checkbox" name="featuredItems" value={value} className="mt-1 accent-primary"/><span><span className="block text-sm font-medium">{label}</span><span className="mt-0.5 block text-xs text-muted-foreground">{hint}</span></span></label>)}</div></fieldset>
          <label className="grid gap-1.5 text-sm">具体菜品、价格与供应信息<textarea name="specificOffer" rows={3} maxLength={1500} placeholder="例如：午餐套餐 €12.50，周一至周五 12–3 点；含味噌汤和三文鱼卷。请提供准确价格、条件与卖点。" className="rounded-lg border bg-background px-3 py-2.5"/></label>
          <label className="grid gap-1.5 text-sm">其他活动说明与必须出现的信息<textarea required name="campaignDetails" rows={3} maxLength={3000} placeholder="描述本次活动、希望顾客采取的动作，以及必须准确呈现的细节。" className="rounded-lg border bg-background px-3 py-2.5"/></label>
          <label className="grid gap-1.5 text-sm">希望吸引哪类顾客？<input name="targetAudience" maxLength={300} placeholder="附近上班族、学生、家庭客、聚会顾客……" className="rounded-lg border bg-background px-3 py-2.5"/></label>
          <fieldset><legend className="mb-2 text-sm font-medium">主要宣传角度</legend><div className="grid gap-2 sm:grid-cols-2"><label className="text-sm">选择方向<select name="campaignDirection" className="mt-1.5 w-full rounded-lg border bg-background px-3 py-2"><option value="lunch-set">午餐套餐</option><option value="new-arrival">新品上市</option><option value="limited-offer">限时优惠</option><option value="premium-signature">招牌菜</option><option value="healthy-light">新鲜健康</option><option value="seafood-feature">海鲜主打</option><option value="signature-platter">分享拼盘</option><option value="date-night">约会晚餐</option></select></label><label className="text-sm">发布时段<select name="preferredPostWindow" className="mt-1.5 w-full rounded-lg border bg-background px-3 py-2"><option value="flexible">灵活安排</option><option value="lunch">午餐时段</option><option value="evening">晚餐时段</option></select></label></div></fieldset>
          <fieldset><legend className="mb-2 text-sm font-medium">画面风格</legend><div className="grid gap-2 sm:grid-cols-2">{[["appetizing", "明亮诱人", "突出菜品色泽与细节"], ["warm", "温馨有氛围", "呈现空间与聚餐体验"], ["minimal", "简洁菜单感", "优惠、价格、时段一眼看懂"], ["follow-brand", "沿用现有品牌", "按你提供的 Logo、配色和样例"]].map(([value, label, hint], index) => <label key={value} className="flex items-center gap-2 rounded-xl border p-3 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/[0.04]"><input type="radio" name="visualStyle" value={value} defaultChecked={index === 0} className="accent-primary"/><span><span className="block font-medium">{label}</span><span className="block text-xs text-muted-foreground">{hint}</span></span></label>)}</div></fieldset>
          <div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-1.5 text-sm">文案语气<select name="brandVoice" className="rounded-lg border bg-background px-3 py-2"><option value="friendly">亲切友好</option><option value="casual">轻松活泼</option><option value="premium">精致高级</option><option value="expert">强调工艺与食材</option></select></label><label className="grid gap-1.5 text-sm">内容语言<select name="languagePreference" className="rounded-lg border bg-background px-3 py-2"><option value="en">English</option><option value="zh">中文</option></select></label></div>
          <fieldset><legend className="mb-2 text-sm font-medium">发布平台 <span className="text-xs font-normal text-muted-foreground">至少选择一个</span></legend><div className="flex flex-wrap gap-x-5 gap-y-2">{[["instagram", "Instagram"], ["facebook", "Facebook"], ["tiktok", "TikTok"]].map(([value, label]) => <label key={value} className="inline-flex items-center gap-2 text-sm"><input type="checkbox" name="platforms" value={value} className="accent-primary"/>{label}</label>)}</div></fieldset>
          <div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-1.5 text-sm">品牌 / Logo / 宣传参考<input name="brandReferences" maxLength={500} placeholder="品牌色、网站或社交账号链接" className="rounded-lg border bg-background px-3 py-2"/></label><label className="grid gap-1.5 text-sm">菜品与门店照片<input name="referenceFiles" type="file" accept="image/png,image/jpeg,image/webp" multiple className="rounded-lg border bg-background p-2 text-xs"/><span className="text-xs text-muted-foreground">最多 6 张，帮助我们使用真实菜品和品牌素材。</span></label></div>
          <label className="grid gap-1.5 text-sm">事实限制与不要出现的内容<textarea name="contentRestrictions" rows={2} maxLength={1000} placeholder="过敏原、不可承诺的信息、必须注明的条件、不要出现的元素……" className="rounded-lg border bg-background px-3 py-2.5"/></label>
        </div>
        <aside className="h-fit rounded-xl border bg-muted/30 p-4"><p className="text-xs font-semibold uppercase tracking-wider text-primary">内容方向预览</p><div className="mt-3 flex aspect-[4/3] flex-col justify-end rounded-lg border border-dashed bg-gradient-to-br from-muted to-background p-4"><span className="text-xs text-muted-foreground">真实菜品照片 + 清晰优惠信息</span><strong className="mt-2 text-lg">午餐好味道，也有好价格</strong></div><p className="mt-3 text-xs leading-5 text-muted-foreground">最终画面会根据你选择的主推内容、品牌素材和照片制作。</p></aside>
      </div>
      <div className="mt-5 flex items-center justify-between"><button type="button" onClick={() => setStep(1)} className="rounded-lg border px-4 py-2.5 text-sm">← 返回目标</button><button type="button" onClick={() => setStep(3)} className="rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">继续：套餐与提交 →</button></div>
    </section>}

    {step === 3 && <section>
      <h2 className="text-lg font-semibold">最后选择内容套餐</h2><p className="mt-1 text-sm text-muted-foreground">先定目标和创作方向，再按每月内容量选择。月历预览会随套餐同步更新。</p>
      <div className="mt-5">
        <div><div className="grid gap-3 sm:grid-cols-2">{(Object.entries(packagePlans) as [keyof typeof packagePlans, typeof packagePlans[keyof typeof packagePlans]][]).map(([id, plan]) => <button key={id} type="button" onClick={() => setTier(id)} aria-pressed={tier === id} className={`rounded-xl border p-4 text-left transition ${tier === id ? "border-primary bg-primary/[0.04] ring-1 ring-primary" : "hover:border-primary/50"}`}><span className="flex items-center justify-between font-semibold">{plan.name}{id === "growth" && <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] text-primary">更多内容</span>}</span><span className="mt-3 block text-3xl font-bold tracking-tight text-primary">€{plan.perPost}<span className="ml-1 text-base font-semibold">/ 条</span></span><span className="mt-1 block text-sm text-muted-foreground">€{(plan.price / 30).toFixed(2)} / 天 · {plan.posts} 条内容 / 月</span><span className="mt-2 block text-xs text-muted-foreground">套餐月费 €{plan.price} / 月 · 示例价格，最终交付范围提交后确认</span></button>)}</div>
          <section className="mt-4 rounded-xl border bg-card p-4"><div className="flex flex-wrap items-baseline justify-between gap-2"><h3 className="font-semibold">{selectedPlan.name} 月度内容日历预览</h3><span className="text-sm font-semibold text-primary">{selectedPlan.posts} 条 / 30 天</span></div><p className="mt-1 text-xs text-muted-foreground">套餐变化时，月历中的内容数量和排期示意同步变化；实际发布时间由团队确认。</p><div className="mt-3 grid grid-cols-7 gap-1.5 text-center">{["一", "二", "三", "四", "五", "六", "日"].map((day) => <span key={day} className="py-1 text-[10px] font-medium text-muted-foreground">{day}</span>)}{days.map(({ day, hasPost }) => <div key={day} className={`min-h-14 rounded-md border p-1 text-left text-[10px] ${hasPost ? "border-primary/40 bg-primary/[0.06]" : "border-border text-muted-foreground"}`}><span>{day}</span>{hasPost && <span className="mt-1 flex items-center gap-1"><Platform name="instagram" size={16}/><Platform name="facebook" size={16}/><Platform name="tiktok" size={16}/></span>}</div>)}</div></section>
          <div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="grid gap-1.5 text-sm">联系人姓名<input name="contactName" autoComplete="name" className="rounded-lg border bg-background px-3 py-2.5" placeholder="姓名"/></label><label className="grid gap-1.5 text-sm">联系邮箱<input name="contactEmail" type="email" autoComplete="email" className="rounded-lg border bg-background px-3 py-2.5" placeholder="you@example.com"/></label><label className="grid gap-1.5 text-sm">联系电话<input name="contactPhone" type="tel" className="rounded-lg border bg-background px-3 py-2.5"/></label><label className="grid gap-1.5 text-sm">餐厅名称<input name="businessName" className="rounded-lg border bg-background px-3 py-2.5" placeholder="餐厅名称"/></label><label className="grid gap-1.5 text-sm">城市 / 区域<input name="location" className="rounded-lg border bg-background px-3 py-2.5" placeholder="例如：Dublin 2"/></label><label className="grid gap-1.5 text-sm">网站或社交主页<input name="websiteUrl" type="url" placeholder="https://" className="rounded-lg border bg-background px-3 py-2.5"/></label></div>
        </div>
      </div>
      {state?.error && <p role="alert" className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{state.error}</p>}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t pt-4"><button type="button" onClick={() => setStep(2)} className="rounded-lg border px-4 py-2.5 text-sm">← 返回品牌与内容方向</button><p className="text-xs text-muted-foreground">第 3 步 / 3 · 套餐最后选择</p><button type="submit" disabled={pending} className="rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60">{pending ? "正在提交…" : "提交制作需求 →"}</button></div>
    </section>}
  </form>;
}
