"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, CalendarDays, Check, ChevronLeft, ChevronRight, Plus, RefreshCw, Sparkles, X } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import type { MarketingCalendarItem } from "@/components/visual/marketing-calendar";

type Goal = { id: string; title: string; detail: string; example: string };
type Product = { id: string; name: string; price: string; promotionalPrice: string; facts: string; photoDataUrl?: string; photoName?: string };
type CampaignPost = MarketingCalendarItem & { productId: string };

const GOALS: Goal[] = [
  { id: "footfall", title: "增加到店客流或预约", detail: "让附近顾客更愿意来店、订位或预约。", example: "例如：工作日午餐、周末预约" },
  { id: "promote", title: "推广新品或主推商品／服务", detail: "让顾客认识一个具体的新品、菜品或服务。", example: "例如：新品上市、主打项目" },
  { id: "repeat", title: "提高复购和会员活跃", detail: "鼓励老顾客回访，参与会员活动。", example: "例如：会员日、积分翻倍" },
  { id: "basket", title: "提高客单价和组合销售", detail: "通过套餐、加购或搭配介绍提升单次消费。", example: "例如：双人套餐、加购推荐" },
  { id: "offpeak", title: "带动淡时段或指定日期", detail: "把活动安排在你希望增加生意的时间。", example: "例如：周一至周四、午餐时段" },
  { id: "awareness", title: "提高服务地区内的知名度", detail: "让附近更多潜在顾客认识门店和服务。", example: "例如：介绍门店、服务特色" },
  { id: "unsure", title: "我还不确定", detail: "先告诉系统你最想改变的经营情况，再获得建议。", example: "可以先从一个小目标开始" },
];

const PROMOTIONS = ["限时特价", "买一送一／第二件优惠", "套餐／组合优惠", "满额优惠", "赠品／加价购", "会员日／积分活动", "淡时段优惠", "新客体验优惠", "节日或主题活动"];
const CHANNELS = ["Instagram", "Facebook", "TikTok", "小红书"];
const HERO_SLIDES = [
  { type: "capability", eyebrow: "门店社媒内容，一处安排", title: "把门店想宣传的内容，变成社媒上的帖子", body: "选择经营目标，系统帮你准备不同平台的图片和文案。你检查后，可以按日历安排发布。", goal: "从想法到发布，步骤清楚", image: "/demo/photos/restaurant-calendar/sushi-counter.jpg", platform: "Instagram" },
  { type: "campaign", eyebrow: "餐饮 · 午餐优惠", title: "让附近顾客知道，今天午餐有什么选择", body: "展示套餐内容、用餐时段和订位方式。活动效果可结合午餐订单或优惠使用情况观察。", goal: "活动目标：带动工作日午餐", image: "/demo/photos/restaurant-calendar/lunch-set.jpg", platform: "Instagram" },
  { type: "campaign", eyebrow: "美甲 · 会员日", title: "给老顾客一个回来预约的理由", body: "用会员日、积分活动或新款设计，安排一组有节奏的内容。", goal: "活动目标：促进回访和预约", image: "/demo/photos/nail-1.jpg", platform: "Facebook" },
  { type: "campaign", eyebrow: "餐饮 · 买一送一", title: "把活动规则说清楚，让顾客知道怎么参与", body: "展示参与商品、活动日期和适用条件；不编造折扣、库存或活动结果。", goal: "活动目标：推广指定商品", image: "/demo/photos/restaurant-calendar/salmon-dragon-roll.jpg", platform: "TikTok" },
];

const STEP_NAMES = ["营销目的", "门店资料", "活动方式", "商品信息", "发布安排"];

