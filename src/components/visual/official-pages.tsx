import Link from "next/link";
import { ArrowRight, Check, Mail, MapPin } from "lucide-react";
import type { ReactNode } from "react";
import { PublicFrame } from "./public-pages";
import { Photo, SectionTitle } from "./primitives";

const samples = [
  { industry: "Nail studios", image: "work-beauty", items: ["Finished set", "Review graphic layout", "Seasonal offer", "Booking reminder"], images: ["/demo/fidelity/nails-template-0.webp", "review", "offer", "/demo/fidelity/nails-template-3.webp"] },
  { industry: "Restaurants", image: "work-restaurant", items: ["Featured dish", "Review graphic", "Special offer", "Reserve a table"] },
  { industry: "Home services", image: "work-contractor", items: ["Project reveal", "Review graphic", "Seasonal service", "Request a quote"] },
];

function Action({ href = "/apply?type=shop", children = "Apply for an experience" }: { href?: string; children?: ReactNode }) {
  return <Link className="ps-button" href={href}>{children}<ArrowRight size={16} /></Link>;
}

export function OfficialHomePage({ chinese = false }: { chinese?: boolean }) {
  return <PublicFrame className="ps-official">
    <section className="po-hero">
      <div><span className="ps-kicker">{chinese ? "多伦多 · 服务 GTA 实体店" : "TORONTO · SERVING GTA LOCAL SHOPS"}</span><h1>{chinese ? <>让你的店<br/><em>每天都被看见。</em></> : <>We keep your shop<br/>showing up <em>every day.</em></>}</h1><p>{chinese ? "每月 30 条社媒内容，设计、文案和发布由我们负责。你发布前看一眼确认即可。" : "Thirty social posts a month, designed, written and published for your business. You review the content; we handle the steady work."}</p><div className="po-actions"><Action href={chinese?"/zh/apply?type=shop":"/apply?type=shop"}>{chinese ? "申请体验" : "Apply for an experience"}</Action><Link className="ps-text-link" href="/samples">{chinese ? "查看设计样例" : "See design samples"} <ArrowRight size={15}/></Link></div><small>Eric · Postory, Toronto</small></div>
      <div className="po-hero-art"><Photo src="/demo/fidelity/nails-template-0.webp" alt="Nail studio social media design sample"/><div><b>30</b><span>posts, planned<br/>for the month</span></div></div>
    </section>
    <section className="po-proof"><span>DESIGN SAMPLES</span><p>See complete sets made for local business categories.</p><Link href="/samples">Browse the samples <ArrowRight size={15}/></Link></section>
    <SamplesGrid compact/>
    <section className="po-two-col"><div><span className="ps-kicker">MADE FOR BUSY OWNERS</span><h2>Posting shouldn’t become another shift.</h2><p>When posts disappear after a day or two, one post a week leaves long gaps. We prepare a steady month of useful, on-brand content so your shop keeps appearing in customers’ feeds.</p><Action/></div><ul>{["Design and captions", "Monthly content planning", "Publishing to agreed social accounts", "You review before posts go out"].map(x=><li key={x}><Check/>{x}</li>)}</ul></section>
    <section className="po-paths"><Link href="/for-shops"><span>FOR SHOP OWNERS</span><h2>Need consistent posts for your shop?</h2><p>See what’s included and how to get started.</p><b>Explore the shop service <ArrowRight size={15}/></b></Link><Link href="/for-partners"><span>FOR AGENCIES & RESELLERS</span><h2>Have local business clients?</h2><p>We can produce the content under your brand.</p><b>Explore partner delivery <ArrowRight size={15}/></b></Link></section>
    <section className="po-local"><MapPin/><p>Small Toronto team. Local-shop focus. GTA service area.</p><a href="mailto:eric@postory.ca">eric@postory.ca</a></section>
  </PublicFrame>;
}

export function SamplesGrid({ compact = false }: { compact?: boolean }) {
  return <section className={`po-samples ${compact ? "po-samples-compact" : ""}`}>
    {!compact && <SectionTitle tag="SAMPLE WORK" title="Design samples for local shops" body="These are design samples, not client case studies. Each set shows how different post types can work together across a month."/>}
    <div className="po-sample-grid">{samples.map((s, i)=><article key={s.industry}><div className="po-sample-heading"><div><span>DESIGN SAMPLE</span><h2>{s.industry}</h2></div><span>SET {i+1}</span></div><div className="po-sample-images">{s.items.map((label, j)=>{ const image = s.images?.[j]; return <figure key={label}>{image === "review" ? <div className="po-sample-card po-review-card"><span>REVIEW POST FORMAT</span><b>Place an approved<br/>customer review here</b><small>Only published with permission</small></div> : image === "offer" ? <div className="po-sample-card po-offer-card"><span>SEASONAL OFFER</span><b>A fresh set<br/>for a new season</b><small>Message the studio to book</small></div> : <Photo src={image?.startsWith("/") ? image : undefined} name={image?.startsWith("/") ? undefined : `${s.image}-${j+1}`} alt={`${s.industry} ${label.toLowerCase()} design sample`}/>}<figcaption>{label}</figcaption></figure>})}</div><p>Illustrative industry work. No client name or performance claim is implied.</p></article>)}</div>
  </section>;
}

