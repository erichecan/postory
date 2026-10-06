"use client";
import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Ellipsis,
  FileText,
  Heart,
  Image as ImageIcon,
  Layers,
  MapPin,
  MessageCircle,
  Phone,
  PlusCircle,
  Share2,
  Sparkles,
  Target,
  Users,
  X,
  Link as LinkIcon,
  Store,
  Eye,
} from "lucide-react";
import type { AgencyData, Campaign, ContentItem } from "@/lib/agency/types";
import { focus } from "@/lib/agency/demo";
import { CTA, Photo, Platform, Platforms } from "./primitives";
import { VisualHeader } from "./shell";
import { BrandEditor, FeedbackDialog } from "./forms";
import { SocialAccountsPanel } from "@/components/profile/social-accounts-panel";
const dateLabel = (d: string) =>
  new Date(d + "T12:00:00Z").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
const prefix = (data: AgencyData) => (data.demo ? "/demo" : "");
export function CustomerFrame({
  data,
  children,
  page,
}: {
  data: AgencyData;
  children: React.ReactNode;
  page: string;
}) {
  return (
    <div className={`ps ps-customer ps-customer-${page}`}>
      <VisualHeader
        customer
        demo={data.demo}
        name={data.name}
        shop={data.shop}
      />
      {data.demo && (
        <div className="ps-demo-label">
          Design demo · Sample business and results{" "}
          <Link href="/">Back to website ↗</Link>
        </div>
      )}
      <main className="ps-client-main">{children}</main>
    </div>
  );
}
function Heading({
  title,
  body,
  note,
  children,
}: {
  title: string;
  body: string;
  note?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="ps-client-heading">
      <div>
        <h1>{title}</h1>
        <p>{body}</p>
      </div>
      {note && (
        <div className="ps-client-note">
          <Sparkles />
          <p>{note}</p>
        </div>
      )}
      {children}
    </div>
  );
}
function Empty({
  title = "Your content is on its way",
  body = "Your PoStory team will share your plan and content here when they’re ready.",
}: {
  title?: string;
  body?: string;
}) {
  return (
    <div className="ps-empty">
      <span className="ps-icon">
        <Sparkles />
      </span>
      <h3>{title}</h3>
      <p>{body}</p>
    </div>
  );
}
function Stats({
  items,
  full = false,
}: {
  items: ContentItem[];
  full?: boolean;
}) {
  const n = items.length,
    p = items.filter((x) => x.status === "Published").length,
    s = items.filter((x) => x.status === "Scheduled").length;
  const list = [
    [
      n,
      full ? "Content Pieces" : "Planned",
      "Planned this month",
      CalendarDays,
    ],
    [p, "Published", "So far this month", CheckCircle],
    [s, full ? "Scheduled" : "Coming Up", "Scheduled to publish", Clock],
    ...(full ? [] : [[n - p - s, "In Progress", "Being prepared", FileText]]),
  ];
  return (
    <div className="ps-stats">
      {list.map(([n, t, b, Icon], i) => {
        const I = Icon as typeof CalendarDays;
        return (
          <div key={String(t)}>
            <span className={`ps-icon ps-tone-${i}`}>
              <I />
            </span>
            <div>
              <strong>{String(n)}</strong>
              <span>{String(t)}</span>
              {full && <small>{String(b)}</small>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
function Progress({ items }: { items: ContentItem[] }) {
  const published = items.filter((x) => x.status === "Published").length;
  const percentage = items.length
    ? Math.round((100 * published) / items.length)
    : 0;
  return (
    <section className="ps-client-panel ps-progress-panel">
      <div className="ps-panel-heading">
        <h2>Campaign Progress</h2>
        <span>
          {published} of {items.length} published
        </span>
        <strong>{percentage}%</strong>
      </div>
      <div
        className="ps-progress-track"
        role="progressbar"
        aria-label="Campaign publishing progress"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <i style={{ width: `${percentage}%` }} />
      </div>
      <Stats items={items} />
    </section>
  );
}
function CampaignHero({
  data,
  campaign,
  wide = false,
}: {
  data: AgencyData;
  campaign: Campaign;
  wide?: boolean;
}) {
  return (
    <section
      className={`ps-client-panel ps-campaign-hero ${wide ? "ps-campaign-hero-wide" : ""}`}
    >
      <Photo src={campaign.cover} alt={campaign.name} />
      <div>
        <span className="ps-status ps-status-published">
          {campaign.status.toUpperCase()} CAMPAIGN
        </span>
        <h2>{campaign.name}</h2>
        <p className="ps-campaign-dates">
          <CalendarDays size={18} />
          {dateLabel(campaign.start)} – {dateLabel(campaign.end)}
          {data.demo && <span>4 weeks left</span>}
        </p>
        <p>{campaign.description}</p>
        <Platforms
          names={[...new Set(campaign.items.map((x) => x.platform))]}
        />
        {!wide && (
          <CTA href={`${prefix(data)}/my-campaign/${campaign.id}`}>
            View Campaign Details
          </CTA>
        )}
      </div>
      {wide && (
        <div className="ps-campaign-hero-summary">
          <Stats items={campaign.items} full />
          <CTA href={`${prefix(data)}/my-campaign/${campaign.id}`}>
            View Campaign Details
          </CTA>
        </div>
      )}
    </section>
  );
}
function ContentDialog({
  item,
  children,
  demo = false,
}: {
  item: ContentItem;
  children: React.ReactNode;
  demo?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button
        className="ps-content-trigger"
        onClick={() => ref.current?.showModal()}
      >
        {children}
      </button>
      <dialog className="ps-dialog ps-content-dialog" ref={ref}>
        <button
          className="ps-modal-close"
          aria-label="Close content details"
          onClick={() => ref.current?.close()}
        >
          <X />
        </button>
        <Photo src={item.image} alt={item.title} />
        <span
          className={`ps-status ps-status-${item.status.toLowerCase().replaceAll(" ", "-")}`}
        >
          {item.status}
        </span>
        <h2>{item.title}</h2>
        <p>
          {dateLabel(item.date)} · {item.time}
        </p>
        <p>
          {item.caption ||
            "Your PoStory team will add the caption when the content is ready."}
        </p>
        {demo ? (
          <small>
            Sample content preview. No live post is being published.
          </small>
        ) : (
          <Link
            className="ps-button ps-button-secondary"
            href={`/editor/${item.id}`}
          >
            View Original Content <ArrowRight size={15} />
          </Link>
        )}
      </dialog>
    </>
  );
}
function PostCards({
  items,
  data,
  recent = false,
  detail = false,
}: {
  items: ContentItem[];
  data: AgencyData;
  recent?: boolean;
  detail?: boolean;
}) {
  return (
    <div
      className={`ps-client-posts ${recent ? "ps-recent-posts" : ""} ${detail ? "ps-detail-posts" : ""}`}
    >
      {!items.length ? (
        <Empty />
      ) : (
        items.map((item, i) => (
          <article key={item.id}>
            <ContentDialog item={item} demo={data.demo}>
              <div className="ps-post-date">
                <Platform name={item.platform} size={22} />
                <span>{dateLabel(item.date)}</span>
                <small>{item.time}</small>
              </div>
              <div className="ps-client-post-image">
                <Photo src={item.image} alt={item.title} />
                {recent && <Platform name={item.platform} size={23} />}
              </div>
              <strong>{item.title}</strong>
              {recent && <small>{dateLabel(item.date)}</small>}
            </ContentDialog>
            {detail ? (
              <div className="ps-post-status">
                <span
                  className={`ps-status ps-status-${item.status.toLowerCase().replaceAll(" ", "-")}`}
                >
                  {item.status}
                </span>
                <ContentDialog item={item} demo={data.demo}>
                  <Ellipsis size={14} />
                </ContentDialog>
              </div>
            ) : recent ? (
              <div className="ps-post-metrics">
                <Heart size={14} />
                {data.demo ? ["1.2K", "836", "2.4K", "980"][i % 4] : "—"}
                <MessageCircle size={13} />
                {data.demo ? [86, 52, 120, 64][i % 4] : "—"}
                <Share2 size={13} />
                {data.demo ? [42, 28, 96, 36][i % 4] : "—"}
              </div>
            ) : (
              <span className={`ps-category ps-category-${i % 4}`}>
                {item.category}
              </span>
            )}
          </article>
        ))
      )}
    </div>
  );
}
function FocusPanel({ data }: { data: AgencyData }) {
  return (
    <section className="ps-client-panel ps-focus-panel">
      <h2>
        <Target />
        This Month’s Focus
      </h2>
      <ol>
        {(data.demo
          ? focus
          : data.campaigns
              .filter((c) => c.status === "Active")
              .map((c) => c.name)
        ).map((f, i) => (
          <li key={f}>
            <span>{i + 1}</span>
            {f}
          </li>
        ))}
      </ol>
      {!data.demo && !data.campaigns.length && (
        <p>Your team will add the focus of your next plan here.</p>
      )}
    </section>
  );
}
function upcoming(data: AgencyData) {
  if (!data.demo)
    return data.items.filter((i) => i.status === "Scheduled").slice(0, 4);
  return [
    "Skincare Routine for Healthy Skin",
    "Best Skincare Products for Spring",
    "A Relaxing Day at Our Beauty Studio",
    "Client Testimonial",
  ].map((title, i) => ({
    ...data.items[i],
    id: `upcoming-${i}`,
    title,
    image: `/visual/upcoming-${i + 1}.webp`,
    date: ["2026-09-29", "2026-09-30", "2026-10-02", "2026-10-04"][i],
    platform: ["instagram", "tiktok", "facebook", "instagram"][i],
    status: "Scheduled" as const,
  }));
}
function recent(data: AgencyData) {
  return data.demo
    ? [
        "3 Skincare Tips You Need to Know",
        "A Relaxing Day at Our Beauty Studio",
        "New Product Launch",
        "Behind the Scenes at the Studio",
      ].map((title, i) => ({
        ...data.items[i],
        id: `recent-${i}`,
        title,
        image: `/visual/recent-${i + 1}.webp`,
        date: ["2026-09-25", "2026-09-22", "2026-09-18", "2026-09-15"][i],
        platform: ["instagram", "facebook", "tiktok", "instagram"][i],
      }))
    : data.items.filter((i) => i.status === "Published").slice(-4);
}
function CampaignList({
  data,
  status,
}: {
  data: AgencyData;
  status: "Upcoming" | "Completed";
}) {
  const campaigns = data.campaigns.filter((c) => c.status === status);
  return (
    <section className="ps-client-panel ps-campaign-list">
      <div className="ps-panel-heading">
        <h2>{status === "Upcoming" ? "Upcoming" : "Past"} Campaigns</h2>
        <Link
          href={`${prefix(data)}/my-campaign?status=${status.toLowerCase()}`}
          className="ps-text-link"
        >
          View All →
        </Link>
      </div>
      {campaigns.length ? (
        campaigns.map((c) => (
          <Link
            key={c.id}
            href={`${prefix(data)}/my-campaign/${c.id}`}
            className="ps-mini-campaign"
          >
            <Photo src={c.cover} />
            <div>
              <h3>{c.name}</h3>
              <small>
                {dateLabel(c.start)} – {dateLabel(c.end)}
              </small>
              <span
                className={`ps-status ${status === "Completed" ? "ps-status-published" : "ps-status-in-progress"}`}
              >
                {status === "Completed" ? "COMPLETED" : "PLANNING"}
              </span>
              <p>{c.description}</p>
            </div>
          </Link>
        ))
      ) : (
        <Empty title={`No ${status.toLowerCase()} campaigns yet`} />
      )}
    </section>
  );
}
export function DashboardPage({ data }: { data: AgencyData }) {
  const campaign = data.campaigns.find((c) => c.status === "Active");
  return (
    <CustomerFrame data={data} page="dashboard">
      <Heading
        title={`Welcome back, ${data.name.split(" ")[0]}! 👋`}
        body="Here’s an overview of your social media this month."
        note="We’re creating and publishing content for you. Sit back and watch your brand grow!"
      />
      <div className="ps-dashboard-grid">
        <div>
          {campaign ? (
            <CampaignHero data={data} campaign={campaign} />
          ) : (
            <section className="ps-client-panel">
              <Empty title="Your next campaign starts here" />
            </section>
          )}
          <section className="ps-client-panel">
            <div className="ps-panel-heading">
              <h2>Upcoming Posts</h2>
              <Link href={`${prefix(data)}/calendar`} className="ps-text-link">
                View Full Calendar →
              </Link>
            </div>
            <PostCards items={upcoming(data)} data={data} />
          </section>
          <section className="ps-client-panel">
            <div className="ps-panel-heading">
              <h2>Recent Published Content</h2>
              <Link
                className="ps-text-link"
                href={`${prefix(data)}/my-campaign?content=published`}
              >
                View All →
              </Link>
            </div>
            <PostCards items={recent(data)} data={data} recent />
          </section>
        </div>
        <div>
          <Progress items={campaign?.items ?? data.items} />
          {upcoming(data)[0] && (
            <div className="ps-next-post">
              <CalendarDays />
              <div>
                <strong>
                  Next post:{" "}
                  {data.demo
                    ? "Tomorrow, 10:00 AM"
                    : dateLabel(upcoming(data)[0].date)}
                </strong>
                <p>{upcoming(data)[0].title}</p>
              </div>
              <Photo src={upcoming(data)[0].image} />
            </div>
          )}
          <PlatformPanel data={data} />
          <Messages data={data} />
        </div>
      </div>
    </CustomerFrame>
  );
}
function PlatformPanel({ data }: { data: AgencyData }) {
  const [days, setDays] = useState("30");
  return (
    <section className="ps-client-panel ps-platform-panel">
      <div className="ps-panel-heading">
        <h2>Platform Overview</h2>
        <select
          aria-label="Platform overview period"
          value={days}
          onChange={(e) => setDays(e.target.value)}
        >
          <option value="30">Last 30 days</option>
          <option value="7">Last 7 days</option>
        </select>
      </div>
      {data.accounts.length ? (
        data.accounts.map((a, i) => {
          const n = data.demo
            ? [8, 4, 4][i % 3]
            : data.items.filter(
                (item) =>
                  item.platform === a.platform &&
                  new Date(item.date).getTime() >=
                    Date.now() - Number(days) * 86400000,
              ).length;
          return (
            <Link
              key={a.platform}
              href={`${prefix(data)}/my-brand#connections`}
              className="ps-platform-row"
            >
              <Platform name={a.platform} size={31} />
              <div>
                <strong>
                  {a.platform[0].toUpperCase() + a.platform.slice(1)}
                </strong>
                <p>
                  {n} posts {days === "7" ? "this week" : "this month"}
                </p>
              </div>
              <div className="ps-platform-track">
                <i
                  style={{
                    width: `${Math.min(100, n * 10)}%`,
                    background: ["#ff0086", "#1488ff", "#090d18"][i % 3],
                  }}
                />
              </div>
              <div>
                <strong className="ps-growth">
                  {data.demo && days === "30"
                    ? ["+12%", "+8%", "+15%"][i % 3]
                    : "—"}
                </strong>
                <small>
                  {data.demo ? "vs. last month" : "Analytics unavailable"}
                </small>
              </div>
              <ChevronRight size={18} />
            </Link>
          );
        })
      ) : (
        <Empty title="Connect your social accounts" />
      )}
    </section>
  );
}
function Messages({ data }: { data: AgencyData }) {
  return (
    <section className="ps-client-panel ps-messages" id="updates">
      <div className="ps-panel-heading">
        <h2>Messages & Updates</h2>
        <Link href="/assessment" className="ps-text-link">
          Contact →
        </Link>
      </div>
      {data.demo ? (
        [
          {
            title: "Your content this month is on track! ✨",
            body: "We’ve published 8 of 12 posts and everything is going well.",
            time: "2 days ago",
          },
          {
            title: "New content ready for your review",
            body: "We’ve prepared 2 posts for the upcoming promotion.",
            time: "5 days ago",
          },
          {
            title: "Campaign update",
            body: "Great early engagement on the skincare tips post! We’re seeing increased interest in your spring facial.",
            time: "1 week ago",
          },
        ].map((m, i) => (
          <div className="ps-message" key={m.title}>
            <Photo name="avatar" className="ps-avatar" />
            <div>
              <h3>{m.title}</h3>
              <p>{m.body}</p>
            </div>
            <small>
              {m.time}
              {i === 1 && (
                <Link href="/demo/my-campaign/spring-beauty-refresh">
                  Review Now
                </Link>
              )}
            </small>
          </div>
        ))
      ) : (
        <Empty
          title="No new messages"
          body="Your team will contact you when there’s an update to your plan."
        />
      )}
    </section>
  );
}
export function CampaignsPage({
  data,
  initialStatus,
  initialContent,
}: {
  data: AgencyData;
  initialStatus?: string;
  initialContent?: string;
}) {
  const [status, setStatus] = useState(initialStatus ?? "active");
  const campaign = data.campaigns.find((c) => c.status === "Active");
  return (
    <CustomerFrame data={data} page="campaigns">
      <Heading
        title="My Campaign"
        body="Here’s what we’re working on for your social media."
        note="We plan, create, and publish your content. You can always check the progress here."
      />
      {initialStatus && (
        <div className="ps-client-tabs">
          {["active", "upcoming", "completed"].map((s) => (
            <button
              key={s}
              aria-pressed={status === s}
              onClick={() => setStatus(s)}
            >
              {s[0].toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      )}
      {status !== "active" ? (
        <CampaignList
          data={data}
          status={status === "upcoming" ? "Upcoming" : "Completed"}
        />
      ) : (
        <>
          {campaign ? (
            <CampaignHero data={data} campaign={campaign} wide />
          ) : (
            <section className="ps-client-panel">
              <Empty title="No active campaign yet" />
            </section>
          )}
          <div className="ps-campaign-middle">
            <section className="ps-client-panel">
              <div className="ps-panel-heading">
                <div>
                  <h2>Upcoming Content</h2>
                  <p>Here are the next posts we’ll be publishing.</p>
                </div>
                <Link
                  href={`${prefix(data)}/calendar`}
                  className="ps-text-link"
                >
                  View Full Calendar →
                </Link>
              </div>
              <PostCards items={upcoming(data)} data={data} />
            </section>
            <FocusPanel data={data} />
          </div>
          <div className="ps-campaign-bottom">
            <section className="ps-client-panel" id="published">
              <div className="ps-panel-heading">
                <div>
                  <h2>Recent Published Content</h2>
                  <p>Check out what we’ve recently shared.</p>
                </div>
                <Link
                  className="ps-text-link"
                  href={
                    campaign
                      ? `${prefix(data)}/my-campaign/${campaign.id}?tab=content&filter=Published`
                      : `${prefix(data)}/my-campaign?content=published`
                  }
                >
                  View All Published →
                </Link>
              </div>
              <PostCards
                items={
                  initialContent === "published"
                    ? data.items.filter((i) => i.status === "Published")
                    : recent(data)
                }
                data={data}
                recent
              />
            </section>
            <CampaignList data={data} status="Upcoming" />
            <CampaignList data={data} status="Completed" />
          </div>
        </>
      )}
    </CustomerFrame>
  );
}
export function CampaignDetailPage({
  data,
  campaign,
  initialTab = "overview",
  initialFilter = "All",
}: {
  data: AgencyData;
  campaign: Campaign;
  initialTab?: string;
  initialFilter?: string;
}) {
  const [tab, setTab] = useState(initialTab);
  const [filter, setFilter] = useState(initialFilter);
  const planRef = useRef<HTMLDialogElement>(null);
  const items = campaign.items.filter(
    (i) => filter === "All" || i.status === filter,
  );
  return (
    <CustomerFrame data={data} page="detail">
      <section className="ps-detail-hero">
        <div>
          <Link href={`${prefix(data)}/my-campaign`}>
            <ArrowLeft size={14} />
            Back to My Campaign
          </Link>
          <h1>
            {campaign.name}{" "}
            <span className="ps-status ps-status-published">
              {campaign.status.toUpperCase()}
            </span>
          </h1>
          <p className="ps-campaign-dates">
            <CalendarDays size={18} />
            {dateLabel(campaign.start)} – {dateLabel(campaign.end)}{" "}
            {data.demo && " | 4 weeks left"}
          </p>
          <p>{campaign.description}</p>
          <Platforms
            names={[...new Set(campaign.items.map((i) => i.platform))]}
          />
        </div>
        <Photo src={campaign.cover} alt={campaign.name} />
      </section>
      <nav className="ps-client-tabs" aria-label="Campaign section">
        {["overview", "content", "schedule", "results"].map((t) => (
          <button key={t} aria-pressed={tab === t} onClick={() => setTab(t)}>
            {t[0].toUpperCase() + t.slice(1)}
            {t === "content" ? ` (${campaign.items.length})` : ""}
          </button>
        ))}
      </nav>
      <div className="ps-detail-columns">
        <div>
          {tab === "overview" && (
            <section className="ps-client-panel ps-strategy-panel">
              <div className="ps-panel-heading">
                <h2>
                  <Sparkles />
                  Campaign Strategy
                </h2>
                <button
                  className="ps-small-button"
                  onClick={() => planRef.current?.showModal()}
                >
                  <FileText size={12} />
                  View Original Plan
                </button>
              </div>
              <div className="ps-strategy-cards">
                <article>
                  <h3>
                    <Target />
                    Goal
                  </h3>
                  <p>{campaign.goal || campaign.description}</p>
                </article>
                <article>
                  <h3>
                    <Users />
                    Target Audience
                  </h3>
                  <p>
                    {data.demo ? (
                      <>
                        Women 25 – 45
                        <br />
                        Local customers
                        <br />
                        Beauty & wellness interested audience
                      </>
                    ) : (
                      "Your team will confirm the audience for this campaign."
                    )}
                  </p>
                </article>
                <article>
                  <h3>
                    <MessageCircle />
                    Key Messages
                  </h3>
                  {data.demo ? (
                    <ul>
                      <li>Spring skincare treatments</li>
                      <li>Real client transformations</li>
                      <li>Simple skincare tips</li>
                      <li>Limited-time special offer</li>
                    </ul>
                  ) : (
                    <p>{campaign.description}</p>
                  )}
                </article>
                <article>
                  <h3>
                    <Share2 />
                    Platforms
                  </h3>
                  <Platforms
                    names={[...new Set(campaign.items.map((i) => i.platform))]}
                  />
                </article>
              </div>
            </section>
          )}
          {(tab === "overview" || tab === "results") && (
            <Progress items={campaign.items} />
          )}{" "}
          {(tab === "overview" || tab === "content") && (
            <section className="ps-client-panel">
              <div className="ps-panel-heading">
                <h2>
                  <ImageIcon />
                  Content We Created ({campaign.items.length})
                </h2>
                <div className="ps-filter">
                  {["All", "Published", "Scheduled"].map((f) => (
                    <button
                      key={f}
                      aria-pressed={filter === f}
                      onClick={() => setFilter(f)}
                    >
                      {f} (
                      {f === "All"
                        ? campaign.items.length
                        : campaign.items.filter((i) => i.status === f).length}
                      )
                    </button>
                  ))}
                </div>
              </div>
              <PostCards items={items} data={data} recent detail />
            </section>
          )}
          {tab === "schedule" && (
            <section className="ps-client-panel">
              <h2>Campaign Schedule</h2>
              <div className="ps-schedule-list">
                {campaign.items.map((i) => (
                  <ContentDialog key={i.id} item={i} demo={data.demo}>
                    <CalendarDays size={18} />
                    <strong>{dateLabel(i.date)}</strong>
                    <span>{i.time}</span>
                    <span>{i.title}</span>
                    <span
                      className={`ps-status ps-status-${i.status.toLowerCase().replaceAll(" ", "-")}`}
                    >
                      {i.status}
                    </span>
                  </ContentDialog>
                ))}
              </div>
            </section>
          )}
          {tab === "results" && (
            <section className="ps-client-panel">
              <Results data={data} />
            </section>
          )}
        </div>
        <aside>
          <section className="ps-client-panel ps-campaign-status">
            <h2>
              <Sparkles />
              Campaign Status
            </h2>
            <span className="ps-status ps-status-published">
              ● {campaign.status}
            </span>
            <p>
              {dateLabel(campaign.start)} – {dateLabel(campaign.end)}
            </p>
            <div className="ps-client-note">
              <Sparkles />
              <p>
                {data.demo
                  ? "Everything is on track! We’re following the plan and will continue to publish new content each week."
                  : "Your publishing progress is shown from your saved content."}
              </p>
            </div>
          </section>
          <section className="ps-client-panel ps-distribution">
            <h2>
              <Layers />
              Platform Distribution
            </h2>
            {[...new Set(campaign.items.map((x) => x.platform))].map((p) => (
              <div key={p}>
                <Platform name={p} />
                <strong>
                  {campaign.items.filter((i) => i.platform === p).length}
                </strong>
                <span>posts</span>
              </div>
            ))}
          </section>
          <section className="ps-client-panel">
            <Results data={data} />
          </section>
          <section className="ps-client-panel ps-team-notes">
            <h2>
              <FileText />
              Notes from Our Team
            </h2>
            {data.demo ? (
              <>
                <small>Mar 15, 2026</small>
                <p>
                  This month’s content is performing really well! The client
                  transformation post received strong engagement. We’ll continue
                  with more before & after content next month.
                </p>
                <small>Mar 8, 2026</small>
                <p>
                  Great feedback on the skincare tips post! We’re seeing
                  increased interest in the spring facial.
                </p>
              </>
            ) : (
              <p>No team notes have been added yet.</p>
            )}
          </section>
        </aside>
      </div>
      <section className="ps-feedback">
        <Sparkles />
        <div>
          <h2>Have any feedback?</h2>
          <p>
            We’re always happy to hear from you. If you have any feedback or
            special requests,
            <br />
            just let us know and we’ll take care of it.
          </p>
        </div>
        <FeedbackDialog demo={data.demo} subject={campaign.name} />
      </section>
      <dialog className="ps-dialog" ref={planRef}>
        <button
          className="ps-modal-close"
          aria-label="Close original plan"
          onClick={() => planRef.current?.close()}
        >
          <X />
        </button>
        <h2>{campaign.name}</h2>
        <p>{campaign.description}</p>
        <h3>Campaign Goal</h3>
        <p>
          {campaign.goal ||
            "Your campaign plan is based on the content brief above."}
        </p>
        <p>
          {dateLabel(campaign.start)} – {dateLabel(campaign.end)}
        </p>
      </dialog>
    </CustomerFrame>
  );
}
function Results({ data }: { data: AgencyData }) {
  return (
    <div className="ps-results">
      <h2>
        <ChartIcon />
        Campaign Results
      </h2>
      <p>
        {data.demo
          ? "Mar 1, 2026 – Mar 28, 2026"
          : "Connected account analytics"}
      </p>
      {[
        ["Reach", "48K", Eye],
        ["Engagement", "2.8K", Heart],
        ["Profile Visits", "620", LinkIcon],
      ].map(([t, n, Icon]) => {
        const I = Icon as typeof Eye;
        return (
          <div key={String(t)}>
            <span className="ps-icon">
              <I />
            </span>
            <span>
              <strong>{data.demo ? String(n) : "—"}</strong>
              <small>{String(t)}</small>
            </span>
          </div>
        );
      })}
      <p className="ps-results-note">
        {data.demo
          ? "Illustrative results from the supplied reference. These are not live account metrics."
          : "Live social analytics have not been connected. Publishing counts are available above."}
      </p>
    </div>
  );
}
function ChartIcon() {
  return <span className="ps-chart-icon">▥</span>;
}
const calendarTitles = [
  "Skincare Routine for Healthy Skin",
  "A Relaxing Day at Our Beauty Studio",
  "3 Skincare Tips You Need to Know",
  "New Product Launch",
  "Behind the Scenes at the Studio",
  "Client Testimonial",
  "Brand Message",
  "Studio Tour",
  "Meet Our Team",
  "Facial Treatment Process",
  "Product How-To",
  "Client Results",
  "Skincare Myths vs. Facts",
  "Studio Atmosphere",
  "Seasonal Skincare Tips",
  "Special Promotion",
  "Self-Care Sunday",
  "Q&A: Ask Us Anything",
  "Best Skincare Products",
];
function calendarDemoItems(): ContentItem[] {
  return calendarTitles.map((title, i) => ({
    id: `calendar-${i}`,
    title,
    image: `/visual/calendar-photo-${i + 1}.webp`,
    date: `2026-09-${String([1, 2, 4, 7, 8, 10, 11, 12, 14, 15, 17, 18, 21, 23, 24, 25, 28, 29, 30][i]).padStart(2, "0")}`,
    time: ["10:00 AM", "2:00 PM", "11:00 AM", "9:00 AM", "6:00 PM"][i % 5],
    platform: ["instagram", "facebook", "tiktok"][i % 3],
    category: [
      "Education",
      "Lifestyle",
      "Education",
      "Promotion",
      "Behind the Scenes",
      "Social Proof",
      "Brand",
      "Lifestyle",
      "Behind the Scenes",
      "Education",
      "Education",
      "Social Proof",
      "Education",
      "Lifestyle",
      "Education",
      "Promotion",
      "Lifestyle",
      "Engagement",
      "Product",
    ][i],
    status: i < 14 ? "Published" : "Scheduled",
  }));
}
function calendarUpcoming(data: AgencyData): ContentItem[] {
  if (!data.demo) return upcoming(data);
  return [
    "Self-Care Sunday",
    "Q&A: Ask Us Anything",
    "Best Skincare Products",
    "Client Testimonial",
  ].map((title, i) => ({
    ...data.items[i],
    id: `calendar-upcoming-${i}`,
    title,
    image: `/visual/calendar-upcoming-${i + 1}.webp`,
    date: ["2026-09-29", "2026-09-30", "2026-10-02", "2026-10-04"][i],
    time: ["10:00 AM", "2:00 PM", "6:00 PM", "9:00 AM"][i],
    platform: ["instagram", "facebook", "tiktok", "instagram"][i],
    status: "Scheduled",
  }));
}
export function CalendarPage({ data }: { data: AgencyData }) {
  const base = data.demo ? "2026-09" : new Date().toISOString().slice(0, 7);
  const [month, setMonth] = useState(base);
  const [platform, setPlatform] = useState("all");
  const [view, setView] = useState("month");
  const now = new Date(month + "-01T12:00:00Z");
  const days = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0),
  ).getUTCDate();
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
  ).getUTCDay();
  const all = useMemo(
    () => (data.demo ? calendarDemoItems() : data.items),
    [data],
  );
  const items = all.filter(
    (i) =>
      i.date.startsWith(month) &&
      (platform === "all" || i.platform === platform),
  );
  function shift(delta: number) {
    const d = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + delta, 1),
    );
    setMonth(d.toISOString().slice(0, 7));
  }
  const monthLabel = now.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  return (
    <CustomerFrame data={data} page="calendar">
      <Heading
        title="Marketing Calendar"
        body={`Your content plan for ${monthLabel}`}
      >
        <div className="ps-month-switch">
          <CalendarDays />
          <strong>{monthLabel}</strong>
          <button aria-label="Previous month" onClick={() => shift(-1)}>
            <ChevronLeft />
          </button>
          <button aria-label="Next month" onClick={() => shift(1)}>
            <ChevronRight />
          </button>
        </div>
      </Heading>
      <div className="ps-calendar-columns">
        <div>
          <div className="ps-calendar-stats">
            <Stats items={items} full />
            <div className="ps-stat-platforms">
              <span className="ps-icon ps-tone-4">
                <Layers />
              </span>
              <div>
                <strong>{new Set(items.map((i) => i.platform)).size}</strong>
                <span>Platforms</span>
                <Platforms names={[...new Set(items.map((i) => i.platform))]} />
              </div>
            </div>
          </div>
          <section className="ps-client-panel ps-live-calendar">
            <div className="ps-calendar-controls">
              <select
                aria-label="Filter calendar by platform"
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
              >
                <option value="all">All Platforms</option>
                {["instagram", "facebook", "tiktok"].map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              <div className="ps-filter">
                <button
                  aria-pressed={view === "month"}
                  onClick={() => setView("month")}
                >
                  Month
                </button>
                <button
                  aria-pressed={view === "list"}
                  onClick={() => setView("list")}
                >
                  List
                </button>
              </div>
            </div>
            {view === "month" ? (
              <>
                <div className="ps-live-days">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                    (d) => (
                      <span key={d}>{d}</span>
                    ),
                  )}
                </div>
                <div className="ps-live-cells">
                  {Array.from(
                    { length: Math.ceil((start + days) / 7) * 7 },
                    (_, i) => {
                      const n = i - start + 1;
                      const key = `${month}-${String(n).padStart(2, "0")}`;
                      const posts = items.filter((item) => item.date === key);
                      const valid = n >= 1 && n <= days;
                      return (
                        <div key={i} className={valid ? "" : "ps-muted-day"}>
                          <strong>
                            {valid
                              ? n
                              : n < 1
                                ? new Date(
                                    Date.UTC(
                                      now.getUTCFullYear(),
                                      now.getUTCMonth(),
                                      0,
                                    ),
                                  ).getUTCDate() + n
                                : n - days}
                          </strong>
                          {posts.map((post) => (
                            <div className="ps-calendar-content" key={post.id}>
                              <ContentDialog item={post} demo={data.demo}>
                                <div>
                                  <Platform name={post.platform} size={18} />
                                  <span>{post.time}</span>
                                </div>
                                <Photo src={post.image} alt={post.title} />
                                <p>{post.title}</p>
                                <span
                                  className={`ps-category ps-category-${calendarTitles.indexOf(post.title) % 4}`}
                                >
                                  {post.category}
                                </span>
                              </ContentDialog>
                            </div>
                          ))}
                        </div>
                      );
                    },
                  )}
                </div>
              </>
            ) : (
              <div className="ps-calendar-list">
                {items.length ? (
                  items.map((i) => (
                    <ContentDialog key={i.id} item={i} demo={data.demo}>
                      <Photo src={i.image} />
                      <div>
                        <strong>{i.title}</strong>
                        <p>
                          {dateLabel(i.date)} · {i.time}
                        </p>
                        <span className="ps-status ps-status-published">
                          {i.status}
                        </span>
                      </div>
                      <Platform name={i.platform} />
                    </ContentDialog>
                  ))
                ) : (
                  <Empty title="No content scheduled this month" />
                )}
              </div>
            )}
            <div className="ps-mobile-calendar-list">
              <h3>Monthly Schedule</h3>
              {items.length ? (
                items.map((i) => (
                  <ContentDialog key={i.id} item={i} demo={data.demo}>
                    <Photo src={i.image} />
                    <div>
                      <strong>{i.title}</strong>
                      <p>
                        {dateLabel(i.date)} · {i.time}
                      </p>
                    </div>
                    <Platform name={i.platform} />
                  </ContentDialog>
                ))
              ) : (
                <Empty title="No content scheduled this month" />
              )}
            </div>
          </section>
        </div>
        <aside>
          <section className="ps-client-panel ps-upcoming-list">
            <div className="ps-panel-heading">
              <h2>Upcoming Posts</h2>
              <button className="ps-text-link" onClick={() => setView("list")}>
                View All →
              </button>
            </div>
            {calendarUpcoming(data).map((item) => (
              <ContentDialog item={item} demo={data.demo} key={item.id}>
                <Photo src={item.image} />
                <div>
                  <div>
                    <Platform name={item.platform} />
                    <small>
                      {dateLabel(item.date)} &nbsp;{item.time}
                    </small>
                  </div>
                  <strong>{item.title}</strong>
                </div>
              </ContentDialog>
            ))}
          </section>
          <section className="ps-client-panel ps-strategy-mix">
            <h2>Content Strategy Mix</h2>
            <div>
              <div
                className="ps-donut"
                style={!data.demo ? { background: "#eef1f7" } : undefined}
              >
                <span>
                  <strong>{items.length}</strong>
                  <small>Total Pieces</small>
                </span>
              </div>
              <ul>
                {data.demo
                  ? [
                      "40% Services",
                      "25% Education",
                      "20% Social Proof",
                      "15% Promotion",
                    ].map((s, i) => (
                      <li key={s}>
                        <i className={`ps-dot ps-tone-${i}`} />
                        {s}
                      </li>
                    ))
                  : [...new Set(items.map((i) => i.category))].map((s) => (
                      <li key={s}>{s}</li>
                    ))}
              </ul>
            </div>
          </section>
          <section className="ps-client-panel ps-calendar-platforms">
            <div className="ps-panel-heading">
              <h2>Platforms</h2>
              <small>
                {new Set(items.map((i) => i.platform)).size} platforms this
                month
              </small>
            </div>
            {[...new Set(items.map((i) => i.platform))].map((p, i) => {
              const n = items.filter((j) => j.platform === p).length;
              return (
                <div key={p}>
                  <Platform name={p} />
                  <span>
                    <i
                      style={{
                        width: `${items.length ? (n / items.length) * 100 : 0}%`,
                        background: ["#ff0086", "#0087ff", "#080b13"][i % 3],
                      }}
                    />
                  </span>
                  <small>{n} posts</small>
                </div>
              );
            })}
          </section>
          <FocusPanel data={data} />
        </aside>
      </div>
    </CustomerFrame>
  );
}
export function BrandPage({ data }: { data: AgencyData }) {
  const profile = data.profile;
  return (
    <CustomerFrame data={data} page="brand">
      <Heading
        title="My Brand"
        body="This is the information we use to create content for your business."
        note="Keep your brand information up to date so we can create content that truly represents your business."
      />
      <div className="ps-brand-top">
        <section className="ps-client-panel">
          <div className="ps-panel-heading">
            <h2>Business Information</h2>
            <BrandEditor data={data} />
          </div>
          <div className="ps-business-information">
            <Photo
              name={data.demo ? "studio" : undefined}
              src={!data.demo ? profile?.logoUrl : undefined}
            />
            <div>
              {[
                [Store, profile?.shopName ?? data.shop],
                [
                  Users,
                  data.demo
                    ? "Beauty & Wellness"
                    : (profile?.industry?.replaceAll("_", " ") ??
                      "Industry not provided"),
                ],
                [MapPin, profile?.address ?? "Location not provided"],
                [
                  LinkIcon,
                  data.demo ? "www.beautystudio.com" : "Website not provided",
                ],
                [Phone, profile?.phone ?? "Phone not provided"],
                [
                  Clock,
                  data.demo
                    ? "Mon – Sat 9:00 AM – 7:00 PM"
                    : "Business hours not provided",
                ],
              ].map(([Icon, text], i) => {
                const I = Icon as typeof Store;
                return (
                  <p key={i}>
                    <I size={16} />
                    {String(text)}
                  </p>
                );
              })}
              {data.demo && (
                <button
                  className="ps-text-link"
                  onClick={() =>
                    document
                      .getElementById("brand-services")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                >
                  <CalendarDays size={16} />
                  Book an Appointment
                </button>
              )}
            </div>
          </div>
        </section>
        <section className="ps-client-panel ps-brand-about">
          <div className="ps-panel-heading">
            <h2>About Your Brand</h2>
            <BrandEditor data={data} />
          </div>
          <p>
            {profile?.activity ||
              "Tell us about your business so we can create content that represents you."}
          </p>
          <h3>Brand Personality</h3>
          <div>
            {(data.demo
              ? [
                  "Friendly",
                  "Professional",
                  "Caring",
                  "Trustworthy",
                  "Modern",
                  "Beauty & Wellness",
                ]
              : [profile?.slogan || "Add your brand story"]
            ).map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>
        </section>
      </div>
      <div className="ps-brand-identity-row">
        <section className="ps-client-panel ps-brand-identity">
          <div className="ps-panel-heading">
            <h2>Brand Identity</h2>
            <BrandEditor data={data} />
          </div>
          <div>
            <div className="ps-studio-logo">
              {data.demo ? (
                <>
                  <span>✿</span>
                  <strong>Sophie Chen</strong>
                  <p>Beauty Studio</p>
                </>
              ) : (
                <>
                  <Photo src={profile?.logoUrl} />
                  <strong>{data.shop}</strong>
                </>
              )}
            </div>
            <div>
              <h3>Brand Colors</h3>
              {data.demo ? (
                <div className="ps-color-palette">
                  {["#FF2B8A", "#FFE4EF", "#FFC9B8", "#1F2A5A", "#F5F7FB"].map(
                    (c, i) => (
                      <div key={c}>
                        <i style={{ background: c }} />
                        <small>{c}</small>
                        <small>
                          {
                            [
                              "Primary",
                              "Secondary",
                              "Accent",
                              "Text",
                              "Background",
                            ][i]
                          }
                        </small>
                      </div>
                    ),
                  )}
                </div>
              ) : (
                <p>Your team will confirm your brand palette.</p>
              )}
            </div>
          </div>
        </section>
        <Photo
          name={data.demo ? "treatment" : undefined}
          src={!data.demo ? profile?.logoUrl : undefined}
        />
      </div>
      <section className="ps-client-panel" id="brand-services">
        <div className="ps-panel-heading">
          <div>
            <h2>Services</h2>
            <p>
              These are your main services. We use this information to create
              relevant content.
            </p>
          </div>
          <BrandEditor data={data} />
        </div>
        <div className="ps-brand-services">
          {data.demo ? (
            [
              "Facial Treatment",
              "Brow Design",
              "Lash Extensions",
              "Skin Consultation",
            ].map((s, i) => (
              <article key={s}>
                <Photo name={`service-${i + 1}`} />
                <h3>{s}</h3>
                <p>
                  {
                    [
                      "Customized facials for every skin type.",
                      "Shape and enhance your natural brows.",
                      "Natural and long-lasting lash extensions.",
                      "Professional analysis and personalized advice.",
                    ][i]
                  }
                </p>
              </article>
            ))
          ) : (
            <Empty
              title="Add your services"
              body="Use your brand description to tell your team what you offer."
            />
          )}
          <div className="ps-add-tile">
            <PlusCircle />
            <BrandEditor data={data}>Add Service</BrandEditor>
          </div>
        </div>
      </section>
      <section className="ps-client-panel">
        <div className="ps-panel-heading">
          <div>
            <h2>Current Promotions</h2>
            <p>
              Active promotions and special offers that we’re featuring in your
              content.
            </p>
          </div>
          <BrandEditor data={data} />
        </div>
        <div className="ps-brand-promotions">
          {data.demo ? (
            [
              "Spring Facial Special",
              "New Product Launch",
              "Mother’s Day Special",
            ].map((s, i) => (
              <article key={s}>
                <Photo name={`promotion-${i + 1}`} />
                <h3>{s}</h3>
                <p>
                  {
                    [
                      "20% off select facial treatments.",
                      "Discover our new skincare collection.",
                      "Treat someone special to radiant skin.",
                    ][i]
                  }
                </p>
                <div>
                  <CalendarDays size={11} />
                  <small>
                    {
                      [
                        "Mar 1 – Mar 31, 2026",
                        "Mar 15 – Apr 15, 2026",
                        "Apr 20 – May 10, 2026",
                      ][i]
                    }
                  </small>
                  <span
                    className={`ps-status ps-status-${i < 2 ? "published" : "scheduled"}`}
                  >
                    {i < 2 ? "Active" : "Upcoming"}
                  </span>
                </div>
              </article>
            ))
          ) : (
            <Empty title="No promotions added" />
          )}
          <div className="ps-add-tile">
            <PlusCircle />
            <BrandEditor data={data}>Add Promotion</BrandEditor>
          </div>
        </div>
      </section>
      <section className="ps-client-panel">
        <div className="ps-panel-heading">
          <div>
            <h2>Brand Media</h2>
            <p>
              Photos of your studio, team, services, products, and other assets.
              We use these to create authentic content.
            </p>
          </div>
          <BrandEditor data={data} />
        </div>
        <div className="ps-brand-media">
          {data.demo ? (
            [
              "Studio Interior",
              "Treatment Room",
              "Our Team",
              "Products",
              "Treatment Close-up",
              "Client Experience",
            ].map((s, i) => (
              <div key={s}>
                <Photo name={`media-${i + 1}`} />
                <small>{s}</small>
              </div>
            ))
          ) : profile?.logoUrl ? (
            <Photo src={profile.logoUrl} alt="Uploaded business logo" />
          ) : (
            <Empty title="No brand media uploaded" />
          )}
          <div className="ps-add-tile">
            <PlusCircle />
            <BrandEditor data={data}>Upload Photos</BrandEditor>
          </div>
        </div>
      </section>
      <section className="ps-client-panel" id="connections">
        <div className="ps-panel-heading">
          <div>
            <h2>Connected Social Accounts</h2>
            <p>
              These are the social media accounts we use to publish content for
              you.
            </p>
          </div>
          <Link
            className="ps-small-button"
            href={
              data.demo ? "/demo/my-brand#connections" : "/profile#connections"
            }
          >
            <LinkIcon size={14} />
            Manage Connections
          </Link>
        </div>
        {data.demo ? (
          <div className="ps-brand-connections">
            {data.accounts.map((a) => (
              <div key={a.platform}>
                <Platform name={a.platform} size={30} />
                <div>
                  <h3>{a.platform[0].toUpperCase() + a.platform.slice(1)}</h3>
                  <p>{a.handle}</p>
                  <span className="ps-status ps-status-published">
                    Connected
                  </span>
                </div>
              </div>
            ))}
            <div className="ps-add-tile">
              <PlusCircle />
              <span>Demo connections</span>
            </div>
          </div>
        ) : (
          <SocialAccountsPanel
            accounts={data.accounts
              .filter((a) => a.connected)
              .map((a) => ({ platform: a.platform, handle: a.handle }))}
          />
        )}
      </section>
    </CustomerFrame>
  );
}
