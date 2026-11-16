"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ClipboardCheck,
  Download,
  FileImage,
  FileVideo,
  ImagePlus,
  Plus,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { AssessmentForm } from "./forms";
import { MarketingCalendar, type MarketingCalendarItem } from "./marketing-calendar";
import { loadTeamWorkspace, saveTeamWorkspace, type TeamAsset } from "@/lib/client/team-workspace-store";

export type Audience = "store" | "team" | "managed";

const OFFER_NAME: Record<Audience, string> = {
  store: "门店自助营销",
  team: "营销团队工作台",
  managed: "PoStory 营销代运营",
};

function WorkspaceFrame({ audience, children }: { audience: Audience; children: ReactNode }) {
  return (
    <main className="ps ps-workspace">
      <header className="ps-workspace-header">
        <Logo href="/" />
        <span className="ps-workspace-header-label">{OFFER_NAME[audience]}</span>
        <Link href="/" className="ps-workspace-back"><ArrowLeft size={15} /> PoStory</Link>
      </header>
      {children}
      <footer className="ps-workspace-footer"><span>PoStory · 营销计划与执行工作台</span><span>计划 · 审核 · 发布 · 回看</span></footer>
    </main>
  );
}

function Stepper({ current, steps }: { current: number; steps: string[] }) {
  return <nav className="ps-workspace-stepper" aria-label="流程进度">{steps.map((step, index) => <div key={step} className={`ps-workspace-step ${index === current ? "is-current" : index < current ? "is-done" : ""}`}><span>{index < current ? <Check size={14} /> : index + 1}</span><strong>{step}</strong>{index < steps.length - 1 && <i />}</div>)}</nav>;
}

function WorkspaceHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <div className="ps-workspace-heading"><span>{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>;
}

function Field({ label, children, wide = false, required = false }: { label: string; children: ReactNode; wide?: boolean; required?: boolean }) {
  return <label className={`ps-workspace-field ${wide ? "is-wide" : ""}`}><span>{label}{required && <b className="ps-required-mark" aria-label="必填"> *</b>}</span>{children}</label>;
}

type StoreProduct = {
  id: string;
  name: string;
  price: string;
  promotionalPrice: string;
  facts: string;
  photo: File | null;
};

type StoreBrief = {
  business: string;
  businessType: string;
  location: string;
  currency: "CAD" | "USD" | "EUR";
  products: StoreProduct[];
  goal: string;
  offer: string;
  start: string;
  end: string;
  channels: string[];
  mediaNotes: string;
};

const initialStoreBrief: StoreBrief = {
  business: "",
  businessType: "餐馆",
  location: "",
  currency: "CAD",
  products: [{ id: "product-1", name: "", price: "", promotionalPrice: "", facts: "", photo: null }],
  goal: "增加到店客流",
  offer: "",
  start: new Date().toISOString().slice(0, 10),
  end: new Date(Date.now() + 29 * 86400000).toISOString().slice(0, 10),
  channels: ["Instagram", "Facebook"],
  mediaNotes: "",
};

const CHANNELS = ["Instagram", "Facebook", "TikTok", "小红书"];
const STORE_CONTENT_ANGLES = [
  { topic: "主打商品", line: "用一张近景和一个具体细节介绍{item}，只写门店确认过的特色。", visual: "拍摄商品近景，补充真实的口感、材质或服务细节。" },
  { topic: "使用场景", line: "把镜头放进一个真实到店场景，说明顾客什么时候会需要{item}。", visual: "拍摄顾客动线或实际使用场景，不摆拍未提供的服务。" },
  { topic: "幕后故事", line: "从准备到交付，记录团队如何完成{item}，让顾客看到过程。", visual: "拍摄一段真实的制作、备货或服务准备过程。" },
  { topic: "顾客常见问题", line: "挑一个顾客常问的问题，用简短、准确的回答降低第一次体验的顾虑。", visual: "用问答卡片呈现一个已确认的问题和答案。" },
  { topic: "门店特色", line: "带顾客看一处真实的门店细节，并说明它如何改善到店体验。", visual: "拍摄门店空间或服务细节，避免使用未核实的设施描述。" },
  { topic: "活动预告", line: "活动优惠尚未确认时，不写折扣数字；先介绍活动主题和适合参与的人。", visual: "制作活动主题预告，明确标记待确认的日期和条款。" },
  { topic: "顾客声音", line: "邀请顾客分享他们选择{item}的原因；没有授权评价时，不编写顾客证言。", visual: "使用经授权的真实评价，或设计一个问题邀请评论。" },
  { topic: "团队介绍", line: "介绍一位团队成员负责的工作，以及他／她最在意的一个服务细节。", visual: "拍摄团队成员工作中的自然画面，并请本人确认介绍内容。" },
  { topic: "本地生活", line: "用一个本地日常场景说明顾客如何把{item}安排进今天的行程。", visual: "拍摄门店周边或真实到店路线；地址细节需先核对。" },
  { topic: "本月回顾", line: "回顾本月展示过的内容，邀请顾客投票选择下个月想了解的主题。", visual: "用本月真实素材拼成回顾，并加入一个简单投票问题。" },
  { topic: "商品细节", line: "从一个容易被忽略的细节重新介绍{item}，把卖点说具体而不夸大。", visual: "尝试俯拍、侧面或细节镜头，拍出与主打商品贴文不同的角度。" },
  { topic: "如何选择", line: "给顾客一个挑选{item}的实用标准，依据门店实际提供的选项来说明。", visual: "制作三步选择指南；每个选项先由门店确认。" },
  { topic: "服务流程", line: "拆解一次服务的关键步骤，让新顾客知道到店后会发生什么。", visual: "用连续照片或短视频展示真实流程，不承诺未确认的时长。" },
  { topic: "适合谁", line: "说明{item}适合什么需求，并同时讲清楚不适用或需要先咨询的情况。", visual: "制作一张适用情境说明，避免绝对化效果承诺。" },
  { topic: "常见误区", line: "针对{item}相关的一个常见误解给出澄清，答案只引用门店确认的信息。", visual: "用误区／事实两栏对照，先核对事实再发布。" },
  { topic: "顾客提问", line: "把本周收到的一个真实问题整理成贴文，并邀请其他顾客继续提问。", visual: "用真实私信或现场问题改写，发布前隐去顾客个人信息。" },
  { topic: "菜单／项目推荐", line: "请店主指定一个想重点介绍的菜单或服务项目，再说明它的实际特点。", visual: "拍摄项目本身并标注名称；没有确认价格就不显示价格。" },
  { topic: "营业信息", line: "提醒顾客查看已确认的营业时间、预约或取货方式，减少到店前的不确定。", visual: "用清晰信息卡展示经核实的时间和联系方式。" },
  { topic: "活动提醒", line: "只有活动日期和参与条件确认后，才提醒顾客最后参与时间；未确认时改发常规内容。", visual: "确认日期、库存和参与条件后再制作倒计时素材。" },
  { topic: "下月预告", line: "预告下个月准备介绍的新品、服务或幕后主题，并请顾客选最感兴趣的一项。", visual: "用投票或问题贴收集下月选题，不预告尚未确定的新品。" },
  { topic: "本周人气", line: "从近期真实的顾客选择中挑一个受欢迎的{item}，说明大家关注它的哪个特点。", visual: "展示真实售卖或预约情况；没有统计数据时，用店主确认的推荐理由代替。" },
  { topic: "价格与价值", line: "解释{item}的价格包含哪些已确认的内容，帮助顾客了解实际获得什么。", visual: "把已确认的规格、份量或服务范围列清楚，不作未经核实的对比。" },
  { topic: "搭配建议", line: "给出一种适合与{item}搭配的选择，依据门店实际提供的商品或服务来推荐。", visual: "并排拍摄搭配项目，注明是否为组合优惠；没有优惠就不暗示折扣。" },
  { topic: "细节特写", line: "用近距离画面展示{item}的一个真实细节，让顾客看清通常容易错过的部分。", visual: "拍摄纹理、切面、包装或操作细节，保持颜色和状态真实。" },
  { topic: "店主推荐", line: "请店主说说为什么会把{item}推荐给特定需求的顾客，并讲清适合的情境。", visual: "录制店主自然讲解，发布前确认推荐理由和适用范围。" },
  { topic: "预约或到店指南", line: "用简单步骤说明顾客如何预约、下单或到店体验{item}。", visual: "制作步骤卡片，确认链接、营业时间和预约方式准确可用。" },
  { topic: "季节需求", line: "结合当前季节的实际需求，说明顾客在什么情况下会考虑{item}。", visual: "使用当季门店实拍，避免承诺未经证实的效果或结果。" },
  { topic: "备货与准备", line: "记录门店为提供{item}所做的一项真实准备工作，展示服务背后的细节。", visual: "拍摄备货、清洁或准备过程，避开顾客隐私和未公开信息。" },
  { topic: "顾客选择指南", line: "帮助顾客根据自己的偏好挑选{item}，列出门店确认过的选择标准。", visual: "用清单或对比卡片呈现选项，信息由门店核对。" },
  { topic: "社区连接", line: "分享门店与附近社区的一件真实小事，并自然介绍{item}如何融入本地生活。", visual: "拍摄社区或门店周边真实场景，取得出镜者同意。" },
  { topic: "本月精选", line: "从本月内容里选一个顾客最值得先了解的{item}，用简洁信息邀请到店咨询。", visual: "组合本月真实素材，附上经确认的地址、营业时间或预约方式。" },
];