export function SamplesPage() { return <PublicFrame className="ps-official"><section className="po-page-head"><span className="ps-kicker">THE WORK, UP FRONT</span><h1>Design samples made<br/>for local businesses.</h1><p>Browse complete sets by industry: post designs, review graphics, offers and booking prompts. These are design samples, not client case studies.</p></section><SamplesGrid/><section className="po-end-cta"><h2>Want to see what this could look like for your shop?</h2><Action/></section></PublicFrame>; }

export function ShopPage({ chinese = false }: { chinese?: boolean }) {
  return <PublicFrame className="ps-official"><section className="po-page-head"><span className="ps-kicker">{chinese ? "给 GTA 实体店主" : "FOR LOCAL SHOP OWNERS · GTA"}</span><h1>{chinese ? <>把每天发帖<br/>从你身上拿走。</> : <>Your shop keeps showing up.<br/><em>You get your time back.</em></>}</h1><p>{chinese ? "每月 30 条社媒内容，设计、文案和发布由我们负责。你发布前看一眼确认即可。" : "Thirty social posts each month. We design them, write the captions and publish them. You review the posts before they go out."}</p><Action href={chinese?"/zh/apply?type=shop":"/apply?type=shop"}>{chinese ? "申请体验" : "Apply for an experience"}</Action></section>
    <section className="po-two-col"><div><span className="ps-kicker">WHAT WE HANDLE</span><h2>One steady content service.</h2><p>We plan, create and publish recurring content for your shop. The goal is consistent visibility through regular posting, not a promise of a particular number of views or sales.</p></div><ul>{["30 social posts each month", "Branded designs and captions", "Content scheduled and published", "Review before publishing", "No ad buying or on-site photo shoots"].map(x=><li key={x}><Check/>{x}</li>)}</ul></section>
    <section className="po-two-col po-tint"><div><span className="ps-kicker">GETTING STARTED</span><h2>A clear first step, then a personal quote.</h2><p>Apply with your shop details. We’ll prepare a sample in your style, arrange a short call to confirm the direction, then send a tailored quote directly to you.</p><Action href={chinese?"/zh/apply?type=shop":"/apply?type=shop"}/></div><Photo name="beauty-hero" alt="Beauty studio design inspiration"/></section>
    <SamplesGrid compact/><section className="po-note"><h2>What we need from you</h2><p>Basic details about your shop and any existing photos or social pages you have. You don’t need a photo shoot to get started.</p><Link href="/how-it-works">See the full monthly workflow <ArrowRight size={15}/></Link></section>
  </PublicFrame>;
}

export function PartnerPage() {
  return <PublicFrame className="ps-official"><section className="po-page-head"><span className="ps-kicker">WHITE-LABEL DELIVERY</span><h1>You own the client relationship.<br/><em>We make the content.</em></h1><p>For independent marketers and agencies serving local businesses. You sell and manage the relationship; PoStory handles recurring content production under your brand.</p><Action href="/apply?type=partner">Book a partner introduction</Action></section><section className="po-two-col"><div><span className="ps-kicker">HOW PARTNER DELIVERY WORKS</span><h2>Your brand in front. Our production behind it.</h2><p>You set your offer and pricing. We prepare the content and support your delivery. Your client remains yours; we don’t contact them directly.</p></div><ul>{["Monthly set of 30 finished posts per shop", "Industry-specific design samples", "White-label production", "Sales and quote materials available"].map(x=><li key={x}><Check/>{x}</li>)}</ul></section><SamplesGrid compact/><section className="po-end-cta"><h2>Let’s see if the delivery model fits your clients.</h2><Action href="/apply?type=partner">Book a partner introduction</Action></section></PublicFrame>;
}

