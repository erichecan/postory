import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Check,
  ClipboardCheck,
  ImagePlus,
  LineChart,
  Megaphone,
  MessageSquareText,
  PanelsTopLeft,
  Send,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { AssessmentForm } from "./forms";

type Audience = "store" | "team" | "managed";

const pageData = {
  store: {
    label: "For independent businesses",
    name: "Store Self-Service",
    headline: "Your next month of local marketing,\nplanned in one place.",
    intro:
      "Made for restaurants, salons, nail studios and local shops. Bring your photos, videos and offers. PoStory helps turn them into a practical content plan you can review and publish.",
    primary: "Plan my store’s marketing",
    outcome: "A clear plan you can run yourself",
    steps: [
      [ImagePlus, "Add your business and media", "Share your services, menu, products, prices and photos or videos."],
      [Sparkles, "Build a useful content plan", "Get content ideas and a monthly calendar shaped around your goals."],
      [ClipboardCheck, "Review and publish", "Confirm business details, edit drafts and keep track of what is ready."],
    ],
    features: [
      "Up to 20 content pieces per month",
      "Business, product and service details in one workspace",
      "Photo and video based content planning",
      "Monthly calendar with review status",
      "Editable captions and campaign ideas",
      "Simple record of published content and results",
    ],
    bestFor: "Owners who want a practical system and are happy to run their own marketing.",
    limit: "You make the final decisions and publish or approve each item. Paid ads and on-site photography are not included.",
    formTitle: "Get started with Store Self-Service",
    formBody: "Tell us about your business. We’ll contact you to set up your workspace and explain the first month.",
  },
  team: {
    label: "For in-house marketing teams",
    name: "Team Workspace",
    headline: "Give your marketing team\none shared place to work.",
    intro:
      "Keep brand assets, campaign plans, approvals and channel calendars together. Your team stays in control of the strategy while PoStory makes the workflow easier to manage.",
    primary: "Set up our team workspace",
    outcome: "Your team keeps ownership; work becomes easier to coordinate",
    steps: [
      [PanelsTopLeft, "Set up your brand workspace", "Bring in brand guidelines, locations, channels and existing content."],
      [UsersRound, "Assign work and approvals", "Give teammates clear roles, owners and review steps."],
      [CalendarDays, "Manage the publishing calendar", "See what is planned, who owns it and what still needs approval."],
    ],
    features: [
      "Shared brand and media library",
      "Team calendar across connected channels",
      "Content owners, review status and approval history",
      "Central place for campaign briefs and drafts",
      "Publishing status and exception tracking",
      "Monthly view of content activity and results",
    ],
    bestFor: "Businesses with marketing staff that need a more organized operating platform.",
    limit: "Your team owns the marketing strategy and content decisions. Ongoing content production by PoStory is not included in this plan.",
    formTitle: "Set up your Team Workspace",
    formBody: "Share your company and team needs. We’ll map the workspace to your current approval and publishing process.",
  },
  managed: {
    label: "For businesses without a marketing team",
    name: "PoStory Managed Marketing",
    headline: "A marketing team beside you,\nwithout building one in-house.",
    intro:
      "You provide the business facts, products, offers and source material. PoStory plans and prepares the content, brings it to you for approval, then coordinates the agreed publishing workflow.",
    primary: "Request managed marketing",
    outcome: "PoStory handles the ongoing content workflow; you approve the facts and final work",
    steps: [
      [MessageSquareText, "Tell us what matters this month", "We learn your offers, priorities, audience, important dates and guardrails."],
      [Megaphone, "Review the monthly plan", "PoStory proposes themes, content formats and a calendar for your approval."],
      [Send, "Approve and follow delivery", "Review prepared content, approve publishing and see a monthly progress report."],
    ],
    features: [
      "Monthly campaign plan and content calendar",
      "Content preparation based on your supplied materials",
      "Review and approval workflow before publishing",
      "Publishing coordination for agreed channels",
      "Monthly delivery and performance review",
      "A clear list of facts or materials needed from you",
    ],
    bestFor: "Owners who want PoStory to take responsibility for the recurring marketing workflow.",
    limit: "The service scope, monthly content volume, revision rounds and channels are confirmed before work begins. On-site shoots, ad spend and complex video production are quoted separately.",
    formTitle: "Talk to us about Managed Marketing",
    formBody: "Tell us about your business and goals. We’ll confirm fit, scope and the first month’s delivery plan.",
  },
} satisfies Record<Audience, {
  label: string;
  name: string;
  headline: string;
  intro: string;
  primary: string;
  outcome: string;
  steps: [LucideIcon, string, string][];
  features: string[];
  bestFor: string;
  limit: string;
  formTitle: string;
  formBody: string;
}>;