type PlannedPost = MarketingCalendarItem & { day: string; channel: string; topic: string; visual: string; productId: string | null; productName: string; imageProductId: string | null };

function businessTypeValue(type: string) {
  const values: Record<string, string> = {
    "餐馆": "Restaurant & Food",
    "美甲／美容": "Beauty & Wellness",
    "零售店": "Retail & Boutiques",
    "健身／健康": "Fitness & Health",
    "家居服务": "Home Services & Contractors",
  };
  return values[type] ?? "Other";
}

function marketingGoalValue(goal: string) {
  if (goal.includes("预约")) return "Increase bookings";
  if (goal.includes("知名度")) return "Build brand awareness";
  if (goal.includes("新品") || goal.includes("促销")) return "Promote services or products";
  return "Attract more customers";
}

function priceNumber(value: string) {
  const number = Number(value.replace(/\bCA\$|[$,\s]/gi, ""));
  return Number.isFinite(number) ? number : null;
}

function currencyPrefix(currency: StoreBrief["currency"]) {
  return currency === "USD" ? "US$" : currency === "EUR" ? "€" : "CA$";
}

function countCalendarDays(start: string, end: string) {
  const startTime = Date.parse(`${start}T00:00:00Z`);
  const endTime = Date.parse(`${end}T00:00:00Z`);
  if (!Number.isFinite(startTime) || !Number.isFinite(endTime) || endTime < startTime) return 0;
  return Math.floor((endTime - startTime) / 86400000) + 1;
}

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function marketingGenerationError(reason: string) {
  const messages: Record<string, string> = {
    provider_unavailable: "线上尚未配置 OPENAI_API_KEY。",
    provider_auth_failed: "OpenAI API key 无效或已过期，请检查线上配置。",
    codex_not_logged_in: "本地 Codex CLI 尚未登录，请先完成 Codex 登录。",
    codex_unavailable: "本机找不到 Codex CLI，请检查安装或 CODEX_CLI_PATH。",
    codex_timeout: "模型生成超时，请稍后重试。",
    codex_failed: "Codex CLI 执行失败，请查看本地开发服务器日志。",
    invalid_output: "模型返回内容格式不完整，请重新生成。",
    origin: "本地请求来源校验失败；请刷新页面后重试。",
    rate_limited: "请求次数较多，请稍后再试。",
  };
  return messages[reason] || "营销计划生成失败，请稍后重试或检查模型配置。";
}

function imageGenerationError(reason: string) {
  const messages: Record<string, string> = {
    codex_not_logged_in: "本机 Codex CLI 未登录，请在本机完成 ChatGPT 登录后重试。",
    codex_unavailable: "服务器找不到 Codex CLI，请检查安装和 CODEX_CLI_PATH。",
    codex_timeout: "Codex CLI 生成图片超时，请重试单张配图。",
    codex_no_image: "Codex CLI 没有写出图片文件；请重试，若再次失败请查看本地开发服务器日志。",
    codex_failed: "Codex CLI 图片任务执行失败；请查看本地开发服务器日志。",
    image_generation_failed: "OpenAI 图片服务拒绝了请求，请检查线上图片模型配置。",
    invalid_image: "上传的商品图片格式或大小不受支持。",
    rate_limited: "图片生成请求较多，请稍后重试。",
  };
  return messages[reason] || "配图生成失败，请检查模型配置或本地开发服务器日志。";
}

async function generatePostImage(input: { industry: string; platform: string; headline: string; objective: string; visualDirection: string; imageDataUrl?: string; cacheBust?: string }) {
  const response = await fetch("/api/marketing-calendar/image", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  const result = await response.json() as { ok?: boolean; imageUrl?: string; provider?: string; reason?: string };
  if (!response.ok || !result.imageUrl) throw new Error(result.reason || "image_generation_failed");
  return { imageUrl: result.imageUrl, imageProvider: result.provider };
}
async function cacheSourcePhoto(input: { industry: string; platform: string; headline: string; objective: string; visualDirection: string; imageDataUrl: string }) {
  const response = await fetch("/api/marketing-calendar/image", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...input, preserveSource: true }) });
  const result = await response.json() as { ok?: boolean; imageUrl?: string; provider?: string; reason?: string };
  if (!response.ok || !result.imageUrl) throw new Error(result.reason || "image_generation_failed");
  return { imageUrl: result.imageUrl, imageProvider: result.provider };
}
function fileAsDataUrl(file: Blob) {
  return new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("invalid_image")); reader.onerror = () => reject(new Error("invalid_image")); reader.readAsDataURL(file); });
}

function countScheduledPosts(start: string, end: string) {
  const calendarDays = countCalendarDays(start, end);
  return calendarDays === 0 ? 0 : calendarDays < 15 ? calendarDays : 20;
}