export function ApplyPage({ type = "", submitted = false, deliveryFailed = false, chinese = false }: { type?: string; submitted?: boolean; deliveryFailed?: boolean; chinese?: boolean }) {
  const selected = type === "partner" ? "partner" : type === "shop" ? "shop" : "";
  return <PublicFrame className="ps-official"><section className="po-page-head"><span className="ps-kicker">{chinese ? "联系 Postory" : "GET IN TOUCH"}</span><h1>{submitted ? (chinese ? "收到申请了，谢谢。" : "Thanks. We’ve received your note.") : (chinese ? "告诉我们你需要什么。" : "Tell us what you’re looking for.")}</h1><p>{submitted ? (deliveryFailed ? (chinese ? "申请已保存，但确认邮件暂时未送达。Eric 会亲自跟进；你也可以通过下方邮箱联系。" : "Your application is saved, but the confirmation email could not be delivered. Eric will follow up personally, and you can also reach him using the email below.") : (chinese ? "确认邮件已发送，Eric 会亲自跟进。" : "A confirmation email is on its way. Eric will follow up personally.")) : (chinese ? "请选择适合你的申请方式。店主申请与代理咨询分别处理。" : "Choose the form that matches you. Shop applications and partner inquiries are handled separately.")}</p></section>{!selected ? <div className="po-paths"><Link href={chinese?"/zh/apply?type=shop":"/apply?type=shop"}><span>{chinese?"店主":"FOR SHOP OWNERS"}</span><h2>{chinese?"申请店主体验":"Apply for a shop experience"}</h2><p>{chinese?"适用于本地实体店主。":"For owners of local businesses."}</p></Link><Link href="/apply?type=partner"><span>FOR AGENCIES & RESELLERS</span><h2>Book a partner introduction</h2><p>For people who serve local business clients.</p></Link></div> : submitted ? <div className="po-apply-success"><Check/><h2>{selected === "shop" ? (chinese?"下一步：我们会按你店铺的风格准备设计样例。":"Next: we’ll prepare a shop-style sample.") : "Next: Eric will reach out to arrange an introduction."}</h2><p>Questions in the meantime? <a href="mailto:eric@postory.ca">eric@postory.ca</a></p></div> : <div className="po-apply-grid"><ApplyForm kind={selected} chinese={chinese}/></div>}<section className="po-local"><Mail/><a href="mailto:eric@postory.ca">eric@postory.ca</a><span>Eric · Postory, Toronto</span></section></PublicFrame>;
}

function ApplyForm({ kind, chinese = false }: { kind: "shop" | "partner"; chinese?: boolean }) {
  const partner = kind === "partner";
  const zhShop = chinese && !partner;
  const labels = zhShop ? {
    kicker: "店主体验申请", title: "本地实体店主", business: "店名", name: "老板姓名", industry: "行业", choose: "请选择",
    email: "邮箱", phone: "电话 / WhatsApp", location: "城市 / GTA 区域", social: "Instagram 账号（选填）", review: "Google 评价页链接（选填）",
    platforms: "想发布的平台", notes: "补充说明（选填）", consent: "我了解：体验为 7 天、共 7 条内容，含一次风格确认；后续报价会一对一发送，不绑约，不合适可以停止。",
    submit: "提交体验申请", foot: "我们会亲自回复。此表单不会收取款项。",
  } : {
    kicker: partner ? "PARTNER INTRODUCTION" : "SHOP EXPERIENCE", title: partner ? "Agency or reseller" : "Local shop owner",
    business: partner ? "Company or name" : "Shop name", name: "Your name", industry: "Industry", choose: "Choose one",
    email: "Email", phone: "Phone or WhatsApp", location: partner ? "City and country" : "City / GTA area",
    social: partner ? "Number of local-business clients" : "Instagram account (optional)", review: "Google review page (optional)",
    platforms: "Platforms you want to use", notes: "Anything else?", consent: "I understand the experience is 7 days and includes 7 posts and one style review. A tailored quote is shared one-to-one; there is no obligation to continue.",
    submit: partner ? "Request a conversation" : "Apply for an experience", foot: "We’ll reply personally. No payment is collected on this form.",
  };
  const industries = zhShop ? ["美甲", "美容美发", "餐饮", "健身", "会计财税", "屋顶", "园艺", "水暖", "装修", "搬家", "其他本地服务"] : ["Nail studio", "Beauty & hair", "Restaurant", "Fitness", "Accounting", "Roofing", "Landscaping", "Plumbing", "Renovation", "Moving", "Other local service"];
  const platforms = ["Instagram", "Facebook", "TikTok", "小红书"];
  return <form className="po-apply-card" action="/api/leads" method="post">
    <input type="hidden" name="type" value={kind}/><span className="ps-kicker">{labels.kicker}</span><h2>{labels.title}</h2>
    <label>{labels.business}<input name="business" maxLength={160} required/></label>
    <label>{labels.name}<input name="contact" maxLength={128} required/></label>
    {!partner && <label>{labels.industry}<select name="industry" required><option value="">{labels.choose}</option>{industries.map((item)=><option key={item}>{item}</option>)}</select></label>}
    <label>{labels.email}<input name="email" type="email" maxLength={254} required/></label>
    <label>{labels.phone}<input name="phone" maxLength={40} required/></label>
    <label>{labels.location}<input name="location" maxLength={255} required/></label>
    {partner ? <><label>{labels.social}<select name="clientCount" required><option value="">{labels.choose}</option>{["No clients yet", "1–5", "6–20", "20+"].map((item)=><option key={item}>{item}</option>)}</select></label><label>Client industries (optional)<input name="clientIndustries" maxLength={255}/></label></> : <><label>{labels.social}<input name="social" maxLength={255}/></label><label>{labels.review}<input name="googleReviewUrl" type="url" maxLength={500}/></label><label>{labels.platforms}<select name="platforms" multiple required size={4}>{platforms.map((item)=><option key={item}>{item}</option>)}</select></label><label className="po-consent"><input type="checkbox" name="consent" value="yes" required/>{labels.consent}</label></>}
    <label>{labels.notes}<textarea name="notes" rows={3} maxLength={2000}/></label>
    <label className="po-honeypot" aria-hidden="true">Leave this field empty<input name="website" tabIndex={-1} autoComplete="off"/></label>
    <button className="ps-button" type="submit">{labels.submit}<ArrowRight size={15}/></button><small>{labels.foot}</small>
  </form>;
}

