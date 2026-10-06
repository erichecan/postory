import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Camera,
  ChartNoAxesColumnIncreasing,
  Check,
  Clock,
  FileText,
  Heart,
  House,
  Image as ImageIcon,
  Leaf,
  Mail,
  MessageCircle,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  Utensils,
  Wrench,
  Dumbbell,
  ShoppingBag,
  BriefcaseBusiness,
  Gem,
  Handshake,
  Bot,
  PawPrint,
  Car,
  GraduationCap,
  Scissors,
  Ellipsis,
} from "lucide-react";
import {
  CTA,
  Checks,
  MonthPlan,
  Photo,
  Platform,
  PostMockup,
  SectionTitle,
  Tag,
} from "./primitives";
import { DemoGallery, SampleCalendar } from "./public-interactions";
import { VisualFooter, VisualHeader } from "./shell";
import { AssessmentForm, ContactDialog } from "./forms";
import type { ReactNode } from "react";
import { Logo } from "@/components/brand/logo";
const industries = [
  {
    key: "restaurant",
    title: "Restaurant & Food",
    body: "Promotions, signature dishes, behind-the-scenes, customer favourites and local engagement.",
    icon: Utensils,
  },
  {
    key: "beauty",
    title: "Beauty & Wellness",
    body: "Services, transformations, promotions, education and appointment-focused content.",
    icon: Leaf,
  },
  {
    key: "contractor",
    title: "Home Services & Contractors",
    body: "Completed projects, before-and-afters, services, seasonal tips and local awareness.",
    icon: House,
  },
];
export function PublicFrame({
  children,
  className = "",
  footer = true,
}: {
  children: ReactNode;
  className?: string;
  footer?: boolean;
}) {
  return (
    <div className={`ps ps-public ${className}`}>
      <VisualHeader />
      {children}
      {footer && <VisualFooter />}
    </div>
  );
}
export function HeroCollage({
  industry = "beauty",
  assessment = false,
}: {
  industry?: string;
  assessment?: boolean;
}) {
  if (assessment)
    return (
      <div className="ps-assessment-collage">
        {["beauty-1", "restaurant-3", "contractor-2", "business-owner"].map(
          (n, i) => (
            <Photo
              key={n}
              name={n}
              className={`ps-collage-photo ps-collage-photo-${i}`}
              alt={
                [
                  "Beauty treatment",
                  "Restaurant kitchen",
                  "Home contractor",
                  "Local business owner",
                ][i]
              }
            />
          ),
        )}
      </div>
    );
  return (
    <div className="ps-hero-collage">
      <PostMockup
        image={industry + "-hero"}
        className="ps-hero-main-post"
        caption={
          industry === "beauty"
            ? "Radiant Skin This Spring"
            : "Made for your business."
        }
      />
      <div className="ps-hero-small-posts">
        <PostMockup
          image={industry + "-hero-small-a"}
          platform="tiktok"
          caption="A look behind the scenes"
        />
        <PostMockup
          image={industry + "-hero-small-b"}
          platform="facebook"
          caption="Your story. Your community."
        />
      </div>
      <MonthPlan />
      <span className="ps-hero-rays" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
    </div>
  );
}
export function OwnerHero({
  tag,
  title,
  body,
  features = false,
}: {
  tag: string;
  title: ReactNode;
  body: string;
  features?: boolean;
}) {
  return (
    <section className="ps-owner-hero">
      <div className="ps-owner-copy">
        <span className="ps-kicker">{tag}</span>
        <h1>{title}</h1>
        <p>{body}</p>
        <div className="ps-actions">
          <CTA>Get Started</CTA>
          {features && (
            <Link href="/how-it-works" className="ps-text-link">
              See How It Works <ArrowRight size={15} />
            </Link>
          )}
        </div>
        {features && (
          <div className="ps-service-hero-features">
            {[
              [Users, "Strategy & Content", "by Experts"],
              [Bot, "Powered by AI", "for Better Results"],
              [
                ChartNoAxesColumnIncreasing,
                "Done for You",
                "Consistent & Professional",
              ],
            ].map(([Icon, a, b], i) => {
              const I = Icon as typeof Users;
              return (
                <div key={i}>
                  <span className="ps-icon">
                    <I />
                  </span>
                  <span>
                    {String(a)}
                    <br />
                    {String(b)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <div className="ps-owner-visual">
        <Photo
          name="hero-owner"
          alt="Local business owner checking her phone"
        />
        <PostMockup
          image="beauty-6"
          className="ps-owner-post-a"
          caption="Self-Care Looks Good On You"
        />
        <PostMockup
          image="beauty-3"
          platform="facebook"
          className="ps-owner-post-b"
          caption="Relax. Refresh. Glow."
        />
        <PostMockup
          image="beauty-5"
          platform="tiktok"
          className="ps-owner-post-c"
          caption="3 Skincare Tips You Need to Know"
        />
        <div className="ps-followers">
          Followers <strong>+28% ↗</strong>
          <small>Illustrative demo</small>
        </div>
      </div>
    </section>
  );
}
const steps = [
  {
    title: "Learn About Your Business",
    body: "We get to know your goals, customers, services, and what makes your business unique.",
    icon: MessageCircle,
    image: "consultation",
  },
  {
    title: "Create a Custom Plan",
    body: "We build a content strategy tailored to your business, industry, seasonal opportunities, and local audience.",
    icon: FileText,
    image: "content-plan",
  },
  {
    title: "Produce Engaging Content",
    body: "Our team creates high-quality photos, videos, and designs that bring your brand to life and attract your ideal customers.",
    icon: ImageIcon,
    image: "camera",
  },
  {
    title: "Publish & Manage",
    body: "We schedule and publish everything across your social media accounts at the best times.",
    icon: Send,
    image: "publish-photo",
  },
  {
    title: "Monitor & Improve",
    body: "We track performance, learn what works, and continuously adjust the strategy to help you grow.",
    icon: ChartNoAxesColumnIncreasing,
    image: "chart-photo",
  },
];
export function Steps({
  photos = false,
  compact = false,
}: {
  photos?: boolean;
  compact?: boolean;
}) {
  const compactTitles = [
    "Learn About Your Business",
    "Create Your Marketing Plan",
    "Produce Your Content",
    "Review (When You Want)",
    "We Publish & Optimize",
  ];
  const compactBodies = [
    "We understand your services, customers and goals.",
    "We build a monthly content plan with campaigns and themes.",
    "We create branded graphics, videos and captions.",
    "You can review and request changes, or let us handle it all.",
    "We schedule, publish and keep improving based on results.",
  ];
  return (
    <div
      className={`ps-steps ${photos ? "ps-steps-photos" : ""} ${compact ? "ps-steps-compact" : ""}`}
    >
      {steps.map((s, i) => (
        <article key={s.title}>
          <span className={`ps-step-number ps-tone-${i}`}>{i + 1}</span>
          <span className={`ps-icon ps-tone-${i}`}>
            <s.icon />
          </span>
          <h3>{compact ? compactTitles[i] : s.title}</h3>
          <p>{compact ? compactBodies[i] : s.body}</p>
          {photos && <Photo name={s.image} alt={s.title} />}
        </article>
      ))}
    </div>
  );
}
export function BottomCTA({
  title = "Let’s create social media that brings you real results.",
  blue = false,
}: {
  title?: string;
  blue?: boolean;
}) {
  return (
    <section className={`ps-bottom-cta ${blue ? "ps-blue" : ""}`}>
      <div>
        <span className="ps-kicker">READY TO GROW YOUR BUSINESS?</span>
        <h2>{title}</h2>
        {blue && (
          <p>
            Tell us a bit about your business and we’ll take care of the rest.
          </p>
        )}
      </div>
      <div>
        <CTA>Get Started</CTA>
        <p>
          Tell us about your business and we’ll
          <br />
          create a custom plan for you.
        </p>
      </div>
      <div className="ps-bottom-posts">
        <PostMockup image="beauty-6" caption="Healthy Skin Happier You" />
        <PostMockup
          image="beauty-3"
          platform="facebook"
          caption="Our beauty studio"
        />
        <PostMockup image="beauty-7" platform="tiktok" caption="Book now" />
      </div>
    </section>
  );
}
export function FAQs({ assessment = false }: { assessment?: boolean }) {
  const q = assessment
    ? [
        [
          "How long does it take to receive my plan?",
          "We usually get back to you within 1–2 business days.",
        ],
        [
          "Is the assessment really free?",
          "Yes. The assessment is completely free and there is no obligation.",
        ],
        [
          "Do I need to have existing social media accounts?",
          "No. You can share your existing accounts if you have them, or we can make recommendations.",
        ],
        [
          "Can you help with content creation and posting?",
          "Yes. If you decide to move forward, we can handle the content creation and posting for you.",
        ],
      ]
    : [
        [
          "What’s included in the service?",
          "Strategy, content creation, scheduling, publishing, and ongoing management.",
        ],
        [
          "Do I need to approve the content?",
          "You can review your campaign and share feedback when needed.",
        ],
        [
          "Which platforms do you manage?",
          "We plan content for the platforms that fit your business and your audience.",
        ],
        [
          "How much does it cost?",
          "Book a free assessment to discuss a plan for your business.",
        ],
        [
          "What types of businesses do you work with?",
          "We work with local businesses across beauty, food, home services, and more.",
        ],
        [
          "What happens after I book an assessment?",
          "We review your business and get back to you with a customized plan.",
        ],
        [
          "How long does it take to get started?",
          "We’ll discuss next steps after reviewing your business.",
        ],
        [
          "Can I pause or cancel?",
          "Contact your PoStory team to discuss your plan.",
        ],
      ];
  return (
    <div className={`ps-faqs ${assessment ? "ps-faqs-assessment" : ""}`}>
      {q.map(([a, b]) => (
        <details key={a} open={assessment}>
          <summary>
            {a}
            <span>+</span>
          </summary>
          <p>{b}</p>
        </details>
      ))}
    </div>
  );
}
export function HomePage() {
  return (
    <PublicFrame className="ps-home" footer>
      <section className="ps-home-hero">
        <div>
          <Tag>SOCIAL MEDIA MANAGEMENT FOR SMALL BUSINESSES</Tag>
          <h1>
            You Run Your Business.
            <br />
            <span className="ps-gradient-text">We Run Your Social Media.</span>
          </h1>
          <p>
            Consistent, professional social media content —<br />
            planned, created, approved and published for you.
          </p>
          <Checks
            items={[
              "No chasing trends.",
              "No wondering what to post.",
              "No spending your evenings making graphics.",
            ]}
          />
          <div className="ps-actions">
            <CTA />
            <CTA href="/our-work" secondary>
              See Our Work
            </CTA>
          </div>
        </div>
        <HeroCollage />
      </section>
      <section className="ps-platform-strip">
        <small>SOCIAL MEDIA MANAGEMENT ACROSS THE PLATFORMS THAT MATTER</small>
        <div>
          {[
            "instagram",
            "facebook",
            "tiktok",
            "rednote",
            "linkedin",
            "youtube",
            "pinterest",
          ].map((n) => (
            <div key={n}>
              <Platform name={n} size={27} />
              <span>
                {n === "rednote"
                  ? "RedNote"
                  : n === "tiktok"
                    ? "TikTok"
                    : n[0].toUpperCase() + n.slice(1)}
              </span>
            </div>
          ))}
        </div>
      </section>
      <section className="ps-home-problem ps-container">
        <Photo name="owner-wide" alt="A busy local business owner" />
        <div>
          <Tag>THE PROBLEM</Tag>
          <h2>
            Your Business Is Busy.
            <br />
            Your Social Media Shouldn’t Be Another Job.
          </h2>
          <p>
            You already have enough to manage. But social media still needs to
            be updated consistently. You know you should post more. You know
            your competitors are posting.
            <br />
            You just don’t have the time — or a dedicated person to do it.
          </p>
          <strong>That’s where we come in.</strong>
        </div>
      </section>
      <section className="ps-business-flow ps-container">
        <div>
          <Tag>FROM YOUR BUSINESS TO SOCIAL MEDIA</Tag>
          <h2>
            You Focus on Your Business.
            <br />
            We Turn It Into Content.
          </h2>
          <p>
            You give us your business. We turn it into a steady stream of social
            media content that attracts, engages and brings in more customers.
          </p>
        </div>
        <div className="ps-flow-card">
          <h3>YOUR BUSINESS</h3>
          <Checks
            items={[
              "Your services",
              "Your promotions",
              "Real customer photos",
              "Your team",
              "What’s happening each season",
            ]}
          />
        </div>
        <ArrowRight className="ps-flow-arrow" />
        <div className="ps-flow-card ps-flow-brand">
          <div className="ps-flow-logo">
            <Logo href="/" />
          </div>
          <p>
            Strategy
            <br />+<br />
            Content Creation
            <br />+<br />
            Publishing
            <br />+<br />
            Ongoing Optimization
          </p>
        </div>
        <ArrowRight className="ps-flow-arrow" />
        <div className="ps-flow-card">
          <h3>YOUR SOCIAL MEDIA</h3>
          <Checks
            items={[
              "Branded posts",
              "Short videos",
              "Customer stories",
              "Educational content",
              "Promotional campaigns",
              "Scheduled & published",
            ]}
          />
        </div>
      </section>
      <section className="ps-home-work ps-container">
        <SectionTitle
          tag="SEE OUR WORK"
          title={
            <>
              Different Businesses.
              <br />
              Real Results.
            </>
          }
          body="Here’s how we create social media content for local businesses like yours."
          action={
            <Link href="/our-work" className="ps-text-link">
              View All Demos →
            </Link>
          }
        />
        <div className="ps-home-industry-cards">
          {industries.map((s) => (
            <article key={s.key}>
              <div className="ps-home-card-collage">
                {[1, 2, 3].map((i) => (
                  <Photo name={`work-${s.key}-${i}`} key={i} />
                ))}
                <Platform name="instagram" />
              </div>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
              <Link href={`/our-work/${s.key}`} className="ps-text-link">
                View {s.key[0].toUpperCase() + s.key.slice(1)} Demo →
              </Link>
            </article>
          ))}
        </div>
      </section>
      <section className="ps-home-calendar">
        <SampleCalendar compact />
        <div>
          <Tag>MARKETING CALENDAR</Tag>
          <h2>
            A Complete Month
            <br />
            of Social Media.
          </h2>
          <p>
            We plan your content by campaign and theme, so your social media is
            consistent, strategic and always relevant to your business.
          </p>
          <Checks
            items={[
              "Campaign-based content planning",
              "Platform-specific content",
              "Visual calendar with all posts",
              "Seasonal and promotional content",
              "Scheduled and published for you",
            ]}
          />
          <CTA href="/our-work/beauty#calendar">See a Sample Calendar</CTA>
        </div>
      </section>
      <section className="ps-home-process ps-container">
        <SectionTitle
          tag="HOW IT WORKS"
          title={
            <>
              A Simple Process.
              <br />
              Real Results.
            </>
          }
          body="We make social media marketing easy for busy business owners."
        />
        <Steps compact />
      </section>
      <section className="ps-home-testimonial ps-container">
        <Photo name="testimonial" />
        <div>
          <span className="ps-quote">“</span>
          <p>
            PoStory has completely taken social media off my plate. The content
            looks amazing, and we’re seeing more appointments from Instagram.
          </p>
          <small>Reference testimonial · illustrative example</small>
        </div>
        <div className="ps-example-stats">
          {[
            ["3×", "More inquiries"],
            ["40%", "Increase in bookings"],
            ["12", "Consistent posts every month"],
          ].map(([v, t]) => (
            <div key={t}>
              <strong>{v}</strong>
              <small>{t}</small>
            </div>
          ))}
        </div>
      </section>
      <section className="ps-home-faq ps-container">
        <SectionTitle
          tag="FAQ"
          title="Common Questions"
          body="Here are some of the questions business owners ask us."
        />
        <FAQs />
      </section>
      <section className="ps-home-last">
        <div>
          <h2>Let’s Grow Your Business on Social Media.</h2>
          <p>
            Book a free assessment and see how PoStory can help your business.
          </p>
        </div>
        <CTA />
        <Link href="/our-work">Or See Our Work →</Link>
      </section>
    </PublicFrame>
  );
}
export function WorkPage() {
  return (
    <PublicFrame className="ps-work">
      <section className="ps-work-hero">
        <div>
          <Tag>OUR WORK</Tag>
          <h1>
            Real Businesses.
            <br />
            Real Social Media.
            <br />
            <span className="ps-gradient-text">Real Results.</span>
          </h1>
          <p>
            See how we create social media content for local businesses
            <br />
            and help them attract more customers.
          </p>
        </div>
        <div className="ps-work-collage">
          {["restaurant", "beauty", "contractor"].map((n, i) => (
            <PostMockup
              key={n}
              image={n + "-1"}
              platform={["rednote", "instagram", "tiktok"][i]}
              caption={
                [
                  "New Seasonal Menu!",
                  "Self Care Real Results",
                  "From Vision To Reality",
                ][i]
              }
            />
          ))}
          <MonthPlan />
        </div>
      </section>
      <section className="ps-work-industry">
        <SectionTitle
          tag="INDUSTRY DEMOS"
          title="See What PoStory Can Do for Your Business"
          body="Explore our demo marketing plans and content examples for different industries."
        />
        <div className="ps-work-cards">
          {industries.map((s) => (
            <article key={s.key}>
              <div className="ps-work-card-title">
                <span className={`ps-icon ps-${s.key}`}>
                  <s.icon />
                </span>
                <div>
                  <h3>{s.title}</h3>
                  <p>{s.body}</p>
                </div>
                <span className="ps-badge">12 Posts</span>
              </div>
              <div
                className={`ps-work-card-photos ps-work-card-photos-${s.key}`}
              >
                {Array.from(
                  { length: s.key === "restaurant" ? 7 : 6 },
                  (_, i) => i + 1,
                ).map((i) => (
                  <Photo
                    key={i}
                    name={`work-${s.key}-${i}`}
                    alt={`${s.title} content example`}
                  />
                ))}
              </div>
              <CTA href={`/our-work/${s.key}`} secondary>
                View {s.key[0].toUpperCase() + s.key.slice(1)} Demo
              </CTA>
            </article>
          ))}
        </div>
      </section>
      <section className="ps-work-calendar">
        <div>
          <Tag>MARKETING CALENDAR</Tag>
          <h2>
            A Complete Month
            <br />
            of Social Media.
          </h2>
          <p>
            We plan your content by campaign and theme, so your social media is
            consistent, strategic and always relevant to your business.
          </p>
          <CTA href="/our-work/beauty#calendar">See a Sample Calendar</CTA>
        </div>
        <SampleCalendar compact />
        <div className="ps-theme-list">
          {[
            "Spring Beauty Refresh",
            "Customer Stories",
            "Education & Tips",
            "Promotions",
          ].map((s, i) => (
            <div key={s}>
              <span className={`ps-dot ps-tone-${i}`} />
              {s}
              <small>{[5, 3, 2, 2][i]} posts</small>
            </div>
          ))}
        </div>
      </section>
    </PublicFrame>
  );
}
const demoConfig: Record<
  string,
  {
    title: string;
    body: string;
    strategy: string;
    strategyBody: string;
    weeks: string[];
    goals: string[];
    cta: string;
  }
> = {
  beauty: {
    title: "Beauty & Wellness",
    body: "See how we create a complete month of social media content for a beauty studio — from strategy to publishing.",
    strategy: "A Focused Plan for Real Results",
    strategyBody:
      "We build a monthly content plan around your business, services, promotions and seasonal opportunities.",
    weeks: [
      "Brand & Services",
      "Before & After",
      "Education & Tips",
      "Promotion & Engagement",
    ],
    goals: [
      "Increase appointment bookings",
      "Show real client transformations",
      "Promote spring special offers",
      "Build trust through education and tips",
    ],
    cta: "Ready to See This for Your Business?",
  },
  restaurant: {
    title: "Harbour Street Kitchen",
    body: "A complete monthly content plan for a local restaurant — from strategy to published posts.",
    strategy: "A Monthly Plan to Attract More Customers",
    strategyBody:
      "We create a content plan based on your restaurant’s menu, promotions, seasonal events and local audience, so your social media is consistent, relevant and effective.",
    weeks: ["Food Appeal", "Customer Story", "Promotion", "Local Engagement"],
    goals: [
      "Increase weekday visits",
      "Promote new spring menu items",
      "Show the dining experience and ambiance",
      "Build local community awareness",
    ],
    cta: "Ready to See Similar Results for Your Restaurant?",
  },
  contractor: {
    title: "Home Services & Contractors",
    body: "See how we create a complete month of social media content for home service businesses — from projects to promotions.",
    strategy: "A Monthly Plan to Build Trust and Generate Leads",
    strategyBody:
      "We create content that showcases your work, explains your services, shares helpful tips and highlights real customer results.",
    weeks: [
      "Completed Projects",
      "Services & Education",
      "Customer Story",
      "Promotion & Engagement",
    ],
    goals: [
      "Showcase completed projects",
      "Increase local awareness",
      "Generate inquiries and quotes",
      "Build trust through real customer stories",
    ],
    cta: "Ready to Grow Your Contracting Business?",
  },
};
const weeklyCopy: Record<string, string[][]> = {
  beauty: [
    [
      "Introduce your studio",
      "Highlight key services",
      "Show the team and space",
    ],
    ["Client transformations", "Build social proof", "Show real results"],
    [
      "Beauty tips and skincare",
      "Answer common questions",
      "Establish expertise",
    ],
    [
      "Spring special offer",
      "Encourage bookings",
      "Share client stories & reviews",
    ],
  ],
  restaurant: [
    ["Signature dishes", "Mouth-watering visuals", "Short-form cooking videos"],
    ["Real customer experiences", "Positive reviews", "Community engagement"],
    ["Spring menu special", "Weekday offers", "Limited time deals"],
    ["Behind-the-scenes", "Meet the team", "Seasonal and holiday content"],
  ],
  contractor: [
    [
      "Before & after photos",
      "Project highlights",
      "Short-form transformation video",
    ],
    ["Explain key services", "Tips and maintenance", "Answer common questions"],
    [
      "Real customer experience",
      "Review and testimonial",
      "Why they chose you",
    ],
    [
      "Seasonal offers",
      "Local community content",
      "Encourage inquiries and shares",
    ],
  ],
};
export function IndustryDemoPage({ industry }: { industry: string }) {
  const c = demoConfig[industry];
  return (
    <PublicFrame className={`ps-demo-page ps-demo-${industry}`}>
      <section className="ps-demo-hero">
        <div>
          <Tag>
            {industry === "beauty"
              ? "BEAUTY & WELLNESS"
              : industry.toUpperCase()}{" "}
            DEMO
          </Tag>
          <h1>
            {c.title}
            <br />
            <span className="ps-gradient-text">Social Media Demo</span>
          </h1>
          <p>{c.body}</p>
          <div className="ps-demo-numbers">
            <div>
              <CalendarDays />
              <span>
                <strong>12</strong>
                <small>Posts per month</small>
              </span>
            </div>
            <div>
              <Camera />
              <span>
                <strong>4</strong>
                <small>Short videos</small>
              </span>
            </div>
            <div>
              <ChartNoAxesColumnIncreasing />
              <span>
                <strong>Multi-platform</strong>
                <small>Instagram, Facebook, TikTok</small>
              </span>
            </div>
          </div>
          <div className="ps-actions">
            <CTA />
            <CTA secondary href="/our-work">
              See Other Demos
            </CTA>
          </div>
        </div>
        <HeroCollage industry={industry} />
      </section>
      <section className="ps-demo-strategy">
        <div className="ps-strategy-heading">
          <div>
            <Tag>THE STRATEGY</Tag>
            <h2>{c.strategy}</h2>
            <p>{c.strategyBody}</p>
          </div>
          <div className="ps-goals">
            <Target />
            <div>
              <h3>Goals for This Month</h3>
              <Checks items={c.goals} />
            </div>
          </div>
        </div>
        <div className="ps-week-cards">
          {c.weeks.map((w, i) => (
            <article key={w}>
              <span className={`ps-icon ps-tone-${i}`}>
                {i === 0 ? (
                  <Leaf />
                ) : i === 1 ? (
                  <Users />
                ) : i === 2 ? (
                  <ShieldCheck />
                ) : (
                  <CalendarDays />
                )}
              </span>
              <div>
                <small>WEEK {i + 1}</small>
                <h3>{w}</h3>
              </div>
              <Checks items={weeklyCopy[industry][i]} />
            </article>
          ))}
        </div>
      </section>
      <section className="ps-demo-content">
        <DemoGallery industry={industry} />
      </section>
      <section className="ps-demo-calendar" id="calendar">
        <div className="ps-strategy-heading">
          <SectionTitle
            tag="MARKETING CALENDAR"
            title="A Full Month at a Glance"
            body="We plan your content by campaign and theme, so your social media is consistent, strategic and always relevant to your business."
          />
          <div className="ps-calendar-legend">
            {c.weeks.map((w, i) => (
              <span key={w}>
                <i className={`ps-dot ps-tone-${i}`} />
                {w}
              </span>
            ))}
          </div>
        </div>
        <div className="ps-demo-calendar-row">
          <SampleCalendar industry={industry} />
          <article>
            <Photo name={`${industry}-cta`} />
            <h2>{c.cta}</h2>
            <p>
              Get a customized social media plan based on your business and
              goals.
            </p>
            <CTA />
          </article>
        </div>
      </section>
    </PublicFrame>
  );
}
const serviceCards = [
  {
    title: "Strategy & Planning",
    body: "We create a customized content strategy based on your business goals, seasonal opportunities, and local audience.",
    icon: Target,
    image: "content-plan",
  },
  {
    title: "Content Creation",
    body: "We produce high-quality photos, videos, and designs tailored to your brand and the platforms you use.",
    icon: ImageIcon,
    image: "camera",
  },
  {
    title: "Publishing & Management",
    body: "We handle scheduling and publishing across your social media accounts so everything goes live on time.",
    icon: CalendarDays,
    image: "publish-photo",
  },
  {
    title: "Performance Monitoring",
    body: "We keep an eye on how your content is performing and adjust the strategy to get better results over time.",
    icon: ChartNoAxesColumnIncreasing,
    image: "chart-photo",
  },
  {
    title: "Support & Updates",
    body: "We stay in touch, keep you updated, and make adjustments as your business evolves.",
    icon: Heart,
    image: "business-owner",
  },
];
export function ServicesPage() {
  return (
    <PublicFrame className="ps-services">
      <OwnerHero
        tag="OUR SERVICES"
        title={
          <>
            Fully Managed
            <br />
            Social Media
            <br />
            for Small Businesses
          </>
        }
        body="We create, publish, and manage your social media so you can focus on what you do best — running your business."
        features
      />
      <section className="ps-service-included">
        <div className="ps-two-heading">
          <SectionTitle
            tag="WHAT’S INCLUDED"
            title={
              <>
                A complete social media service,
                <br />
                designed for your business.
              </>
            }
          />
          <p>
            We handle the entire process, from strategy to publishing, creating
            content that attracts new customers and helps you grow —
            consistently and professionally.
          </p>
        </div>
        <div className="ps-service-cards">
          {serviceCards.map((s) => (
            <article key={s.title}>
              <span className="ps-icon">
                <s.icon />
              </span>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
              <Photo name={s.image} />
            </article>
          ))}
        </div>
      </section>
      <section className="ps-benefits">
        <div>
          <span className="ps-kicker">WHY CHOOSE POSTORY</span>
          <h2>
            More customers.
            <br />
            Less work for you.
          </h2>
        </div>
        {[
          [
            "Attract new customers",
            "Reach more people in your local area.",
            Users,
          ],
          [
            "Save time",
            "Focus on your business, we handle the social media.",
            Clock,
          ],
          [
            "Professional results",
            "High-quality content that builds your brand and credibility.",
            Sparkles,
          ],
          [
            "Grow consistently",
            "A long-term strategy to keep your business top of mind.",
            ChartNoAxesColumnIncreasing,
          ],
        ].map(([title, body, Icon], i) => {
          const I = Icon as typeof Users;
          return (
            <article key={String(title)}>
              <span className={`ps-icon ps-tone-${i}`}>
                <I />
              </span>
              <h3>{String(title)}</h3>
              <p>{String(body)}</p>
            </article>
          );
        })}
      </section>
      <section className="ps-service-process">
        <SectionTitle
          tag="OUR PROCESS"
          title={
            <>
              A simple process,
              <br />
              great results.
            </>
          }
          action={
            <Link className="ps-text-link" href="/how-it-works">
              Learn More About Our Process →
            </Link>
          }
        />
        <Steps />
      </section>
      <BottomCTA title="Let’s create social media that gets real results." />
    </PublicFrame>
  );
}
export function ProcessPage() {
  return (
    <PublicFrame className="ps-process">
      <OwnerHero
        tag="HOW IT WORKS"
        title={
          <>
            A simple process.
            <br />
            Real results.
          </>
        }
        body="We handle your social media from strategy to publishing, so you can focus on running your business."
      />
      <section className="ps-process-main">
        <SectionTitle
          tag="THE PROCESS"
          title="Here’s how it works"
          body="A simple 5-step process designed to make social media easy for you."
        />
        <Steps photos />
      </section>
      <section className="ps-hands-off">
        <div>
          <span className="ps-kicker">MOSTLY HANDS-OFF FOR YOU</span>
          <h2>
            You stay focused on your business.
            <br />
            We take care of the rest.
          </h2>
          <p>
            Once we understand your business, our team handles strategy, content
            creation, publishing, and ongoing management.
            <br />
            You only need to get involved when we need your input or approval
            (for example, for special promotions or important updates).
          </p>
        </div>
        <Photo name="business-owner" />
        <div className="ps-hands-off-list">
          {[
            [
              "We do the work",
              "Strategy, content, publishing, and management.",
              Check,
            ],
            [
              "You review when needed",
              "We’ll let you know if we need your feedback or approval.",
              MessageCircle,
            ],
            [
              "You get the results",
              "More visibility, more customers, and steady growth.",
              Clock,
            ],
          ].map(([t, b, Icon]) => {
            const I = Icon as typeof Check;
            return (
              <article key={String(t)}>
                <I />
                <div>
                  <h3>{String(t)}</h3>
                  <p>{String(b)}</p>
                </div>
              </article>
            );
          })}
        </div>
      </section>
      <BottomCTA
        blue
        title="Let’s create social media that grows your business."
      />
    </PublicFrame>
  );
}
export function IndustriesPage() {
  const defs = [
    {
      title: "Beauty & Wellness",
      body: "Spas, beauty studios, salons, skincare clinics, and wellness centers.",
      icon: Leaf,
      href: "/our-work/beauty",
    },
    {
      title: "Restaurants & Cafés",
      body: "Restaurants, cafés, bars, bakeries, and food & beverage businesses.",
      icon: Utensils,
      href: "/our-work/restaurant",
    },
    {
      title: "Home Services & Contractors",
      body: "Contractors, renovation, cleaning, plumbing, electrical, and other home services.",
      icon: Wrench,
      href: "/our-work/contractor",
    },
    {
      title: "Fitness & Health",
      body: "Gyms, personal trainers, yoga studios, pilates, and wellness coaches.",
      icon: Dumbbell,
    },
    {
      title: "Retail & Boutiques",
      body: "Clothing stores, gift shops, specialty retail, and local boutiques.",
      icon: ShoppingBag,
    },
    {
      title: "Professional Services",
      body: "Real estate, mortgage, accounting, consulting, and other professional services.",
      icon: BriefcaseBusiness,
    },
  ];
  return (
    <PublicFrame className="ps-industries">
      <OwnerHero
        tag="WHO WE HELP"
        title={
          <>
            Different businesses.
            <br />
            Same goal.
          </>
        }
        body="We help local businesses attract more customers with professional social media content — so you can focus on what you do best."
      />
      <section className="ps-industries-main">
        <SectionTitle
          tag="POPULAR INDUSTRIES"
          title="Tailored content for your industry"
          body="We understand the unique needs of different businesses and create content that speaks to your customers, your services, and your local market."
        />
        <div className="ps-industry-grid">
          {defs.map((s, i) => (
            <article key={s.title}>
              <Photo name={`industry-${i + 1}`} alt={s.title} />
              <div>
                <span className={`ps-icon ps-tone-${i}`}>
                  <s.icon />
                </span>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
                <CTA secondary href={s.href || "/assessment"}>
                  {s.href ? "View Demo" : "Learn More"}
                </CTA>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="ps-more-industries">
        <SectionTitle
          tag="AND MANY MORE"
          title="We work with a wide range of local businesses"
          body="If your business serves local customers, we can help you grow with social media."
        />
        <div>
          {[
            ["Pet Care", PawPrint],
            ["Medical & Dental", Heart],
            ["Auto Services", Car],
            ["Home & Garden", House],
            ["Education & Tutoring", GraduationCap],
            ["Health & Wellness", Leaf],
            ["Personal Care", Scissors],
            ["And More", Ellipsis],
          ].map(([n, Icon], i) => {
            const I = Icon as typeof Heart;
            return (
              <Link href="/assessment" key={String(n)}>
                <span className={`ps-icon ps-tone-${i % 5}`}>
                  <I />
                </span>
                {String(n)}
              </Link>
            );
          })}
        </div>
      </section>
      <BottomCTA title="Let’s create social media that brings you more customers." />
    </PublicFrame>
  );
}
export function AboutPage() {
  return (
    <PublicFrame className="ps-about">
      <OwnerHero
        tag="ABOUT POSTORY"
        title={
          <>
            We believe every
            <br />
            small business has
            <br />a great story to share.
          </>
        }
        body="PoStory helps local businesses show up consistently on social media with high-quality content — so they can reach more customers and focus on what they do best."
      />
      <section className="ps-about-start">
        <div>
          <SectionTitle
            tag="WHY WE STARTED"
            title="Small businesses make communities stronger."
          />
          <p>
            We started PoStory because we saw how hard local business owners
            work — and how often they don’t have the time, resources, or
            expertise to manage social media. We believe professional social
            media shouldn’t be just for big brands. Every small business
            deserves to be seen, found, and loved.
          </p>
        </div>
        <div className="ps-local-note">
          ♡ &nbsp;Local
          <br />
          Businesses
          <br />
          Matter
        </div>
      </section>
      <section className="ps-about-combination">
        <div>
          <span className="ps-kicker">HOW WE WORK</span>
          <h2>
            A powerful combination
            <br />
            of human creativity and AI.
          </h2>
          <p>
            We combine the creativity and industry knowledge of real people with
            the speed and capabilities of AI, so you get high-quality, engaging
            content that’s on-brand, on-strategy, and on time.
          </p>
        </div>
        <Photo name="team-working" alt="Illustrative creative team" />
        <div>
          {[
            [
              "Real people",
              "who understand your business and create with care.",
              Users,
            ],
            [
              "AI tools",
              "that help us work faster, smarter, and more creatively.",
              Bot,
            ],
            [
              "Better results",
              "for your brand, with consistent quality and a long-term strategy.",
              ChartNoAxesColumnIncreasing,
            ],
          ].map(([t, b, Icon], i) => {
            const I = Icon as typeof Users;
            return (
              <article key={String(t)}>
                <span className={`ps-icon ps-tone-${i}`}>
                  <I />
                </span>
                <div>
                  <h3>{String(t)}</h3>
                  <p>{String(b)}</p>
                </div>
              </article>
            );
          })}
        </div>
      </section>
      <section className="ps-about-principles">
        <SectionTitle tag="OUR PRINCIPLES" title="What we stand for." />
        <div>
          {[
            [
              "Local First",
              "We’re passionate about helping local businesses grow and thrive.",
              Heart,
            ],
            [
              "Quality Content",
              "We create content that’s beautiful, relevant, and effective.",
              Gem,
            ],
            [
              "Partnership",
              "We care about your success and work as your long-term partner.",
              Handshake,
            ],
            [
              "Keep It Simple",
              "No complicated tools. You focus on your business — we handle the social media.",
              Leaf,
            ],
          ].map(([t, b, Icon], i) => {
            const I = Icon as typeof Heart;
            return (
              <article key={String(t)}>
                <span className={`ps-icon ps-tone-${i}`}>
                  <I />
                </span>
                <h3>{String(t)}</h3>
                <p>{String(b)}</p>
              </article>
            );
          })}
        </div>
      </section>
      <section className="ps-about-team">
        <div>
          <SectionTitle tag="OUR TEAM" title="A small but dedicated team." />
          <p>
            We’re a team of marketers, designers, and content creators who love
            working with small businesses. We’re here to make social media easy,
            effective, and enjoyable for you.
          </p>
          <small>
            Team imagery is illustrative artwork from the supplied design.
          </small>
        </div>
        <Photo name="team" alt="Illustrative PoStory team" />
      </section>
      <BottomCTA />
    </PublicFrame>
  );
}
export function AssessmentPage() {
  return (
    <PublicFrame className="ps-assessment">
      <section className="ps-assessment-hero">
        <div>
          <Tag>FREE ASSESSMENT</Tag>
          <h1>
            Get a Personalized
            <br />
            Social Media Plan
            <br />
            <span className="ps-gradient-text">for Your Business</span>
          </h1>
          <p>
            Tell us a bit about your business and goals. We’ll review your
            information and get back to you with a customized social media plan.
          </p>
          <div className="ps-assessment-promises">
            {[
              [CalendarDays, "No cost", "and no obligation"],
              [Clock, "Usually within", "1–2 business days"],
              [Mail, "A plan tailored", "to your business"],
            ].map(([Icon, t, b], i) => {
              const I = Icon as typeof Mail;
              return (
                <div key={i}>
                  <span className="ps-icon">
                    <I />
                  </span>
                  <span>
                    {String(t)}
                    <br />
                    {String(b)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        <HeroCollage assessment />
      </section>
      <section className="ps-assessment-main" id="contact">
        <div>
          <SectionTitle
            tag="WHAT WE WILL PROVIDE"
            title={
              <>
                A Customized Plan Based
                <br />
                on Your Business
              </>
            }
            body="We’ll review your business, goals and current status, and create a practical social media plan for you."
          />
          <div className="ps-assessment-benefits">
            {[
              [
                "Content Plan",
                "Recommended content types, themes and posting frequency based on your business.",
                FileText,
              ],
              [
                "Platform Focus",
                "The most relevant platforms for your audience (e.g. Instagram, Facebook, TikTok).",
                Target,
              ],
              [
                "Growth Opportunities",
                "Areas to improve and opportunities to attract more customers.",
                ChartNoAxesColumnIncreasing,
              ],
              [
                "Next Steps",
                "Clear recommendations on how to get started.",
                Users,
              ],
            ].map(([t, b, Icon], i) => {
              const I = Icon as typeof Users;
              return (
                <article key={String(t)}>
                  <span className={`ps-icon ps-tone-${i}`}>
                    <I />
                  </span>
                  <div>
                    <h3>{String(t)}</h3>
                    <p>{String(b)}</p>
                  </div>
                </article>
              );
            })}
          </div>
          <SectionTitle
            tag="EXAMPLE PLAN AREAS"
            title="Relevant to Your Industry"
            body="Your assessment will be tailored to your business type and goals."
          />
          <div className="ps-assessment-industries">
            {[
              ["Restaurants", "restaurant-1"],
              ["Beauty & Wellness", "beauty-1"],
              ["Home Services & Contractors", "contractor-1"],
              ["Local Retail", "industry-5"],
            ].map(([t, n]) => (
              <article key={t}>
                <Photo name={n} />
                <h3>{t}</h3>
                <Checks
                  items={[
                    "Content showcases",
                    "Seasonal promotions",
                    "Customer stories",
                  ]}
                />
              </article>
            ))}
          </div>
        </div>
        <div className="ps-assessment-form-card">
          <SectionTitle
            tag="ASSESSMENT FORM"
            title="Tell Us About Your Business"
            body="Fill in the form and we’ll get back to you with a customized plan."
          />
          <AssessmentForm />
        </div>
      </section>
      <section className="ps-assessment-faq">
        <div>
          <SectionTitle
            tag="FAQs"
            title="Common Questions"
            action={<ContactDialog />}
          />
          <FAQs assessment />
        </div>
        <article>
          <Photo
            name="assessment-meeting"
            alt="Business owner discussing a marketing plan"
          />
          <div>
            <h2>Still Have Questions?</h2>
            <p>
              If you have any questions before submitting the form, feel free to
              contact us.
            </p>
            <ContactDialog />
          </div>
        </article>
      </section>
    </PublicFrame>
  );
}