function dateKey(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
function makeDates(start: string, end: string) {
  const a = new Date(`${start}T12:00:00`); const b = new Date(`${end}T12:00:00`);
  if (!Number.isFinite(a.getTime()) || !Number.isFinite(b.getTime()) || b < a) return [];
  const days = Math.floor((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86400000) + 1;
  const count = days < 15 ? days : 20;
  return Array.from({ length: count }, (_, i) => { const d = new Date(a); d.setDate(a.getDate() + (days < 15 ? i : Math.round((days - 1) * i / (count - 1)))); return dateKey(d); });
}
function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("invalid_image"));
    reader.onload = () => {
      if (typeof reader.result !== "string") return reject(new Error("invalid_image"));
      const image = new window.Image();
      image.onerror = () => reject(new Error("invalid_image"));
      image.onload = () => {
        const scale = Math.min(1, 1600 / Math.max(image.naturalWidth, image.naturalHeight));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        const context = canvas.getContext("2d");
        if (!context) return reject(new Error("invalid_image"));
        context.fillStyle = "#fff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        let quality = 0.86;
        let dataUrl = canvas.toDataURL("image/jpeg", quality);
        while (dataUrl.length > 2_400_000 && quality > 0.5) {
          quality -= 0.1;
          dataUrl = canvas.toDataURL("image/jpeg", quality);
        }
        resolve(dataUrl);
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function ExperienceFrame({ children }: { children: ReactNode }) {
  return <main className="ps ps-workspace ps-storex"><header className="ps-workspace-header"><Logo href="/" /><span className="ps-workspace-header-label">门店自助营销</span><a className="ps-workspace-back" href="/">PoStory</a></header>{children}<footer className="ps-workspace-footer"><span>PoStory · 门店营销工作台</span><span>了解 · 制作 · 审核 · 发布</span></footer></main>;
}

function PhonePreview({ slide }: { slide: typeof HERO_SLIDES[number] }) {
  return <div className="storex-phone"><div className="storex-phone-top"><span className="storex-phone-speaker" /><span>9:41</span><span>•••</span></div><div className="storex-phone-social"><span className="storex-social-avatar">P</span><span><strong>{slide.platform === "Facebook" ? "PoStory 餐厅" : "postory.local"}</strong><small>推广 · 服务地区附近</small></span><i className={`storex-phone-platform ${slide.platform === "Facebook" ? "facebook" : "instagram"}`}>{slide.platform === "Facebook" ? "f" : "◎"}</i></div><div className="storex-phone-image"><Image src={slide.image} alt={slide.eyebrow} fill sizes="300px" unoptimized /></div><div className="storex-phone-copy"><div className="storex-phone-actions"><span>♡　◯　➤</span><span>▱</span></div><b>{slide.title}</b><p>{slide.body}</p><small>查看详情 · 联系门店</small></div><div className="storex-phone-home" /></div>;
}

function Landing({ onStart }: { onStart: () => void }) {
  const [slide, setSlide] = useState(0);
  const current = HERO_SLIDES[slide];
  useEffect(() => {
    const timer = window.setInterval(() => setSlide((currentSlide) => (currentSlide + 1) % HERO_SLIDES.length), 7000);
    return () => window.clearInterval(timer);
  }, []);
  return <ExperienceFrame><section className="storex-landing">
    <div className="storex-landing-intro"><span className="storex-eyebrow">门店自助营销</span><h1>让门店的社交媒体，<br />不再靠临时想内容</h1><p>先看看系统能帮你准备什么，再决定从哪个经营目标开始。</p></div>
    <section className={`storex-carousel ${current.type === "capability" ? "is-capability" : "is-campaign"}`} aria-live="polite">
      <div className="storex-carousel-copy"><span className="storex-eyebrow">{current.eyebrow}</span><h2>{current.title}</h2><p>{current.body}</p><div className="storex-outcome"><span>这类内容的目的</span><strong>{current.goal}</strong><small>示例展示的是营销方向，不代表实际业绩承诺。</small></div></div>
      <div className="storex-carousel-visual">{current.type === "capability" ? <div className="storex-capability-visual"><div className="storex-capability-brand"><span className="storex-capability-icon">P</span><strong>你的门店</strong><small>一个地方安排社媒内容</small></div><div className="storex-capability-arrow">↓</div><div className="storex-capability-steps"><span><b>1</b> 选宣传目标</span><span><b>2</b> 准备图片和文案</span><span><b>3</b> 检查日历内容</span><span><b>4</b> 安排发布</span></div><div className="storex-capability-platforms"><i>◎</i><i>f</i><i>♪</i><i>RED</i><small>按平台展示</small></div><PhonePreview slide={current} /></div> : <div className="storex-campaign-visual"><PhonePreview slide={current} /><div className="storex-platform-note"><strong>手机端预览</strong><span>发布前可检查图片与完整文案</span></div></div>}</div>
      <div className="storex-carousel-controls"><button type="button" aria-label="上一张" onClick={() => setSlide((slide - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)}><ChevronLeft size={18} /></button><div>{HERO_SLIDES.map((item, index) => <button type="button" key={item.eyebrow} className={index === slide ? "is-active" : ""} aria-label={`第 ${index + 1} 张`} aria-pressed={index === slide} onClick={() => setSlide(index)} />)}</div><button type="button" aria-label="下一张" onClick={() => setSlide((slide + 1) % HERO_SLIDES.length)}><ChevronRight size={18} /></button></div>
    </section>
    <div className="storex-landing-bottom"><div><strong>从你现在最想改善的事情开始</strong><span>无需先准备完整营销方案。</span></div><button className="storex-primary" type="button" onClick={onStart}>开始制定营销计划 <ArrowRight size={17} /></button></div>
  </section></ExperienceFrame>;
}

function Field({ label, children, required = false }: { label: string; children: ReactNode; required?: boolean }) { return <label className="storex-field"><span>{label}{required && <b> 必填</b>}</span>{children}</label>; }

export function StoreMarketingExperience() {
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState("");
  const [business, setBusiness] = useState("");
  const [industry, setIndustry] = useState("餐馆");
  const [location, setLocation] = useState("");
  const [wantsPromotion, setWantsPromotion] = useState<boolean | null>(null);
  const [promotionType, setPromotionType] = useState("");
  const [promotionDetails, setPromotionDetails] = useState("");
  const [promotionStart, setPromotionStart] = useState("");
  const [promotionEnd, setPromotionEnd] = useState("");
  const [currency, setCurrency] = useState("CAD");
  const [products, setProducts] = useState<Product[]>([{ id: "product-1", name: "", price: "", promotionalPrice: "", facts: "" }]);
  const [channels, setChannels] = useState<string[]>(["Instagram", "Facebook"]);
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(new Date(Date.now() + 29 * 86400000).toISOString().slice(0, 10));
  const [plan, setPlan] = useState<CampaignPost[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [month, setMonth] = useState(() => new Date(`${new Date().toISOString().slice(0, 7)}-01T12:00:00`));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [publishNotice, setPublishNotice] = useState(false);
  const [calendarRestored, setCalendarRestored] = useState(false);
  const selected = selectedId ? plan.find((item) => item.id === selectedId) ?? null : null;
  const dates = useMemo(() => makeDates(startDate, endDate), [startDate, endDate]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("postory-store-experience-v2");
      if (raw) {
        const data = JSON.parse(raw) as { goal?: string; business?: string; industry?: string; location?: string; promotionType?: string; promotionDetails?: string; promotionStart?: string; promotionEnd?: string; currency?: string; channels?: string[]; startDate?: string; endDate?: string; products?: Product[]; plan?: CampaignPost[]; started?: boolean; step?: number };
        if (data.goal) setGoal(data.goal); if (data.business) setBusiness(data.business); if (data.industry) setIndustry(data.industry); if (data.location) setLocation(data.location);
        if (data.promotionType) { setWantsPromotion(true); setPromotionType(data.promotionType); } if (data.promotionDetails) setPromotionDetails(data.promotionDetails); if (data.promotionStart) setPromotionStart(data.promotionStart); if (data.promotionEnd) setPromotionEnd(data.promotionEnd);
        if (data.currency) setCurrency(data.currency); if (data.channels) setChannels(data.channels); if (data.startDate) setStartDate(data.startDate); if (data.endDate) setEndDate(data.endDate); if (data.products) setProducts(data.products.map(({ photoDataUrl: _photo, ...product }) => product));
        if (data.plan?.length) { setPlan(data.plan.map((item) => ({ ...item, imageDataUrl: undefined }))); setSelectedId(data.plan[0].id); setStep(5); }
        setStarted(!!data.started); if (data.step !== undefined && !data.plan?.length) setStep(data.step);
      }
    } catch { localStorage.removeItem("postory-store-experience-v2"); }
    finally { setCalendarRestored(true); }
  }, []);
  useEffect(() => {
    if (!calendarRestored) return;
    try { localStorage.setItem("postory-store-experience-v2", JSON.stringify({ goal, business, industry, location, promotionType, promotionDetails, promotionStart, promotionEnd, currency, channels, startDate, endDate, products: products.map(({ photoDataUrl: _photo, ...product }) => product), plan: plan.map(({ imageDataUrl: _ignored, ...item }) => item), started, step })); } catch { /* Keep the current plan usable when browser storage is full. */ }
  }, [calendarRestored, goal, business, industry, location, promotionType, promotionDetails, promotionStart, promotionEnd, currency, channels, startDate, endDate, products, plan, started, step]);

  function updateProduct(id: string, patch: Partial<Product>) { setProducts((current) => current.map((item) => item.id === id ? { ...item, ...patch } : item)); }
  async function attachProductImage(id: string, file?: File) {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 10 * 1024 * 1024) { setError("请上传 10 MB 以内的 JPG、PNG 或 WebP 商品图片。"); return; }
    try { const photoDataUrl = await fileToDataUrl(file); updateProduct(id, { photoDataUrl, photoName: file.name }); setError(""); } catch { setError("图片读取失败，请换一张图片再试。"); }
  }
  function chooseGoal(id: string) { setGoal(id); setStep(1); setError(""); }
  function toggleChannel(channel: string) { setChannels((current) => current.includes(channel) ? current.filter((item) => item !== channel) : [...current, channel]); }

  async function generatePlan() {
    if (busy) return;
    const validProducts = products.filter((item) => item.name.trim());
    if (!validProducts.length) { setError("请至少添加一项主推商品或服务。"); setStep(3); return; }
    if (wantsPromotion && !promotionType) { setError("请选择一种促销方式，或返回选择不做促销。"); setStep(2); return; }
    if (!dates.length || !channels.length) { setError("请检查活动日期和发布渠道。"); setStep(4); return; }
    setBusy(true); setError("");
    const offer = wantsPromotion ? `${promotionType}。活动有效期：${promotionStart} 至 ${promotionEnd}。${promotionDetails.trim()}` : "本次不设置价格优惠，围绕已确认的商品／服务和经营目标进行推广。";
    const schedule = dates.map((date, index) => ({ date, platform: channels[index % channels.length] }));
    try {
      const response = await fetch("/api/marketing-calendar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ industry, businessName: business, location, audience: "门店服务地区内的潜在顾客", goal: GOALS.find((item) => item.id === goal)?.title ?? goal, offer, notes: "营销目的描述的是经营方向，促销方式只是可选办法。只使用商家确认的信息；不得承诺具体客流、销售额或利润结果。", products: validProducts.map((item) => ({ name: item.name, price: item.price ? `${currency} ${item.price}` : "", promotionalPrice: item.promotionalPrice ? `${currency} ${item.promotionalPrice}` : "", facts: item.facts })), platforms: channels, dates: schedule }) });
      const result = await response.json() as { ok?: boolean; reason?: string; posts?: Array<{ date: string; platform: string; headline: string; objective: string; copy: string; callToAction: string; visualDirection: string }> };
      if (!response.ok || !result.posts?.length) throw new Error(result.reason || "generation_failed");
      const next = result.posts.map((post, index) => ({ ...post, id: crypto.randomUUID(), date: post.date, status: "草稿" as const, imageStatus: "generating" as const, productId: validProducts[index % validProducts.length].id }));
      setPlan(next); setSelectedId(next[0].id); setMonth(new Date(`${next[0].date.slice(0, 7)}-01T12:00:00`)); setStep(5); setBusy(false);
      const makeImage = async (item: CampaignPost) => {
        try {
          const product = validProducts.find((candidate) => candidate.id === item.productId);
          const imageResponse = await fetch("/api/marketing-calendar/image", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ industry, platform: item.platform, headline: item.headline, objective: item.objective, visualDirection: item.visualDirection, imageDataUrl: product?.photoDataUrl }) });
          const imageResult = await imageResponse.json() as { ok?: boolean; imageUrl?: string; provider?: string; reason?: string };
          if (!imageResponse.ok || !imageResult.imageUrl) throw new Error(imageResult.reason || "image_generation_failed");
          setPlan((items) => items.map((current) => current.id === item.id ? { ...current, imageUrl: imageResult.imageUrl, imageProvider: imageResult.provider, imageStatus: "ready" } : current));
        } catch { setPlan((items) => items.map((current) => current.id === item.id ? { ...current, imageStatus: "failed" } : current)); }
      };
      await Promise.all(next.slice(0, 3).map(makeImage));
      void (async () => { for (let i = 3; i < next.length; i += 2) await Promise.all(next.slice(i, i + 2).map(makeImage)); })();
    } catch (cause) { setError(cause instanceof Error && cause.message !== "generation_failed" ? "计划生成暂时失败，请稍后重试。" : "计划生成暂时失败，请稍后重试。"); }
    finally { setBusy(false); }
  }

  async function regenerateImage(id: string) {
    const item = plan.find((candidate) => candidate.id === id); if (!item || busy) return;
    setBusy(true); setPlan((items) => items.map((current) => current.id === id ? { ...current, imageStatus: "generating" } : current));
    try {
      const product = products.find((candidate) => candidate.id === item.productId);
      const response = await fetch("/api/marketing-calendar/image", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ industry, platform: item.platform, headline: item.headline, objective: item.objective, visualDirection: item.visualDirection, imageDataUrl: product?.photoDataUrl, cacheBust: crypto.randomUUID() }) });
      const result = await response.json() as { imageUrl?: string; provider?: string; reason?: string };
      if (!response.ok || !result.imageUrl) throw new Error(result.reason || "failed");
      setPlan((items) => items.map((current) => current.id === id ? { ...current, imageUrl: result.imageUrl, imageProvider: result.provider, imageStatus: "ready" } : current));
    } catch { setError("配图生成失败，请检查模型配置后重试。"); setPlan((items) => items.map((current) => current.id === id ? { ...current, imageStatus: "failed" } : current)); }
    finally { setBusy(false); }
  }

  async function regenerateCopy(id: string) {
    const item = plan.find((candidate) => candidate.id === id); if (!item || busy) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/marketing-calendar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ industry, businessName: business, location, audience: "门店服务地区内的潜在顾客", goal: GOALS.find((candidate) => candidate.id === goal)?.title ?? goal, offer: wantsPromotion ? `${promotionType}。活动有效期：${promotionStart} 至 ${promotionEnd}。${promotionDetails}` : "不做促销", products: products.filter((p) => p.name.trim()).map((p) => ({ name: p.name, price: p.price ? `${currency} ${p.price}` : "", promotionalPrice: p.promotionalPrice ? `${currency} ${p.promotionalPrice}` : "", facts: p.facts })), platforms: [item.platform], dates: [{ date: item.date, platform: item.platform }], replace: { headline: item.headline, objective: item.objective, copy: item.copy, callToAction: item.callToAction, visualDirection: item.visualDirection }, avoid: plan.filter((p) => p.id !== id).map((p) => p.headline) }) });
      const result = await response.json() as { posts?: Array<{ headline: string; objective: string; copy: string; callToAction: string; visualDirection: string }> };
      if (!response.ok || !result.posts?.[0]) throw new Error("failed");
      const fresh = result.posts[0];
      setPlan((items) => items.map((current) => current.id === id ? { ...current, ...fresh, status: "草稿" } : current));
    } catch { setError("新文案生成失败，请稍后重试。"); }
    finally { setBusy(false); }
  }

  function movePost(id: string, date: string) { setPlan((items) => items.map((item) => item.id === id ? { ...item, date } : item)); }
  function publishOrSchedule() { setPublishNotice(true); }

  const productImageUrls = useMemo(() => new Map(products.flatMap((product) => product.photoDataUrl ? [[product.id, product.photoDataUrl] as const] : [])), [products]);
  const monthGrid = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1, 12);
    const cells: Array<string | null> = Array.from({ length: first.getDay() }, () => null);
    const length = new Date(month.getFullYear(), month.getMonth() + 1, 0, 12).getDate();
    for (let d = 1; d <= length; d++) cells.push(`${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
    while (cells.length % 7) cells.push(null);
    return cells;
  }, [month]);

  if (!started) return <Landing onStart={() => { setStarted(true); setStep(0); window.scrollTo({ top: 0, behavior: "smooth" }); }} />;

  return <ExperienceFrame><div className="storex-flow">
    <div className="storex-flow-top"><button className="storex-back" type="button" onClick={() => step === 0 ? setStarted(false) : setStep((current) => Math.max(0, current - 1))}><ArrowLeft size={16} />{step === 0 ? "返回介绍" : "上一步"}</button><span>门店营销计划</span></div>
    {step < 5 && <nav className="storex-stepper" aria-label="制作步骤">{STEP_NAMES.map((name, index) => <div key={name} className={index === step ? "is-current" : index < step ? "is-done" : ""}><span>{index < step ? <Check size={14} /> : index + 1}</span><b>{name}</b></div>)}</nav>}
    {step === 0 && <section className="storex-step-panel"><span className="storex-eyebrow">第 1 步 · 先选你最想改善的事</span><h1>这次营销，你最希望带来什么变化？</h1><p className="storex-step-help">先选一个主要目的。促销方式是后续可选的办法，不是必须做促销。</p><div className="storex-goals">{GOALS.map((item) => <button type="button" key={item.id} className={goal === item.id ? "is-selected" : ""} onClick={() => chooseGoal(item.id)}><strong>{item.title}</strong><span>{item.detail}</span><small>{item.example}</small><ArrowRight size={16} /></button>)}</div></section>}
    {step === 1 && <section className="storex-step-panel"><span className="storex-eyebrow">第 2 步 · 门店基本信息</span><h1>让计划符合你的门店和服务地区</h1><p className="storex-step-help">带星号的信息必填；不确定的商品细节可以之后再补。</p><div className="storex-form-grid"><Field label="门店名称" required><input value={business} onChange={(event) => setBusiness(event.target.value)} placeholder="例如：Sakura Sushi" /></Field><Field label="行业" required><select value={industry} onChange={(event) => setIndustry(event.target.value)}>{["餐馆", "美甲／美容", "零售店", "健身／健康", "家居服务", "其他本地商家"].map((item) => <option key={item}>{item}</option>)}</select></Field><Field label="服务地区" required><input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="城市、社区或邮编" /></Field><Field label="价格币种"><select value={currency} onChange={(event) => setCurrency(event.target.value)}><option value="CAD">CAD · 加元</option><option value="USD">USD · 美元</option><option value="EUR">EUR · 欧元</option></select></Field></div><div className="storex-step-actions"><button className="storex-primary" disabled={!business.trim() || !location.trim()} onClick={() => setStep(2)}>继续 <ArrowRight size={16} /></button></div></section>}
    {step === 2 && <section className="storex-step-panel"><span className="storex-eyebrow">第 3 步 · 活动方式</span><h1>这次计划要包含优惠活动吗？</h1><p className="storex-step-help">营销不一定要打折。你可以做常规推广，也可以选一种优惠形式。</p><div className="storex-choice-row"><button type="button" className={wantsPromotion === false ? "is-selected" : ""} onClick={() => { setWantsPromotion(false); setPromotionType(""); }}>不做促销<span>围绕商品、服务、门店特色或顾客问题制作内容。</span></button><button type="button" className={wantsPromotion === true ? "is-selected" : ""} onClick={() => setWantsPromotion(true)}>做促销活动<span>选择活动方式，再补充商品和活动规则。</span></button></div>{wantsPromotion && <div className="storex-promo-section"><h2>选择活动形式</h2><div className="storex-promo-list">{PROMOTIONS.map((item) => <button type="button" className={promotionType === item ? "is-selected" : ""} key={item} onClick={() => setPromotionType(item)}>{promotionType === item && <Check size={14} />}{item}</button>)}</div><div className="storex-form-grid storex-promo-dates"><Field label="活动开始日期" required><input type="date" value={promotionStart} onChange={(event) => setPromotionStart(event.target.value)} /></Field><Field label="活动结束日期" required><input type="date" value={promotionEnd} onChange={(event) => setPromotionEnd(event.target.value)} /></Field></div><Field label="活动规则与限制" required><textarea rows={3} value={promotionDetails} onChange={(event) => setPromotionDetails(event.target.value)} placeholder="例如：每位顾客限用一次；仅限堂食；不与其他优惠同时使用。只填写已确认的规则。" /></Field></div>}<div className="storex-step-actions"><button className="storex-primary" disabled={wantsPromotion === null || (wantsPromotion && (!promotionType || !promotionStart || !promotionEnd || promotionEnd < promotionStart || !promotionDetails.trim()))} onClick={() => setStep(3)}>继续添加主推商品／服务 <ArrowRight size={16} /></button></div></section>}
    {step === 3 && <section className="storex-step-panel"><span className="storex-eyebrow">第 4 步 · 商品和素材</span><h1>这次计划要介绍哪些商品或服务？</h1><p className="storex-step-help">可以添加多项。图片和价格只会用于相关内容；系统不会自行编造未确认的信息。</p><div className="storex-product-list">{products.map((item, index) => <article className="storex-product" key={item.id}><div className="storex-product-heading"><strong>主推商品／服务 {index + 1}</strong>{products.length > 1 && <button type="button" onClick={() => setProducts((current) => current.filter((product) => product.id !== item.id))}>移除</button>}</div><div className="storex-form-grid"><Field label="名称" required><input value={item.name} onChange={(event) => updateProduct(item.id, { name: event.target.value })} placeholder="例如：三文鱼寿司午餐组合" /></Field><Field label={`日常售价（${currency}）`}><input type="number" min="0" step="0.01" value={item.price} onChange={(event) => updateProduct(item.id, { price: event.target.value })} placeholder="选填" /></Field>{wantsPromotion && <Field label={`活动价／优惠后价格（${currency}）`}><input type="number" min="0" step="0.01" value={item.promotionalPrice} onChange={(event) => updateProduct(item.id, { promotionalPrice: event.target.value })} placeholder="按活动形式填写；不适用可留空" /></Field>}<Field label="真实卖点或商品说明"><textarea rows={2} value={item.facts} onChange={(event) => updateProduct(item.id, { facts: event.target.value })} placeholder="例如：套餐包含哪些内容；只写已确认的信息" /></Field><Field label="商品图片（选填）"><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => void attachProductImage(item.id, event.target.files?.[0])} /></Field></div>{item.photoName && productImageUrls.get(item.id) && <div className="storex-photo-preview"><Image src={productImageUrls.get(item.id)!} alt={`${item.name}图片`} width={120} height={90} unoptimized /><span>{item.photoName}</span></div>}{wantsPromotion && <p className="storex-product-promo-note">活动形式：{promotionType} · {promotionStart} 至 {promotionEnd} · {promotionDetails}</p>}</article>)}<button className="storex-add-product" type="button" onClick={() => setProducts((current) => [...current, { id: crypto.randomUUID(), name: "", price: "", promotionalPrice: "", facts: "" }])}><Plus size={15} />添加另一项商品／服务</button></div><div className="storex-step-actions"><button className="storex-primary" onClick={() => setStep(4)}>继续设置发布安排 <ArrowRight size={16} /></button></div></section>}
    {step === 4 && <section className="storex-step-panel"><span className="storex-eyebrow">第 5 步 · 发布安排</span><h1>选择发布周期和社交平台</h1><p className="storex-step-help">15 天以内每天安排一条；15 天及以上，按周期分配 20 条内容。生成后还可以在日历里调整。</p><div className="storex-form-grid"><Field label="开始日期" required><input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /></Field><Field label="结束日期" required><input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} /></Field><Field label="发布平台" required><div className="storex-channel-list">{CHANNELS.map((channel) => <label key={channel}><input type="checkbox" checked={channels.includes(channel)} onChange={() => toggleChannel(channel)} />{channel}</label>)}</div></Field></div><div className="storex-schedule-count"><CalendarDays size={17} />当前周期将生成 <strong>{dates.length}</strong> 条内容草稿</div>{error && <p className="storex-error" role="alert">{error}</p>}<div className="storex-step-actions"><button className="storex-primary" disabled={busy || !dates.length || !channels.length || !products.some((item) => item.name.trim())} onClick={() => void generatePlan()}>{busy ? "正在准备营销日历…" : "生成营销日历"} <Sparkles size={16} /></button></div></section>}
    {step === 5 && <section className="storex-calendar-page"><div className="storex-calendar-title"><div><span className="storex-eyebrow">{business} · 营销计划</span><h1>你的营销日历</h1><p>点击某一天的内容，在右侧预览手机效果并编辑。图片与文案可分别重新生成。</p></div><button type="button" className="storex-secondary" onClick={() => { setPlan([]); setStep(4); }}>调整计划日期</button></div>{error && <p className="storex-error" role="alert">{error}</p>}<div className="storex-calendar-layout"><section className="storex-calendar-shell"><div className="storex-month-title"><button type="button" aria-label="上个月" onClick={() => setMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1, 12))}><ChevronLeft size={17} /></button><h2>{new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "long" }).format(month)}</h2><button type="button" aria-label="下个月" onClick={() => setMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1, 12))}><ChevronRight size={17} /></button></div><div className="storex-calendar-grid"><div className="storex-weekdays">{"日 一 二 三 四 五 六".split(" ").map((day) => <span key={day}>{day}</span>)}</div><div className="storex-days">{monthGrid.map((date, index) => { const items = plan.filter((item) => item.date === date); return <div key={date ?? `blank-${index}`} className={`storex-day ${date ? "" : "is-blank"} ${items.length ? "has-posts" : ""}`} onDragOver={(event) => { if (date) event.preventDefault(); }} onDrop={(event) => { event.preventDefault(); const id = event.dataTransfer.getData("text/plain"); if (date && id) movePost(id, date); }} onClick={() => { if (items[0]) setSelectedId(items[0].id); }}><span>{date ? Number(date.slice(-2)) : ""}</span>{items.map((item) => <button type="button" draggable key={item.id} className={`storex-day-event ${selectedId === item.id ? "is-selected" : ""}`} onClick={(event) => { event.stopPropagation(); setSelectedId(item.id); }} onDragStart={(event) => event.dataTransfer.setData("text/plain", item.id)}>{item.platform === "Facebook" ? <i className="facebook">f</i> : item.platform === "Instagram" ? <i className="instagram">◎</i> : item.platform === "TikTok" ? <i className="tiktok">♪</i> : <i className="rednote">RED</i>}<strong>{item.headline}</strong></button>)}</div>; })}</div></div><div className="storex-calendar-legend"><span><i className="is-draft" />内容草稿</span><span>拖动卡片可改期</span></div></section>
      {selected ? <aside className="storex-drawer"><div className="storex-drawer-head"><div><span className="storex-eyebrow">{selected.date} · {selected.platform}</span><h2>内容预览与编辑</h2></div><button type="button" aria-label="关闭预览" onClick={() => setSelectedId(null)}><X size={18} /></button></div><div className="storex-phone storex-phone-drawer"><div className="storex-phone-top"><span className="storex-phone-speaker" /><span>9:41</span><span>•••</span></div><div className="storex-phone-social"><span className="storex-social-avatar">{business.slice(0, 1) || "店"}</span><span><strong>{business || "你的门店"}</strong><small>{selected.platform}</small></span><span className="storex-follow">关注</span></div><div className="storex-phone-image storex-drawer-image">{selected.imageUrl ? <Image src={selected.imageUrl} alt={selected.headline} fill sizes="360px" unoptimized /> : <div className="storex-image-loading">{selected.imageStatus === "generating" ? "正在生成配图…" : selected.imageStatus === "failed" ? "配图生成失败，请重试" : "社媒配图预览"}</div>}<button type="button" className="storex-image-retry" aria-label="重新生成图片" disabled={busy || selected.imageStatus === "generating"} onClick={() => void regenerateImage(selected.id)}><RefreshCw size={15} /></button></div><div className="storex-phone-copy"><div className="storex-phone-actions"><span>♡　◯　➤</span><span>▱</span></div><b>{selected.headline}</b><textarea aria-label="编辑发布文案" value={selected.copy} onChange={(event) => setPlan((items) => items.map((item) => item.id === selected.id ? { ...item, copy: event.target.value } : item))} /><small>{selected.callToAction}</small></div><div className="storex-phone-home" /></div><div className="storex-drawer-actions"><button type="button" className="storex-secondary" disabled={busy} onClick={() => void regenerateCopy(selected.id)}><Sparkles size={15} />重新生成文案</button><button type="button" className="storex-primary" disabled={selected.imageStatus === "generating" || selected.imageStatus === "failed"} onClick={publishOrSchedule}>安排自动发布 <ArrowRight size={15} /></button></div><p className="storex-publish-hint">安排发布前需要连接对应社媒账号；未连接的账号不会实际发布。</p></aside> : <aside className="storex-drawer storex-drawer-empty"><CalendarDays size={28} /><strong>选择日历中的一条内容</strong><span>右侧会显示图片、文案和发布设置。</span></aside>}</div></section>}
    {publishNotice && <div className="storex-modal-backdrop" role="presentation" onClick={() => setPublishNotice(false)}><section className="storex-publish-modal" role="dialog" aria-modal="true" aria-labelledby="publish-title" onClick={(event) => event.stopPropagation()}><button className="storex-modal-close" type="button" aria-label="关闭" onClick={() => setPublishNotice(false)}><X size={17} /></button><span className="storex-eyebrow">发布安排</span><h2 id="publish-title">这条内容已准备好进入发布流程</h2><p>确认日期、图片和文案后，内容可按日历安排发布。正式发布需要连接对应的社交账号。</p><p className="storex-publish-note">当前门店体验页用于查看完整制作流程，尚未启用真实账号授权和社媒发布，因此不会把内容标记为已发布。</p><div className="storex-modal-actions"><button type="button" className="storex-primary" onClick={() => setPublishNotice(false)}>返回日历继续检查</button></div></section></div>}
    {error && step !== 4 && <p className="storex-error" role="alert">{error}</p>}
  </div></ExperienceFrame>;
}