export function HowItWorksPage() {
  return <PublicFrame className="ps-official"><section className="po-page-head"><span className="ps-kicker">A CLEAR MONTHLY ROUTINE</span><h1>Know who to contact,<br/>what you’ll review, and when.</h1><p>One simple workflow keeps the content moving without making you manage another marketing tool.</p></section><div className="po-steps">{[["01","Get in touch","Apply or email Eric at eric@postory.ca. We learn about your shop and prepare a style sample."],["02","Confirm the direction","We review the sample together on a short call, then share your tailored quote directly."],["03","Send us photos","Share any useful shop, service, product or team photos you already have. We can work with your existing material."],["04","Review your month","Your upcoming posts and monthly progress are shared in your client workspace. You can review posts before they publish."],["05","We keep publishing","We design, write, schedule and publish the agreed monthly content, then share a clear report of delivered posts and activity."]].map(([n,t,b])=><article key={n}><b>{n}</b><div><h2>{t}</h2><p>{b}</p></div></article>)}</div><section className="po-two-col po-tint"><div><span className="ps-kicker">EXAMPLE REPORT PREVIEW</span><h2>A simple record of the work.</h2><p>Each month, see the content prepared, what has published, what still needs review, and links to each post. Reporting describes the work delivered; we don’t promise reach, follower or sales numbers.</p></div><div className="po-report-card"><div><span>MONTHLY CONTENT SUMMARY</span><b>30 posts</b><small>Prepared for review</small></div><div className="po-report-row"><span>Published</span><b>24</b></div><div className="po-report-row"><span>Awaiting approval</span><b>6</b></div><div className="po-report-link">Post previews and links <ArrowRight size={14}/></div><small>Illustrative report layout</small></div></section><section className="po-end-cta"><h2>Want to see if the workflow fits your shop?</h2><Action/></section></PublicFrame>;
}

export function AboutPostoryPage() {
  return <PublicFrame className="ps-official"><section className="po-page-head"><span className="ps-kicker">ABOUT POSTORY</span><h1>A small Toronto team<br/>for local businesses.</h1><p>We take recurring social content off the owner’s to-do list: planning, designing, writing and publishing posts for local shops around the GTA.</p><p className="po-signature">Eric · Postory, Toronto</p><a className="ps-text-link" href="mailto:eric@postory.ca">eric@postory.ca <ArrowRight size={15}/></a></section><section className="po-two-col"><div><span className="ps-kicker">HOW WE WORK</span><h2>Clear service. Human review.</h2><p>Our production system helps prepare drafts. A person reviews and finalizes every post before it is scheduled. We focus on consistent delivery and clear communication.</p></div><ul><li><Check/>Serving businesses across the GTA</li><li><Check/>Shop owners can review content before publication</li><li><Check/>Monthly work is shared through the client workspace</li></ul></section></PublicFrame>;
}