function makeStorePlan(brief: StoreBrief): PlannedPost[] {
  const start = new Date(`${brief.start}T12:00:00`);
  const end = new Date(`${brief.end}T12:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) return [];
  const calendarDays = countCalendarDays(brief.start, brief.end);
  const postCount = countScheduledPosts(brief.start, brief.end);
  const products = brief.products.filter((product) => product.name.trim());
  return Array.from({ length: postCount }, (_, index) => {
    const date = new Date(start);
    const dayOffset = calendarDays < 15 ? index : Math.round(((calendarDays - 1) * index) / (postCount - 1));
    date.setDate(start.getDate() + dayOffset);
    const angle = STORE_CONTENT_ANGLES[index % STORE_CONTENT_ANGLES.length];
    const product = products.length ? products[index % products.length] : null;
    const item = product ? `「${product.name}」` : "本店主打商品／服务（待门店补充）";
    const extra = angle.topic.includes("活动") && brief.offer ? ` 已确认活动：${brief.offer}。` : "";
    const itemDetails = product?.facts ? ` 已确认卖点：${product.facts}。` : "";
    const showPrice = ["主打商品", "商品细节", "菜单／项目推荐"].includes(angle.topic);
    const regular = product?.price ? priceNumber(product.price) : null;
    const promotional = product?.promotionalPrice ? priceNumber(product.promotionalPrice) : null;
    const isPromotionValid = promotional !== null && (regular === null || promotional < regular);
    const currency = currencyPrefix(brief.currency);
    const priceDetails = showPrice && product?.promotionalPrice && isPromotionValid
      ? ` 已确认促销价 ${currency}${product.promotionalPrice}${product.price ? `（原价 ${currency}${product.price}）` : ""}。`
      : showPrice && product?.price ? ` 已确认售价 ${currency}${product.price}。` : "";
    const productPhoto = product?.photo;
    const channel = brief.channels[index % Math.max(brief.channels.length, 1)] || "Instagram";
    return {
      id: crypto.randomUUID(), day: dateKey(date), date: dateKey(date),
      channel, platform: channel,
      topic: angle.topic, headline: angle.topic, objective: angle.topic, callToAction: "到店了解更多",
      copy: `${angle.line.replaceAll("{item}", item)}${itemDetails}${priceDetails}${extra}${angle.topic === "本地生活" && brief.location ? ` 结合${brief.location}顾客的日常动线来拍摄。` : ""}`,
      visual: productPhoto && product ? `使用你上传的「${product.name}」图片作为本条素材。${angle.visual}` : angle.visual, visualDirection: angle.visual,
      productId: product?.id ?? null,
      productName: product?.name ?? "",
      imageProductId: productPhoto && product ? product.id : null,
      status: "待审核" as const,
    };
  });
}

function StoreWorkspace() {
  const [step, setStep] = useState(0);
  const [brief, setBrief] = useState<StoreBrief>(initialStoreBrief);
  const [files, setFiles] = useState<File[]>([]);
  const [plan, setPlan] = useState<PlannedPost[] | null>(null);
  const [calendarRestored, setCalendarRestored] = useState(false);
  const [readyToRequest, setReadyToRequest] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [calendarBusyId, setCalendarBusyId] = useState<string | null>(null);
  const [planLoading, setPlanLoading] = useState(false);
  const scheduledPostCount = countScheduledPosts(brief.start, brief.end);
  const calendarDayCount = countCalendarDays(brief.start, brief.end);
  const productImageUrls = useMemo(() => new Map(brief.products.flatMap((product) => product.photo ? [[product.id, URL.createObjectURL(product.photo)] as const] : [])), [brief.products]);

  useEffect(() => () => {
    productImageUrls.forEach((url) => URL.revokeObjectURL(url));
  }, [productImageUrls]);
  useEffect(() => {
    queueMicrotask(() => {
      try {
        const saved = localStorage.getItem("postory-store-calendar-v1");
        if (saved) {
          const data = JSON.parse(saved) as { brief?: Omit<StoreBrief, "products"> & { products?: Array<Omit<StoreProduct, "photo">> }; plan?: PlannedPost[] };
          if (data.brief) setBrief({ ...initialStoreBrief, ...data.brief, products: data.brief.products?.map((item) => ({ ...item, photo: null })) ?? initialStoreBrief.products });
          if (Array.isArray(data.plan) && data.plan.length) { setPlan(data.plan.map((item) => ({ ...item, imageDataUrl: undefined, imageStatus: item.imageUrl ? "ready" : "failed" }))); setStep(3); }
        }
      } catch { localStorage.removeItem("postory-store-calendar-v1"); }
      finally { setCalendarRestored(true); }
    });
  }, []);
  useEffect(() => {
    if (!calendarRestored) return;
    try {
      if (!plan) { localStorage.removeItem("postory-store-calendar-v1"); return; }
      const briefData = { ...brief, products: brief.products.map((product) => ({ id: product.id, name: product.name, price: product.price, promotionalPrice: product.promotionalPrice, facts: product.facts })) };
      const savedPlan = plan.map((item) => { const copy = { ...item }; delete copy.imageDataUrl; return copy; });
      localStorage.setItem("postory-store-calendar-v1", JSON.stringify({ brief: briefData, plan: savedPlan }));
    } catch { /* Keep the current session usable if browser storage is unavailable. */ }
  }, [brief, calendarRestored, plan]);

  function update<K extends keyof StoreBrief>(key: K, value: StoreBrief[K]) {
    setBrief((current) => ({ ...current, [key]: value }));
  }
  function updateProduct(id: string, patch: Partial<StoreProduct>) {
    setBrief((current) => ({ ...current, products: current.products.map((product) => product.id === id ? { ...product, ...patch } : product) }));
  }
  function addProduct() {
    if (brief.products.length >= 10) return;
    setBrief((current) => ({ ...current, products: [...current.products, { id: crypto.randomUUID(), name: "", price: "", promotionalPrice: "", facts: "", photo: null }] }));
  }
  function removeProduct(id: string) {
    if (brief.products.length <= 1) return;
    setBrief((current) => ({ ...current, products: current.products.filter((product) => product.id !== id) }));
  }
  function addFiles(fileList: FileList | null) {
    if (!fileList) return;
    const next = [...files, ...Array.from(fileList)];
    if (next.length > 5) { setUploadError("一次最多添加 5 个图片或视频文件。"); return; }
    if (next.some((file) => !file.type.startsWith("image/") && !file.type.startsWith("video/"))) { setUploadError("请只选择图片或视频文件。"); return; }
    if (next.some((file) => file.size > 100 * 1024 * 1024)) { setUploadError("单个文件不能超过 100 MB。"); return; }
    setUploadError("");
    setFiles(next);
  }
  function toggleChannel(channel: string) {
    update("channels", brief.channels.includes(channel) ? brief.channels.filter((item) => item !== channel) : [...brief.channels, channel]);
  }
  async function requestMarketingPlan(dates: Array<{ date: string; platform: string }>, replace?: PlannedPost, avoid: string[] = []) {
    const response = await fetch("/api/marketing-calendar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
      industry: brief.businessType, businessName: brief.business, location: brief.location, audience: "本地门店周边顾客", goal: brief.goal, offer: brief.offer, notes: brief.mediaNotes,
      products: brief.products.filter((product) => product.name.trim()).map((product) => ({ name: product.name, price: product.price ? `${brief.currency} ${product.price}` : "", promotionalPrice: product.promotionalPrice ? `${brief.currency} ${product.promotionalPrice}` : "", facts: product.facts })),
      platforms: brief.channels, dates, ...(replace ? { replace: { headline: replace.headline, objective: replace.objective, copy: replace.copy, callToAction: replace.callToAction, visualDirection: replace.visualDirection } } : {}), avoid,
    }) });
    const result = await response.json() as { ok?: boolean; reason?: string; provider?: string; posts?: Array<{ date: string; platform: string; headline: string; objective: string; copy: string; callToAction: string; visualDirection: string }> };
    if (!response.ok || !result.ok || !result.posts) throw new Error(result.reason || "generation_failed");
    return result;
  }
  async function createPlan() {
    if (!brief.products.some((product) => product.name.trim())) { setUploadError("请至少添加一项本月主推商品或服务。"); setStep(1); return; }
    const schedule = makeStorePlan(brief);
    if (!schedule.length) { setUploadError("请检查计划开始和结束日期。"); return; }
    setPlanLoading(true); setUploadError("");
    try {
      const result = await requestMarketingPlan(schedule.map((post) => ({ date: post.day, platform: post.channel })));
      const next = result.posts!.map((post, index) => ({ ...schedule[index], id: crypto.randomUUID(), day: post.date, date: post.date, channel: post.platform, platform: post.platform, topic: post.headline, headline: post.headline, objective: post.objective, copy: post.copy, callToAction: post.callToAction, visual: post.visualDirection, visualDirection: post.visualDirection, status: "待审核" as const }));
      setPlan(next.map((item) => ({ ...item, imageStatus: "generating" as const }))); setStep(3);
      setPlanLoading(false);
      const sourcePhotos = [...brief.products.map((product) => product.photo).filter((photo): photo is File => Boolean(photo)), ...files.filter((file) => file.type.startsWith("image/"))];
      const usedPhotos = new Set<File>();
      const generateItemImage = async (item: PlannedPost) => {
        try {
          const productPhoto = item.imageProductId ? brief.products.find((product) => product.id === item.imageProductId)?.photo : null;
          const photo = (productPhoto && !usedPhotos.has(productPhoto) ? productPhoto : sourcePhotos.find((candidate) => !usedPhotos.has(candidate))) ?? null;
          if (photo) {
            usedPhotos.add(photo);
            const image = await cacheSourcePhoto({ industry: brief.businessType, platform: item.platform, headline: item.headline, objective: item.objective, visualDirection: item.visualDirection, imageDataUrl: await fileAsDataUrl(photo) });
            setPlan((items) => items?.map((current) => current.id === item.id ? { ...current, ...image, imageStatus: "ready" } : current) ?? null);
          } else {
            const image = await generatePostImage({ industry: brief.businessType, platform: item.platform, headline: item.headline, objective: item.objective, visualDirection: item.visualDirection });
            setPlan((items) => items?.map((current) => current.id === item.id ? { ...current, ...image, imageStatus: "ready" } : current) ?? null);
          }
        } catch { setPlan((items) => items?.map((current) => current.id === item.id ? { ...current, imageStatus: "failed" } : current) ?? null); }
      };
      await Promise.all(next.slice(0, 3).map(generateItemImage));
      void (async () => { for (let index = 3; index < next.length; index += 2) await Promise.all(next.slice(index, index + 2).map(generateItemImage)); })();
    } catch (error) { setUploadError(marketingGenerationError(error instanceof Error ? error.message : "generation_failed")); }
    finally { setPlanLoading(false); }
  }
  async function replacePlanItem(id: string) {
    if (!plan) return; const current = plan.find((item) => item.id === id); if (!current) return;
    setCalendarBusyId(id);
    try {
      const result = await requestMarketingPlan([{ date: current.date, platform: current.platform }], current, plan.filter((item) => item.id !== id).map((item) => item.headline));
      const candidate = result.posts?.[0]; if (!candidate) return;
      const updated = { ...current, headline: candidate.headline, topic: candidate.headline, objective: candidate.objective, copy: candidate.copy, callToAction: candidate.callToAction, visualDirection: candidate.visualDirection, visual: candidate.visualDirection, imageDataUrl: undefined, imageUrl: undefined, imageStatus: "generating" as const, status: "待审核" as const };
      setPlan((items) => items?.map((item) => item.id === id ? updated : item) ?? null);
      const productPhoto = updated.imageProductId ? brief.products.find((product) => product.id === updated.imageProductId)?.photo : null;
      const image = await generatePostImage({ industry: brief.businessType, platform: updated.platform, headline: updated.headline, objective: updated.objective, visualDirection: updated.visualDirection, imageDataUrl: productPhoto ? await fileAsDataUrl(productPhoto) : undefined, cacheBust: crypto.randomUUID() });
      setPlan((items) => items?.map((item) => item.id === id ? { ...item, ...image, imageStatus: "ready" } : item) ?? null);
    } catch (error) { setUploadError(`换方案或配图失败：${imageGenerationError(error instanceof Error ? error.message : "generation_failed")}`); setPlan((items) => items?.map((item) => item.id === id ? { ...item, imageStatus: item.imageDataUrl ? "ready" : "failed" } : item) ?? null); }
    finally { setCalendarBusyId(null); }
  }
  async function generateCalendarImage(id: string) {
    const current = plan?.find((item) => item.id === id); if (!current) return;
    setCalendarBusyId(id); setPlan((items) => items?.map((item) => item.id === id ? { ...item, imageStatus: "generating" } : item) ?? null);
    try {
      const source = current.imageProductId ? brief.products.find((product) => product.id === current.imageProductId)?.photo : null;
      const image = await generatePostImage({ industry: brief.businessType, platform: current.platform, headline: current.headline, objective: current.objective, visualDirection: current.visualDirection, imageDataUrl: source ? await fileAsDataUrl(source) : undefined, cacheBust: crypto.randomUUID() });
      setPlan((items) => items?.map((item) => item.id === id ? { ...item, ...image, imageStatus: "ready" } : item) ?? null);
    } catch (error) { setUploadError(imageGenerationError(error instanceof Error ? error.message : "generation_failed")); setPlan((items) => items?.map((item) => item.id === id ? { ...item, imageStatus: "failed" } : item) ?? null); }
    finally { setCalendarBusyId(null); }
  }
  function movePlanItem(id: string, date: string) { setPlan((items) => items?.map((item) => item.id === id ? { ...item, day: date, date } : item) ?? null); }
  function approve(id: string) { setPlan((items) => items?.map((post) => post.id === id ? { ...post, status: "待发布" } : post) ?? null); }
  function downloadPlan() {
    if (!plan) return;
    const rows = ["日期,渠道,主题,关联商品／服务,币种,内容草稿,画面建议,状态", ...plan.map((post) => [post.day, post.channel, post.topic, post.productName, brief.currency, post.copy, post.visual, post.status].map((cell) => `"${cell.replaceAll('"', '""')}"`).join(","))];
    const url = URL.createObjectURL(new Blob(["\ufeff" + rows.join("\n")], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = `${brief.business || "门店"}-营销计划.csv`; link.click(); URL.revokeObjectURL(url);
  }
  const currency = currencyPrefix(brief.currency);
  const productSummary = brief.products.filter((product) => product.name.trim()).map((product) => `${product.name}${product.price ? ` 售价 ${currency}${product.price}` : ""}${product.promotionalPrice ? ` 促销价 ${currency}${product.promotionalPrice}` : ""}${product.facts ? `；卖点：${product.facts}` : ""}`).join("\n");
  const details = [`套餐入口：${OFFER_NAME.store}`, `门店：${brief.business}`, `行业：${brief.businessType}`, `地区：${brief.location}`, `价格币种：${brief.currency}`, `主推商品／服务：\n${productSummary}`, `目标：${brief.goal}`, `活动：${brief.offer}`, `素材：${files.map((file) => file.name).join("、")}`, `素材说明：${brief.mediaNotes}`, `渠道：${brief.channels.join("、")}`, `周期：${brief.start} - ${brief.end}`, `营销日历：${plan?.map((post) => `${post.date} ${post.platform} ${post.headline}【${post.status}】\n${post.copy.slice(0, 220)}`).join("\n\n") ?? "尚未生成"}`].join("\n").slice(0, 10_000);


  return <WorkspaceFrame audience="store"><div className="ps-workspace-main">
    <WorkspaceHeading eyebrow="门店自助营销 · 建立本月计划" title="先把门店情况告诉 PoStory" description="按步骤补充门店、商品、素材和营销目标；计划按所选日期每天安排一条内容，由你审核并可下载。价格、优惠和商品事实由你确认。" />
    <Stepper current={step} steps={["门店与素材", "主推商品", "营销目标", "内容日历"]} />
    {step === 0 && <section className="ps-workspace-card ps-store-intake">
      <h2>01 · 门店情况与现有素材</h2>
      <p className="ps-workspace-help">先告诉我们门店是什么、服务哪里，再放入已有素材。门店照片和视频都不是必填项；没有素材也可以继续。主推商品会在下一步单独整理。</p>
      <div className="ps-workspace-fields">
        <Field label="门店名称" required><input required value={brief.business} onChange={(event) => update("business", event.target.value)} placeholder="例如：Sakura Sushi" /></Field>
        <Field label="行业" required><select value={brief.businessType} onChange={(event) => update("businessType", event.target.value)}>{["餐馆", "美甲／美容", "零售店", "健身／健康", "家居服务", "其他本地商家"].map((item) => <option key={item}>{item}</option>)}</select></Field>
        <Field label="服务地区" required><input required value={brief.location} onChange={(event) => update("location", event.target.value)} placeholder="城市、社区或邮编" /></Field>
      </div>
      <div className="ps-store-media-section">
        <div><h3>门店照片或视频 <span>选填</span></h3><p>最多添加 5 个，用于展示环境、活动、制作过程或团队；商品图请在下一步上传到对应商品。</p></div>
        <label className="ps-workspace-drop"><input type="file" accept="image/*,video/*" multiple onChange={(event) => addFiles(event.target.files)} /><ImagePlus size={25} /><strong>选择图片或视频</strong><span>最多 5 个文件，单个不超过 100 MB</span><em>选择文件</em></label>
        {uploadError && step === 0 && <p className="ps-workspace-error" role="alert">{uploadError}</p>}
        <div className="ps-workspace-file-list">{files.map((file, index) => <article key={`${file.name}-${index}`}><span className="ps-workspace-file-icon">{file.type.startsWith("video/") ? <FileVideo /> : <FileImage />}</span><div><strong>{file.name}</strong><small>{(file.size / 1024 / 1024).toFixed(1)} MB · {file.type.startsWith("video/") ? "视频" : "图片"}</small></div><button aria-label={`移除 ${file.name}`} onClick={() => setFiles((current) => current.filter((_, fileIndex) => fileIndex !== index))}><X size={16} /></button></article>)}</div>
        <Field label="这些素材想表达什么（选填）" wide><textarea rows={3} value={brief.mediaNotes} onChange={(event) => update("mediaNotes", event.target.value)} placeholder="例如：照片展示用餐环境；视频介绍周末全店促销活动。" /></Field>
      </div>
      <div className="ps-workspace-actions"><button className="ps-workspace-primary" disabled={!brief.business.trim() || !brief.location.trim()} onClick={() => setStep(1)}>继续整理主推商品 <ArrowRight size={16} /></button></div>
    </section>}
    {step === 1 && <section className="ps-workspace-card ps-store-intake">
      <h2>02 · 本月主推商品／服务</h2>
      <p className="ps-workspace-help">每项商品或服务单独填写。商品名称必填；价格、优惠、卖点和图片按你已确认的信息补充，系统会把它们带入相关营销内容。</p>
      <div className="ps-store-currency-row"><Field label="价格币种"><select value={brief.currency} onChange={(event) => update("currency", event.target.value as StoreBrief["currency"])}><option value="CAD">CAD · 加元</option><option value="USD">USD · 美元</option><option value="EUR">EUR · 欧元</option></select></Field><p>此设置适用于下面所有商品的日常售价和促销价，不会进行汇率换算。</p></div>
      <div className="ps-store-product-list">
        <div className="ps-workspace-card-title"><div><h3>商品与服务清单</h3><p>最多添加 10 项。促销价低于日常售价时，内容草稿会显示优惠和原价。</p></div><button className="ps-workspace-inline" type="button" disabled={brief.products.length >= 10} onClick={addProduct}><Plus size={14} />添加商品／服务</button></div>
        {brief.products.map((product, index) => <article className="ps-store-product-row" key={product.id}>
          <div className="ps-store-product-row-head"><strong>商品／服务 {index + 1}</strong>{brief.products.length > 1 && <button type="button" className="ps-store-remove-product" onClick={() => removeProduct(product.id)}><X size={14} />移除</button>}</div>
          <div className="ps-store-product-fields">
            <Field label="名称" required><input required value={product.name} onChange={(event) => updateProduct(product.id, { name: event.target.value })} placeholder="例如：三文鱼寿司拼盘" /></Field>
            <Field label="日常售价"><input type="number" min="0" step="0.01" inputMode="decimal" value={product.price} onChange={(event) => updateProduct(product.id, { price: event.target.value })} placeholder="例如：28" /></Field>
            <Field label="促销价（选填）"><input type="number" min="0" step="0.01" inputMode="decimal" value={product.promotionalPrice} onChange={(event) => updateProduct(product.id, { promotionalPrice: event.target.value })} placeholder="例如：24；没有促销就留空" /></Field>
            <Field label="商品／服务的真实卖点" wide><textarea rows={2} maxLength={400} value={product.facts} onChange={(event) => updateProduct(product.id, { facts: event.target.value })} placeholder="写已确认的配料、材质、服务内容或特色；没有就留空" /></Field>
            <div className="ps-store-product-photo-field"><label><span>这项商品／服务的图片</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { const photo = event.target.files?.[0]; if (!photo) return; if (!photo.type.startsWith("image/")) { setUploadError("商品图片请使用 JPG、PNG 或 WebP 图片。"); return; } if (photo.size > 10 * 1024 * 1024) { setUploadError("单张商品图片不能超过 10 MB，便于生成配图时安全处理。"); return; } setUploadError(""); updateProduct(product.id, { photo }); }} /></label>{product.photo && <button type="button" className="ps-store-clear-photo" onClick={() => updateProduct(product.id, { photo: null })}>移除图片</button>}</div>
            <div className="ps-store-product-photo-preview">{product.photo && productImageUrls.get(product.id) ? <Image src={productImageUrls.get(product.id)!} alt={`${product.name || "商品／服务"}图片预览`} fill unoptimized className="object-cover" /> : <div><ImagePlus size={19} /><span>尚未上传图片</span></div>}</div>
          </div>
        </article>)}
      </div>
      {uploadError && step === 1 && <p className="ps-workspace-error" role="alert">{uploadError}</p>}
      <div className="ps-workspace-actions"><button className="ps-workspace-quiet-button" onClick={() => setStep(0)}>上一步</button><button className="ps-workspace-primary" disabled={!brief.products.some((product) => product.name.trim())} onClick={() => setStep(2)}>继续设置营销目标 <ArrowRight size={16} /></button></div>
    </section>}
    {step === 2 && <section className="ps-workspace-card"><h2>03 · 营销目标与排期</h2><p className="ps-workspace-help">设定活动周期与发布渠道。少于 15 天时每天安排 1 条；15 天及以上安排 20 条。{scheduledPostCount > 0 ? `当前周期共 ${calendarDayCount} 天，将生成 ${scheduledPostCount} 条草稿。` : "请检查开始日期和结束日期。"}</p><div className="ps-workspace-fields"><Field label="本月主要目标" required><select value={brief.goal} onChange={(event) => update("goal", event.target.value)}>{["增加到店客流", "增加预约／订位", "推广新品或服务", "提高本地知名度", "宣传促销活动"].map((item) => <option key={item}>{item}</option>)}</select></Field><Field label="活动或优惠（选填）"><input value={brief.offer} onChange={(event) => update("offer", event.target.value)} placeholder="已确认的折扣、套餐或活动" /></Field><Field label="开始日期" required><input required type="date" value={brief.start} onChange={(event) => update("start", event.target.value)} /></Field><Field label="结束日期" required><input required type="date" value={brief.end} onChange={(event) => update("end", event.target.value)} /></Field><Field label="计划发布渠道" wide required><div className="ps-workspace-channels">{CHANNELS.map((channel) => <button type="button" key={channel} className={brief.channels.includes(channel) ? "is-selected" : ""} onClick={() => toggleChannel(channel)}><span>{brief.channels.includes(channel) && <Check size={12} />}</span>{channel}</button>)}</div></Field></div><div className="ps-workspace-actions"><button className="ps-workspace-quiet-button" onClick={() => setStep(1)}>上一步</button><button className="ps-workspace-primary" disabled={planLoading || !brief.channels.length || !scheduledPostCount} onClick={createPlan}><Sparkles size={16} />{planLoading ? "正在生成营销计划…" : scheduledPostCount ? "生成营销计划草稿" : "请检查计划日期"}</button></div></section>}
    {uploadError && step === 2 && <p className="ps-workspace-error" role="alert">{uploadError}</p>}
    {step === 3 && plan && <><section className="ps-workspace-plan-head"><div><span className="ps-workspace-kicker">{brief.business} · {brief.start} — {brief.end}</span><h2>本月营销日历</h2><p>先生成近期 3 条内容的配图；其余图片在后台继续完成。已上传的门店照片会优先用于不同内容，AI 配图和照片链接会保存，刷新后可直接复用。</p></div><div className="ps-workspace-plan-actions"><button className="ps-workspace-quiet-button" onClick={downloadPlan}><Download size={15} />下载 CSV</button><button className="ps-workspace-quiet-button" onClick={() => { setStep(2); setPlan(null); }}><Sparkles size={15} />调整计划</button></div></section>{uploadError && <p className="ps-workspace-error" role="alert">{uploadError}</p>}<MarketingCalendar items={plan} onMove={movePlanItem} onReplace={replacePlanItem} onGenerateImage={generateCalendarImage} onApprove={approve} busyId={calendarBusyId} /><section className="ps-workspace-submit"><div><h2>需要 PoStory 帮你开通工作区？</h2><p>留下联系方式和本次计划资料，我们会按门店自助流程与你联系。</p></div><button className="ps-workspace-primary" onClick={() => setReadyToRequest((current) => !current)}>{readyToRequest ? "收起申请表" : "申请开始使用"}<ArrowRight size={16} /></button>{readyToRequest && <div className="ps-workspace-request-form"><AssessmentForm offer="store" initial={{ shopName: brief.business, location: brief.location, businessType: businessTypeValue(brief.businessType), goal: marketingGoalValue(brief.goal), details }} /></div>}</section></>}
  </div></WorkspaceFrame>;
}

type TeamPost = { id: string; date: string; channel: string; title: string; copy: string; objective?: string; callToAction?: string; visualDirection?: string; imageDataUrl?: string; imageUrl?: string; imageProvider?: string; imageStatus?: "generating" | "ready" | "failed"; status: "草稿" | "待审核" | "已批准" | "已发布"; assetIds?: string[]; owner?: string };
function TeamWorkspace() {
  const [tab, setTab] = useState("总览");
  const [posts, setPosts] = useState<TeamPost[]>([]);
  const [assets, setAssets] = useState<TeamAsset[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [channel, setChannel] = useState("Instagram");
  const [caption, setCaption] = useState("");
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
  const [teamBusiness, setTeamBusiness] = useState("");
  const [teamIndustry, setTeamIndustry] = useState("其他本地商家");
  const [teamLocation, setTeamLocation] = useState("");
  const [teamBusyId, setTeamBusyId] = useState<string | null>(null);
  const [teamSaving, setTeamSaving] = useState(false);
  const [aiDraftLoading, setAiDraftLoading] = useState(false);
  const [aiDraft, setAiDraft] = useState<{ objective: string; callToAction: string; visualDirection: string; imageUrl?: string; imageProvider?: string } | null>(null);
  const [teamProfileError, setTeamProfileError] = useState("");
  const [assetNote, setAssetNote] = useState("");
  const [assetError, setAssetError] = useState("");

  useEffect(() => {
    let active = true;
    loadTeamWorkspace().then((saved) => {
      if (!active) return;
      const savedPosts = (saved?.posts ?? []).filter((post): post is TeamPost => Boolean(post && typeof post === "object" && "id" in post && !["a", "b", "c", "d"].includes(String((post as TeamPost).id))));
      setPosts(savedPosts);
      setAssets((saved?.assets ?? []).filter((asset): asset is TeamAsset => Boolean(asset && typeof asset === "object" && "blob" in asset)));
      if (saved) { setTeamBusiness(saved.business); setTeamIndustry(saved.industry || "其他本地商家"); setTeamLocation(saved.location); }
      setHydrated(true);
    });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    void saveTeamWorkspace({ posts, assets, business: teamBusiness, industry: teamIndustry, location: teamLocation }).catch(() => setTeamProfileError("本机保存失败，请检查浏览器存储空间。"));
  }, [hydrated, posts, assets, teamBusiness, teamIndustry, teamLocation]);

  const pending = posts.filter((post) => post.status === "待审核");
  const approved = posts.filter((post) => post.status === "已批准");
  const published = posts.filter((post) => post.status === "已发布");
  const tabs = ["总览", "内容制作", "素材库", "内容日历", "审核队列"];

  async function postReferenceImage(assetIds: string[] = []) { const asset = assets.find((item) => assetIds.includes(item.id) && item.type.startsWith("image/")); return asset ? fileAsDataUrl(asset.blob) : undefined; }
  function updateStatus(id: string, status: TeamPost["status"]) { setPosts((current) => current.map((post) => post.id === id ? { ...post, status } : post)); }
  function moveTeamPost(id: string, newDate: string) { setPosts((current) => current.map((post) => post.id === id ? { ...post, date: newDate, status: post.status === "已发布" ? post.status : "草稿" } : post)); }
  async function replaceTeamPost(id: string) {
    const old = posts.find((post) => post.id === id); if (!old || !teamBusiness.trim() || !teamLocation.trim()) { setTeamProfileError("请先填写品牌名称和服务地区，再使用 AI 生成新方案或图片。"); setTab("内容日历"); return; }
    setTeamBusyId(id);
    try { const response = await fetch("/api/marketing-calendar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ industry: teamIndustry, businessName: teamBusiness, location: teamLocation, goal: "增加到店客流", platforms: [old.channel], dates: [{ date: old.date, platform: old.channel }], replace: { headline: old.title, objective: old.objective || "门店营销内容", copy: old.copy, callToAction: old.callToAction || "欢迎到店或私信咨询", visualDirection: old.visualDirection || "使用门店真实照片" }, avoid: posts.filter((post) => post.id !== id).map((post) => post.title) }) }); const result = await response.json(); if (!response.ok || !result.posts?.[0]) throw new Error(); const fresh = result.posts[0]; const generatedImage = await generatePostImage({ industry: teamIndustry, platform: old.channel, headline: fresh.headline, objective: fresh.objective, visualDirection: fresh.visualDirection, imageDataUrl: await postReferenceImage(old.assetIds), cacheBust: crypto.randomUUID() }); setPosts((current) => current.map((post) => post.id === id ? { ...post, title: fresh.headline, copy: fresh.copy, objective: fresh.objective, callToAction: fresh.callToAction, visualDirection: fresh.visualDirection, ...generatedImage, imageStatus: "ready", status: "待审核" } : post)); }
    catch { alert("暂时无法生成新方案，请检查业务资料和模型配置。"); } finally { setTeamBusyId(null); }
  }
  async function generateTeamImage(id: string) {
    const post = posts.find((item) => item.id === id); if (!post) return; setTeamBusyId(id);
    try { const result = await generatePostImage({ industry: teamIndustry, platform: post.channel, headline: post.title, objective: post.objective || "门店营销内容", visualDirection: post.visualDirection || "真实自然的本地商家场景摄影", imageDataUrl: await postReferenceImage(post.assetIds), cacheBust: crypto.randomUUID() }); setPosts((current) => current.map((item) => item.id === id ? { ...item, ...result, imageStatus: "ready" } : item)); }
    catch (error) { alert(imageGenerationError(error instanceof Error ? error.message : "generation_failed")); } finally { setTeamBusyId(null); }
  }
  async function createPost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) return;
    if (!teamBusiness.trim() || !teamLocation.trim()) { setTeamProfileError("请先填写品牌名称和服务地区，再保存内容并生成配图。"); setTab("内容制作"); return; }
    setTeamSaving(true); setTeamProfileError("");
    const objective = aiDraft?.objective || "通过这条社媒广告促成顾客到店、预约或咨询";
    const visualDirection = aiDraft?.visualDirection || "围绕主题和真实门店场景设计一张有明确主体、商业摄影质感和干净文字留白的广告图";
    let image = aiDraft?.imageUrl ? { imageUrl: aiDraft.imageUrl, imageProvider: aiDraft.imageProvider } : undefined;
    let imageFailed = false; let imageFailureReason = "generation_failed";
    if (!image) { try { image = await generatePostImage({ industry: teamIndustry, platform: channel, headline: title.trim(), objective, visualDirection, imageDataUrl: await postReferenceImage(selectedAssetIds) }); } catch (error) { imageFailed = true; imageFailureReason = error instanceof Error ? error.message : "generation_failed"; } }
    setPosts((current) => [{ id: crypto.randomUUID(), date, channel, title: title.trim(), copy: caption.trim(), visualDirection, objective, callToAction: aiDraft?.callToAction || "欢迎到店、预约或私信咨询", ...image, imageStatus: image ? "ready" : imageFailed ? "failed" : undefined, status: "草稿", assetIds: selectedAssetIds }, ...current]);
    setTitle(""); setCaption(""); setSelectedAssetIds([]); setAiDraft(null); setShowCreate(false); setTab("内容日历");
    if (imageFailed) setTeamProfileError(`文案已保存，配图未生成：${imageGenerationError(imageFailureReason)}`);
    setTeamSaving(false);
  }
  async function draftTeamPost() {
    if (!title.trim() || !teamBusiness.trim() || !teamLocation.trim()) { setTeamProfileError("请先填写内容主题、品牌名称和服务地区。"); return; }
    setAiDraftLoading(true); setTeamProfileError("");
    try { const response = await fetch("/api/marketing-calendar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ industry: teamIndustry, businessName: teamBusiness, location: teamLocation, goal: "增加到店客流", platforms: [channel], dates: [{ date, platform: channel }], replace: { headline: title, objective: "根据团队提供的营销主题写一条能促成到店或咨询的社媒广告", copy: caption, callToAction: "引导顾客到店或私信咨询", visualDirection: "适合本地门店投放的高冲击广告构图" } }) }); const result = await response.json(); const fresh = result.posts?.[0]; if (!response.ok || !fresh) throw new Error(); setTitle(fresh.headline); setCaption(fresh.copy); const generatedImage = await generatePostImage({ industry: teamIndustry, platform: channel, headline: fresh.headline, objective: fresh.objective, visualDirection: fresh.visualDirection, imageDataUrl: await postReferenceImage(selectedAssetIds) }); setAiDraft({ objective: fresh.objective, callToAction: fresh.callToAction, visualDirection: fresh.visualDirection, ...generatedImage }); }
    catch { setTeamProfileError("AI 起草失败，请检查本地 Codex CLI 登录状态或线上 OpenAI 配置。"); } finally { setAiDraftLoading(false); }
  }
  function addAssets(files: FileList | null) {
    if (!files) return;
    const selected = Array.from(files).filter((file) => file.type.startsWith("image/") || file.type.startsWith("video/"));
    const capacity = 50 - assets.length;
    const additions = selected.slice(0, capacity).map((file) => ({ id: crypto.randomUUID(), name: file.name, type: file.type, size: file.size, description: assetNote, createdAt: new Date().toISOString(), blob: file }));
    setAssets((current) => [...additions, ...current]);
    setAssetError(selected.length > capacity ? "素材库最多保留 50 个文件，超出部分未添加。" : selected.length < files.length ? "仅支持图片和视频文件。" : "");
  }
  const calendarItems: MarketingCalendarItem[] = posts.map((post) => ({ id: post.id, date: post.date, platform: post.channel, headline: post.title, objective: post.objective || "团队营销内容", copy: post.copy, callToAction: post.callToAction || "欢迎到店或私信咨询", visualDirection: post.visualDirection || "使用门店真实素材", imageDataUrl: post.imageDataUrl, imageUrl: post.imageUrl, imageStatus: post.imageStatus, status: post.status === "已发布" ? "已发布" : post.status === "已批准" ? "待发布" : post.status }));
  const countsByStatus = `${posts.length} 条内容 · ${assets.length} 个素材`;

  return <WorkspaceFrame audience="team"><div className="ps-workspace-main ps-team-main">
    <div className="ps-team-topline"><div><span className="ps-workspace-kicker">营销团队工作台</span><h1>团队内容运营</h1><p>制作内容、整理素材、安排排期，再通过审核后进入发布准备。</p></div><button className="ps-workspace-primary" onClick={() => { setShowCreate(true); setTab("内容制作"); }}><Plus size={16} />新建内容</button></div>
    <nav className="ps-team-tabs">{tabs.map((item) => <button key={item} className={tab === item ? "is-active" : ""} onClick={() => setTab(item)}>{item}{item === "审核队列" && pending.length > 0 && <i>{pending.length}</i>}</button>)}</nav>
    {teamProfileError && <p className="ps-workspace-error" role="alert">{teamProfileError}</p>}
    <div className="ps-team-stats"><article><span>待审核</span><strong>{pending.length}</strong><small>审核通过后进入待发布</small></article><article><span>已批准</span><strong>{approved.length}</strong><small>已审核，可安排执行</small></article><article><span>已发布</span><strong>{published.length}</strong><small>当前为团队手动记录状态</small></article><button onClick={() => { const rows = ["日期,渠道,主题,文案,状态", ...posts.map((post) => [post.date, post.channel, post.title, post.copy, post.status].map((value) => `"${value.replaceAll('"', '""')}"`).join(","))]; const url = URL.createObjectURL(new Blob(["\ufeff" + rows.join("\n")], { type: "text/csv;charset=utf-8" })); const link = document.createElement("a"); link.href = url; link.download = "团队内容排期.csv"; link.click(); URL.revokeObjectURL(url); }}><Download size={16} />导出内容</button></div>
    {showCreate && tab === "内容制作" && <form className="ps-workspace-card ps-team-create" onSubmit={createPost}><div className="ps-workspace-card-title"><div><h2>制作一条营销内容</h2><p>保存后进入草稿，可从日历提交团队审核。</p></div><button type="button" onClick={() => setShowCreate(false)} aria-label="关闭"><X size={18} /></button></div><div className="ps-workspace-fields"><Field label="内容主题" required><input required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="例如：周末寿司套餐预订" /></Field><Field label="计划日期" required><input required type="date" value={date} onChange={(event) => setDate(event.target.value)} /></Field><Field label="发布渠道" required><select value={channel} onChange={(event) => setChannel(event.target.value)}>{CHANNELS.map((item) => <option key={item}>{item}</option>)}</select></Field><Field label="文案内容" wide required><textarea required rows={5} value={caption} onChange={(event) => setCaption(event.target.value)} placeholder="写下广告文案，或先填写主题再让 AI 起草" /></Field><Field label="关联素材" wide><div className="ps-team-asset-picker">{assets.length ? assets.map((asset) => <label key={asset.id}><input type="checkbox" checked={selectedAssetIds.includes(asset.id)} onChange={(event) => setSelectedAssetIds((current) => event.target.checked ? [...current, asset.id] : current.filter((id) => id !== asset.id))} />{asset.name}</label>) : <span>还没有素材，请先在“素材库”上传。</span>}</div></Field></div><div className="ps-workspace-actions"><button className="ps-workspace-quiet-button" type="button" disabled={aiDraftLoading || teamSaving} onClick={draftTeamPost}>{aiDraftLoading ? "AI 正在起草…" : "AI 起草文案并生成配图"}</button><button className="ps-workspace-primary" type="submit" disabled={teamSaving}>{teamSaving ? "正在生成配图并保存…" : "保存草稿"} <ArrowRight size={15} /></button></div></form>}
    {tab === "总览" && <section className="ps-team-columns"><article className="ps-workspace-card"><h2>工作流程</h2><p className="ps-workspace-help">{countsByStatus}。所有记录保存在当前浏览器，登录/共享协作尚未启用。</p><ol className="ps-team-flow"><li><b>01</b><span><strong>内容制作与素材库</strong><small>撰写渠道文案，上传并整理图片、视频。</small></span><button onClick={() => { setTab("内容制作"); setShowCreate(true); }}>开始制作</button></li><li><b>02</b><span><strong>内容日历</strong><small>拖动草稿到合适日期，提交审核。</small></span><button onClick={() => setTab("内容日历")}>打开日历</button></li><li><b>03</b><span><strong>审核队列</strong><small>逐条核对事实、优惠、配图与文案。</small></span><button onClick={() => setTab("审核队列")}>查看 {pending.length} 条</button></li><li><b>04</b><span><strong>发布准备</strong><small>审核通过的内容进入待发布状态，供后续安排执行。</small></span><button onClick={() => setTab("内容日历")}>查看已批准内容</button></li></ol></article><article className="ps-workspace-card"><h2>待处理事项</h2><div className="ps-team-review-summary"><span><ClipboardCheck /></span><div><strong>{pending.length} 条等待审核</strong><small>{posts.length ? "确认后标记为已批准；真实自动发布需关联已授权社媒账号。" : "先创建第一条内容，团队队列会从同一内容记录自动更新。"}</small></div></div><button className="ps-workspace-primary" onClick={() => setTab("审核队列")}>进入审核队列 <ArrowRight size={15} /></button></article></section>}
    {tab === "内容制作" && <section className="ps-workspace-card"><div className="ps-workspace-card-title"><div><h2>内容制作台</h2><p>内容制作是市场人员的日常工作入口。</p></div><button className="ps-workspace-inline" onClick={() => setShowCreate(true)}><Plus size={14} />新建内容</button></div><div className="ps-workspace-fields ps-team-profile"><Field label="品牌／门店名称" required><input value={teamBusiness} onChange={(event) => setTeamBusiness(event.target.value)} placeholder="用于生成符合品牌的内容" /></Field><Field label="行业" required><select value={teamIndustry} onChange={(event) => setTeamIndustry(event.target.value)}>{["餐馆", "美甲／美容", "零售店", "健身／健康", "家居服务", "其他本地商家"].map((item) => <option key={item}>{item}</option>)}</select></Field><Field label="服务地区" required><input value={teamLocation} onChange={(event) => setTeamLocation(event.target.value)} placeholder="城市或社区" /></Field></div>{!showCreate && <div className="ps-team-empty"><p>先完善品牌资料，再新建文案并生成配图。</p><button className="ps-workspace-primary" onClick={() => setShowCreate(true)}><Plus size={15} />开始制作</button></div>}</section>}
    {tab === "素材库" && <section className="ps-workspace-card"><div className="ps-workspace-card-title"><div><h2>素材库</h2><p>素材保存在这台设备的浏览器中；可用于后续内容制作。</p></div><span className="ps-workspace-pill">{assets.length}/50</span></div><Field label="素材说明（可选）" wide><textarea rows={2} value={assetNote} onChange={(event) => setAssetNote(event.target.value)} placeholder="例如：冬季新品、可公开使用、不可展示顾客正脸" /></Field><label className="ps-workspace-drop ps-team-drop"><input type="file" multiple accept="image/*,video/*" onChange={(event) => { addAssets(event.target.files); event.currentTarget.value = ""; }} /><ImagePlus size={24} /><strong>上传图片或视频素材</strong><span>最多 50 个文件，刷新页面后仍保留</span><em>选择文件</em></label>{assetError && <p className="ps-workspace-error">{assetError}</p>}<div className="ps-team-assets">{assets.map((asset) => <article key={asset.id}>{asset.type.startsWith("image/") ? <TeamAssetPreview asset={asset} /> : <div className="ps-team-video-asset"><FileVideo /><span>视频</span></div>}<div><strong>{asset.name}</strong><small>{(asset.size / 1024 / 1024).toFixed(1)} MB · {asset.description || "未添加说明"}</small></div><button aria-label={`删除 ${asset.name}`} onClick={() => setAssets((current) => current.filter((item) => item.id !== asset.id))}><X size={16} /></button></article>)}</div>{!assets.length && <div className="ps-team-empty"><p>这里会集中展示可复用的门店照片、商品图片、视频和活动素材。</p></div>}</section>}
    {tab === "内容日历" && <section className="ps-workspace-card"><div className="ps-workspace-card-title"><div><h2>内容日历</h2><p>拖动草稿卡片可改期；确认后再提交审核。</p></div><button className="ps-workspace-inline" onClick={() => { setShowCreate(true); setTab("内容制作"); }}><Plus size={14} />新建内容</button></div><MarketingCalendar items={calendarItems} onMove={moveTeamPost} onReplace={replaceTeamPost} onGenerateImage={generateTeamImage} onApprove={(id) => updateStatus(id, "待审核")} busyId={teamBusyId} /></section>}
    {tab === "审核队列" && <section className="ps-workspace-card"><div className="ps-workspace-card-title"><div><h2>审核队列</h2><p>团队在发布前确认文案、事实、优惠条件和素材授权。</p></div><span className="ps-workspace-pill">{pending.length} 条待审</span></div>{pending.length ? <div className="ps-team-post-list">{pending.map((post) => <TeamPostRow key={post.id} post={post} onStatus={updateStatus} />)}</div> : <div className="ps-team-empty"><p>没有待审内容。到内容日历中将草稿提交审核。</p><button className="ps-workspace-quiet-button" onClick={() => setTab("内容日历")}>查看内容日历</button></div>}</section>}
  </div></WorkspaceFrame>;
}

function TeamAssetPreview({ asset }: { asset: TeamAsset }) {
  const imageRef = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const url = URL.createObjectURL(asset.blob);
    if (imageRef.current) imageRef.current.src = url;
    return () => URL.revokeObjectURL(url);
  }, [asset]);
  return <img ref={imageRef} alt={asset.name} />;
}

function TeamPostRow({ post, onStatus }: { post: TeamPost; onStatus: (id: string, status: TeamPost["status"]) => void }) {
  return <article className="ps-team-row"><div className="ps-team-row-date">{post.date.slice(5).replace("-", "/")}</div><div className="ps-team-channel">{post.channel}</div><div className="ps-team-row-copy"><strong>{post.title}</strong><p>{post.copy}</p></div><span className={`ps-team-status status-${post.status === "待审核" ? "review" : post.status === "草稿" ? "draft" : post.status === "已批准" ? "approved" : "published"}`}>{post.status}</span><div className="ps-team-row-actions">{post.status === "待审核" && <><button onClick={() => onStatus(post.id, "已批准")}>审核通过</button><button onClick={() => onStatus(post.id, "草稿")}>退回修改</button></>}{post.status === "已批准" && <button onClick={() => onStatus(post.id, "已发布")}>记录已发布</button>}{post.status === "已发布" && <button onClick={() => onStatus(post.id, "待审核")}>重新审核</button>}</div></article>;
}

type ManagedBrief = { business: string; type: string; location: string; audience: string; offering: string; goal: string; offer: string; start: string; end: string; channels: string[]; notes: string };
const initialManagedBrief: ManagedBrief = { business: "", type: "餐馆", location: "", audience: "", offering: "", goal: "增加到店客流", offer: "", start: new Date().toISOString().slice(0,10), end: new Date(Date.now()+29*86400000).toISOString().slice(0,10), channels: ["Instagram", "Facebook"], notes: "" };

function ManagedWorkspace() {
  const [step, setStep] = useState(0);
  const [brief, setBrief] = useState<ManagedBrief>(initialManagedBrief);
  const [approved, setApproved] = useState(false);
  const [requestVisible, setRequestVisible] = useState(false);
  const [plan, setPlan] = useState<MarketingCalendarItem[] | null>(null);
  const [calendarRestored, setCalendarRestored] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [planError, setPlanError] = useState("");
  function update<K extends keyof ManagedBrief>(key: K, value: ManagedBrief[K]) { setBrief((current) => ({ ...current, [key]: value })); }
  useEffect(() => {
    queueMicrotask(() => {
      try { const saved = localStorage.getItem("postory-managed-calendar-v1"); if (saved) { const data = JSON.parse(saved) as { brief?: ManagedBrief; plan?: MarketingCalendarItem[]; approved?: boolean }; if (data.brief) setBrief({ ...initialManagedBrief, ...data.brief }); if (Array.isArray(data.plan) && data.plan.length) { setPlan(data.plan.map((item) => ({ ...item, imageDataUrl: undefined, imageStatus: item.imageUrl ? "ready" : "failed" }))); setStep(2); } setApproved(!!data.approved); } }
      catch { localStorage.removeItem("postory-managed-calendar-v1"); } finally { setCalendarRestored(true); }
    });
  }, []);
  useEffect(() => { if (!calendarRestored) return; try { if (!plan) { localStorage.removeItem("postory-managed-calendar-v1"); return; } const savedPlan = plan.map((item) => { const copy = { ...item }; delete copy.imageDataUrl; return copy; }); localStorage.setItem("postory-managed-calendar-v1", JSON.stringify({ brief, approved, plan: savedPlan })); } catch { /* Preserve current editing even when browser storage is full. */ } }, [approved, brief, calendarRestored, plan]);
  async function createManagedPlan() {
    if (planLoading) return;
    setPlanLoading(true); setPlanError("");
    try {
      const start = new Date(`${brief.start}T12:00:00`); const total = Math.floor((Date.parse(`${brief.end}T00:00:00Z`) - Date.parse(`${brief.start}T00:00:00Z`)) / 86400000) + 1;
      if (!Number.isFinite(total) || total < 1 || !brief.channels.length) throw new Error();
      const count = total < 15 ? total : 20;
      const dates = Array.from({ length: count }, (_, index) => { const day = new Date(start); day.setDate(start.getDate() + (total < 15 ? index : Math.round((total - 1) * index / (count - 1)))); return { date: dateKey(day), platform: brief.channels[index % brief.channels.length] }; });
      const response = await fetch("/api/marketing-calendar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ industry: brief.type, businessName: brief.business, location: brief.location, audience: brief.audience, goal: brief.goal, offer: brief.offer, notes: brief.notes, products: [{ name: brief.offering, price: "", promotionalPrice: "", facts: "" }], platforms: brief.channels, dates }) });
      const result = await response.json(); if (!response.ok || !result.posts) throw new Error(result.reason || "generation_failed");
      const created: MarketingCalendarItem[] = result.posts.map((post: Omit<MarketingCalendarItem, "id" | "status" | "imageStatus">) => ({ ...post, id: crypto.randomUUID(), status: "待审核", imageStatus: "generating" }));
      setPlan(created);
      const generateItemImage = async (item: MarketingCalendarItem) => {
        try { const image = await generatePostImage({ industry: brief.type, platform: item.platform, headline: item.headline, objective: item.objective, visualDirection: item.visualDirection }); setPlan((items) => items?.map((current) => current.id === item.id ? { ...current, ...image, imageStatus: "ready" } : current) ?? null); }
        catch { setPlan((items) => items?.map((current) => current.id === item.id ? { ...current, imageStatus: "failed" } : current) ?? null); }
      };
      setPlanLoading(false);
      await Promise.all(created.slice(0, 3).map(generateItemImage));
      void (async () => { for (let index = 3; index < created.length; index += 2) await Promise.all(created.slice(index, index + 2).map(generateItemImage)); })();
    } catch (error) { setPlanError(marketingGenerationError(error instanceof Error ? error.message : "generation_failed")); }
    finally { setPlanLoading(false); }
  }
  function moveManagedPost(id: string, date: string) { setPlan((items) => items?.map((item) => item.id === id ? { ...item, date } : item) ?? null); }
  function approveManagedPost(id: string) { setPlan((items) => items?.map((item) => item.id === id ? { ...item, status: "待发布" } : item) ?? null); }
  async function replaceManagedPost(id: string) {
    const old = plan?.find((item) => item.id === id); if (!plan || !old) return; setBusyId(id);
    try { const response = await fetch("/api/marketing-calendar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ industry: brief.type, businessName: brief.business, location: brief.location, audience: brief.audience, goal: brief.goal, offer: brief.offer, notes: brief.notes, products: [{ name: brief.offering, price: "", promotionalPrice: "", facts: "" }], platforms: [old.platform], dates: [{ date: old.date, platform: old.platform }], replace: { headline: old.headline, objective: old.objective, copy: old.copy, callToAction: old.callToAction, visualDirection: old.visualDirection }, avoid: plan.filter((item) => item.id !== id).map((item) => item.headline) }) }); const result = await response.json(); const fresh = result.posts?.[0]; if (!response.ok || !fresh) throw new Error(result.reason || "generation_failed"); const revised = { ...old, ...fresh, imageDataUrl: undefined, imageUrl: undefined, status: "待审核" as const, imageStatus: "generating" as const }; setPlan((items) => items?.map((item) => item.id === id ? revised : item) ?? null); const image = await generatePostImage({ industry: brief.type, platform: revised.platform, headline: revised.headline, objective: revised.objective, visualDirection: revised.visualDirection, cacheBust: crypto.randomUUID() }); setPlan((items) => items?.map((item) => item.id === id ? { ...item, ...image, imageStatus: "ready" } : item) ?? null); }
    catch (error) { setPlanError(`换方案或配图失败：${imageGenerationError(error instanceof Error ? error.message : "generation_failed")}`); setPlan((items) => items?.map((item) => item.id === id ? { ...item, imageStatus: item.imageDataUrl ? "ready" : "failed" } : item) ?? null); } finally { setBusyId(null); }
  }
  async function generateManagedImage(id: string) { const item = plan?.find((post) => post.id === id); if (!item) return; setBusyId(id); setPlan((items) => items?.map((post) => post.id === id ? { ...post, imageStatus: "generating" } : post) ?? null); try { const image = await generatePostImage({ industry: brief.type, platform: item.platform, headline: item.headline, objective: item.objective, visualDirection: item.visualDirection, cacheBust: crypto.randomUUID() }); setPlan((items) => items?.map((post) => post.id === id ? { ...post, ...image, imageStatus: "ready" } : post) ?? null); } catch (error) { setPlanError(imageGenerationError(error instanceof Error ? error.message : "generation_failed")); setPlan((items) => items?.map((post) => post.id === id ? { ...post, imageStatus: "failed" } : post) ?? null); } finally { setBusyId(null); } }
  function toggleChannel(channel: string) { update("channels", brief.channels.includes(channel) ? brief.channels.filter((item) => item !== channel) : [...brief.channels, channel]); }
  const details = [`套餐入口：${OFFER_NAME.managed}`, `业务：${brief.business}`, `行业：${brief.type}`, `地区：${brief.location}`, `目标顾客：${brief.audience}`, `商品／服务：${brief.offering}`, `本月目标：${brief.goal}`, `活动优惠：${brief.offer}`, `周期：${brief.start} - ${brief.end}`, `渠道：${brief.channels.join("、")}`, `注意事项：${brief.notes}`, `营销日历：${plan?.map((post) => `${post.date} ${post.platform} ${post.headline}【${post.status}】\n${post.copy.slice(0, 220)}`).join("\n\n") ?? "尚未生成"}`].join("\n").slice(0, 10_000);
  return <WorkspaceFrame audience="managed"><div className="ps-workspace-main">
    <WorkspaceHeading eyebrow="PoStory 营销代运营 · 客户工作台" title="从业务简报开始，逐步确认每月交付" description="先告诉我们业务重点，再审核营销计划和内容。未经你确认的价格、优惠和商品事实不会直接发布。" />
    <Stepper current={step} steps={["业务简报", "本月重点", "日历审核"]} />
    {step === 0 && <section className="ps-workspace-card"><h2>01 · 业务简报</h2><p className="ps-workspace-help">填写团队需要掌握的基本事实。可以标明尚未确认的内容。</p><div className="ps-workspace-fields"><Field label="门店／品牌名称" required><input required value={brief.business} onChange={(event) => update("business", event.target.value)} placeholder="填写对外使用的名称" /></Field><Field label="行业" required><select value={brief.type} onChange={(event) => update("type", event.target.value)}>{["餐馆", "美甲／美容", "零售店", "健身／健康", "家居服务", "其他本地商家"].map((item) => <option key={item}>{item}</option>)}</select></Field><Field label="服务地区" required><input required value={brief.location} onChange={(event) => update("location", event.target.value)} placeholder="城市或社区" /></Field><Field label="主要顾客"><input value={brief.audience} onChange={(event) => update("audience", event.target.value)} placeholder="例如：附近上班族、家庭顾客" /></Field><Field label="主推商品／服务" required><input required value={brief.offering} onChange={(event) => update("offering", event.target.value)} placeholder="填写本月希望推广的内容" /></Field></div><div className="ps-workspace-actions"><button className="ps-workspace-primary" disabled={!brief.business.trim() || !brief.location.trim()} onClick={() => setStep(1)}>继续 <ArrowRight size={15} /></button></div></section>}
    {step === 1 && <section className="ps-workspace-card"><h2>02 · 本月营销重点</h2><p className="ps-workspace-help">确认本月的业务目标、活动信息和渠道偏好，PoStory 才能据此准备计划。</p><div className="ps-workspace-fields"><Field label="本月目标" required><select value={brief.goal} onChange={(event) => update("goal", event.target.value)}>{["增加到店客流", "增加预约／订位", "推广新品或服务", "提高本地知名度", "宣传促销活动"].map((item) => <option key={item}>{item}</option>)}</select></Field><Field label="活动或优惠（选填）"><input value={brief.offer} onChange={(event) => update("offer", event.target.value)} placeholder="优惠内容和有效期；未确定可留空" /></Field><Field label="开始日期" required><input required type="date" value={brief.start} onChange={(event) => update("start", event.target.value)} /></Field><Field label="结束日期" required><input required type="date" value={brief.end} onChange={(event) => update("end", event.target.value)} /></Field><Field label="发布渠道" wide required><div className="ps-workspace-channels">{CHANNELS.map((channel) => <button type="button" key={channel} className={brief.channels.includes(channel) ? "is-selected" : ""} onClick={() => toggleChannel(channel)}><span>{brief.channels.includes(channel) && <Check size={12} />}</span>{channel}</button>)}</div></Field><Field label="品牌要求与需确认事项" wide><textarea rows={4} value={brief.notes} onChange={(event) => update("notes", event.target.value)} placeholder="品牌语气、禁用说法、需要老板最终确认的价格或条款" /></Field></div><div className="ps-workspace-actions"><button className="ps-workspace-quiet-button" onClick={() => setStep(0)}>上一步</button><button className="ps-workspace-primary" disabled={!brief.channels.length || !brief.start || !brief.end} onClick={() => { setApproved(false); setStep(2); }}>打开营销日历 <ArrowRight size={15} /></button></div></section>}
    {step === 2 && <>{!plan ? <section className="ps-workspace-card"><span className="ps-workspace-kicker">{brief.business} · {brief.start} — {brief.end}</span><h2>先生成营销计划，再逐条审核</h2><p className="ps-workspace-help">根据你填写的行业、产品服务、目标地区和平台生成可发布文案与配图。少于 15 天每天安排 1 条，15 天及以上安排 20 条。</p>{planError && <p className="ps-workspace-error" role="alert">{planError}</p>}<div className="ps-workspace-actions"><button className="ps-workspace-quiet-button" disabled={planLoading} onClick={() => setStep(1)}>返回修改</button><button className="ps-workspace-primary" disabled={planLoading} onClick={createManagedPlan}>{planLoading ? "正在生成文案和配图…" : "生成营销计划草稿"} <Sparkles size={15} /></button></div></section> : <><section className="ps-workspace-plan-head"><div><span className="ps-workspace-kicker">{brief.business} · {brief.start} — {brief.end}</span><h2>本月营销日历</h2><p>日历和文案先展示，近期 3 条优先生成配图，其余配图后台继续完成；已生成图片会保存并可直接复用。拖动卡片左上把手可改期，逐条确认后进入待发布队列。</p></div></section>{planError && <p className="ps-workspace-error" role="alert">{planError}</p>}<MarketingCalendar items={plan} onMove={moveManagedPost} onApprove={approveManagedPost} busyId={busyId} onReplace={replaceManagedPost} onGenerateImage={generateManagedImage} /><section className="ps-workspace-card"><div className="ps-workspace-confirm"><label><input type="checkbox" checked={approved} onChange={(event) => setApproved(event.target.checked)} /><span>我已审核日历内容、价格和优惠事实；批准的内容进入待发布队列。</span></label></div><div className="ps-workspace-actions"><button className="ps-workspace-quiet-button" onClick={() => {setPlan(null);setStep(1);}}>返回修改</button><button className="ps-workspace-primary" disabled={!approved} onClick={() => setRequestVisible(true)}>提交代运营申请 <Send size={15} /></button></div></section></>}</>}{requestVisible && <section className="ps-workspace-request-card"><div className="ps-workspace-card-title"><div><h2>提交代运营申请</h2><p>简报与审核后的营销日历将随申请提交。</p></div><button onClick={() => setRequestVisible(false)} aria-label="关闭"><X size={18} /></button></div><AssessmentForm offer="managed" initial={{ shopName: brief.business, location: brief.location, businessType: businessTypeValue(brief.type), goal: marketingGoalValue(brief.goal), details }} /></section>}
  </div></WorkspaceFrame>;
}

export function AudienceWorkspace({ audience }: { audience: Audience }) {
  if (audience === "store") return <StoreWorkspace />;
  if (audience === "team") return <TeamWorkspace />;
  return <ManagedWorkspace />;
}