export function AudiencePage({ audience }: { audience: Audience }) {
  const data = pageData[audience];
  return (
    <main className={`ps ps-audience ps-audience-${audience}`}>
      <header className="ps-audience-header">
        <Logo href="/" />
        <span className="ps-audience-header-label">{data.label}</span>
        <Link href="#get-started" className="ps-button ps-audience-header-cta">{data.primary}<ArrowRight size={15} /></Link>
      </header>

      <section className="ps-audience-hero">
        <div className="ps-audience-hero-copy">
          <span className="ps-audience-eyebrow"><Sparkles size={14} /> {data.name}</span>
          <h1>{data.headline.split("\n").map((line, index) => <span key={line}>{index > 0 && <br />}{line}</span>)}</h1>
          <p>{data.intro}</p>
          <div className="ps-audience-actions">
            <Link href="#get-started" className="ps-button">{data.primary}<ArrowRight size={16} /></Link>
            <Link href="#how-it-works" className="ps-audience-secondary">See how it works <ArrowDown size={15} /></Link>
          </div>
          <p className="ps-audience-quiet">{data.bestFor}</p>
        </div>
        <div className="ps-audience-visual" aria-label="PoStory content workflow preview">
          <div className="ps-audience-visual-top"><span className="ps-audience-dot" /><span>POSTORY WORKSPACE</span><span className="ps-audience-live"><i /> READY TO PLAN</span></div>
          <div className="ps-audience-preview-title"><div><small>THIS MONTH</small><strong>{audience === "store" ? "Local stories, all planned" : audience === "team" ? "Campaign workspace" : "Your monthly marketing plan"}</strong></div><CalendarDays size={19} /></div>
          <div className="ps-audience-preview-grid">
            <article className="ps-preview-media"><div className="ps-preview-media-art"><ImagePlus /><span>Photos &amp; videos</span></div><div><small>YOUR BRAND MATERIALS</small><strong>One organized library</strong></div></article>
            <article className="ps-preview-plan"><small>CAMPAIGN PLAN</small><strong>{audience === "managed" ? "Seasonal feature" : "A week of content"}</strong><span>Product spotlight · Behind the scenes · Local offer</span><div className="ps-preview-calendar"><i /><i /><i /><i /><i /><i /><i /></div><div className="ps-preview-status"><BadgeCheck size={15} /> {audience === "managed" ? "Waiting for your approval" : audience === "team" ? "2 items need review" : "Ready for your review"}</div></article>
          </div>
          <div className="ps-audience-visual-foot"><span><ShieldCheck size={14} /> Your business facts stay reviewable</span><span><CalendarDays size={14} /> Plan · review · publish · learn</span></div>
        </div>
      </section>

      <section className="ps-audience-proof" aria-label="What you get">
        <div><span className="ps-audience-proof-icon"><ImagePlus /></span><span><strong>Use your real materials</strong><small>Photos, videos, products and offers</small></span></div>
        <div><span className="ps-audience-proof-icon"><CalendarDays /></span><span><strong>See the work ahead</strong><small>Plan content in a clear calendar</small></span></div>
        <div><span className="ps-audience-proof-icon"><ClipboardCheck /></span><span><strong>Keep people in control</strong><small>Review before work goes live</small></span></div>
      </section>

      <section className="ps-audience-section" id="how-it-works">
        <div className="ps-audience-section-heading"><span className="ps-audience-eyebrow">A SIMPLE WORKFLOW</span><h2>{data.outcome}</h2><p>Each step has an owner and a clear next action, so plans do not stop at a list of ideas.</p></div>
        <div className="ps-audience-steps">{data.steps.map(([Icon, title, body], index) => <article key={title}><div className="ps-audience-step-number">0{index + 1}</div><span className="ps-audience-step-icon"><Icon size={22} /></span><h3>{title}</h3><p>{body}</p>{index < data.steps.length - 1 && <ArrowRight className="ps-audience-step-arrow" size={19} />}</article>)}</div>
      </section>

      <section className="ps-audience-included">
        <div className="ps-audience-included-copy"><span className="ps-audience-eyebrow">WHAT’S INCLUDED</span><h2>Everything for this way of working.</h2><p>{data.bestFor}</p><Link href="#get-started" className="ps-button">{data.primary}<ArrowRight size={16} /></Link></div>
        <div className="ps-audience-feature-list">{data.features.map((feature) => <div key={feature}><span><Check size={15} /></span>{feature}</div>)}</div>
      </section>

      <section className="ps-audience-boundary"><ShieldCheck size={19} /><div><strong>Clear scope, no surprises</strong><p>{data.limit}</p></div></section>

      <section className="ps-audience-faq">
        <div><span className="ps-audience-eyebrow">BUILT AROUND YOUR BUSINESS</span><h2>One process from source material to results.</h2><p>PoStory brings business information, media, planning, review and publishing status into the same workflow. You can see what is ready and what still needs attention.</p></div>
        <div className="ps-audience-flow">{[[ImagePlus, "Business & materials"], [Sparkles, "Plan & prepare"], [ClipboardCheck, "Review & approve"], [LineChart, "Track & improve"]].map(([Icon, label]) => { const I = Icon as typeof ImagePlus; return <div key={String(label)}><I size={18} /><span>{String(label)}</span><ArrowRight size={14} /></div>; })}</div>
      </section>

      <section className="ps-audience-form-section" id="get-started">
        <div><span className="ps-audience-eyebrow">START WITH A CONVERSATION</span><h2>{data.formTitle}</h2><p>{data.formBody}</p><div className="ps-audience-form-note"><Check size={15} /> No account is required to send a request.</div></div>
        <div className="ps-audience-form-card"><AssessmentForm offer={audience} /></div>
      </section>

      <footer className="ps-audience-footer"><Logo href="/" /><span>Plan with purpose. Publish with confidence.</span><Link href="/assessment">General inquiry <ArrowRight size={14} /></Link></footer>
    </main>
  );
}
