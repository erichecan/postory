import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { requireUser } from "@/lib/auth/session";
import { listRestaurantBriefsForClient } from "@/lib/db/restaurant-campaigns";
import { RestaurantMarketingCalendar, type PlanItem } from "@/components/restaurant/restaurant-marketing-calendar";
import { getRestaurantPlatformSequence } from "@/lib/restaurant-campaign-planning";

const sampleStart = new Date("2026-11-01T00:00:00.000Z");
const sampleEnd = new Date("2026-11-30T00:00:00.000Z");
const sampleItems: PlanItem[] = [
  { id: "sample-1", date: new Date("2026-11-02T00:00:00.000Z"), scheduledTime: "12:30", title: "Meet the chef’s favourites", theme: "Signature dishes", objective: "Introduce the restaurant’s signature sushi selection.", concept: "A close-up carousel of nigiri and rolls, followed by a short note from the chef about what makes each one special.", platforms: ["instagram", "facebook"], status: "PLANNED", content: null, submissions: [], previewImage: "/demo/photos/restaurant-calendar/signature.jpg" },
  { id: "sample-2", date: new Date("2026-11-05T00:00:00.000Z"), scheduledTime: "17:30", title: "A fresh roll, made to order", theme: "Behind the scenes", objective: "Show the care and freshness behind each order.", concept: "A 15-second vertical video following one roll from fresh ingredients to the finished plate.", platforms: ["instagram", "tiktok"], status: "PLANNED", content: null, submissions: [], previewImage: "/demo/photos/restaurant-calendar/roll-made-to-order.jpg" },
  { id: "sample-3", date: new Date("2026-11-08T00:00:00.000Z"), scheduledTime: "11:30", title: "Sunday lunch set", theme: "Lunch promotion", objective: "Make the weekend lunch offer easy to discover and understand.", concept: "A clear menu-led post with the lunch set, serving hours and a simple booking invitation.", platforms: ["facebook", "instagram"], status: "PLANNED", content: null, submissions: [], previewImage: "/demo/photos/restaurant-calendar/lunch-set.jpg" },
  { id: "sample-4", date: new Date("2026-11-11T00:00:00.000Z"), scheduledTime: "18:00", title: "A seat at the sushi counter", theme: "Dining experience", objective: "Give local guests a feel for the restaurant before they visit.", concept: "Warm counter and dining-room photos paired with a short invitation to book an evening table.", platforms: ["instagram"], status: "PLANNED", content: null, submissions: [], previewImage: "/demo/photos/restaurant-calendar/sushi-counter.jpg" },
  { id: "sample-5", date: new Date("2026-11-14T00:00:00.000Z"), scheduledTime: "12:00", title: "Guest favourite: salmon dragon roll", theme: "Customer favourites", objective: "Put a popular menu choice in front of people planning their weekend meal.", concept: "Bright overhead food photography with a concise description of the roll’s ingredients and texture.", platforms: ["instagram", "facebook"], status: "PLANNED", content: null, submissions: [], previewImage: "/demo/photos/restaurant-calendar/salmon-dragon-roll.jpg" },
  { id: "sample-6", date: new Date("2026-11-17T00:00:00.000Z"), scheduledTime: "17:00", title: "From market to menu", theme: "Fresh ingredients", objective: "Build confidence in the ingredients used across the menu.", concept: "A short ingredient spotlight showing seasonal produce alongside the dish it inspires.", platforms: ["tiktok", "instagram"], status: "PLANNED", content: null, submissions: [], previewImage: "/demo/photos/restaurant-calendar/fresh-ingredients.jpg" },
  { id: "sample-7", date: new Date("2026-11-20T00:00:00.000Z"), scheduledTime: "16:30", title: "Make Friday a sushi night", theme: "Weekend occasion", objective: "Encourage advance bookings for Friday evening.", concept: "An inviting table scene, a small selection of dishes and a direct booking prompt.", platforms: ["facebook", "instagram"], status: "PLANNED", content: null, submissions: [], previewImage: "/demo/photos/restaurant-calendar/sushi-night.jpg" },
  { id: "sample-8", date: new Date("2026-11-23T00:00:00.000Z"), scheduledTime: "12:30", title: "What’s inside the bento?", theme: "Menu discovery", objective: "Help nearby customers discover the weekday lunch option.", concept: "A top-down bento photo with each item labelled in the caption and the serving window included.", platforms: ["instagram", "facebook"], status: "PLANNED", content: null, submissions: [], previewImage: "/demo/photos/restaurant-calendar/bento-lunch.jpg" },
  { id: "sample-9", date: new Date("2026-11-26T00:00:00.000Z"), scheduledTime: "18:00", title: "A little sushi-making moment", theme: "Kitchen story", objective: "Share the craft and personality behind the restaurant.", concept: "A relaxed short clip of the chef preparing a roll, with natural kitchen sounds and minimal on-screen text.", platforms: ["tiktok", "instagram"], status: "PLANNED", content: null, submissions: [], previewImage: "/demo/photos/restaurant-calendar/chef-nigiri.jpg" },
  { id: "sample-10", date: new Date("2026-11-29T00:00:00.000Z"), scheduledTime: "11:00", title: "Plan your next visit", theme: "Community invitation", objective: "Close the month with a friendly reason to return or bring a friend.", concept: "A carousel of three guest-favourite dishes with opening hours and a warm invitation to visit.", platforms: ["facebook", "instagram"], status: "PLANNED", content: null, submissions: [], previewImage: "/demo/photos/restaurant-calendar/guest-favourites.jpg" },
];
const extraSamplePosts = [
  [1, "A sushi lunch to look forward to", "Lunch promotion", "Introduce the weekday lunch offer to nearby diners.", "A clear lunch set photo with serving hours and the menu link."],
  [3, "Lunch break, sorted", "Weekday lunch", "Help local office workers find an easy lunch option.", "A quick overhead view of a balanced set with a simple booking invitation."],
  [4, "Nigiri, made one piece at a time", "Kitchen craft", "Show the care behind the restaurant’s nigiri.", "A close shot of the chef shaping rice and placing fresh fish."],
  [6, "Three rolls made for sharing", "Sharing platter", "Inspire guests to order a platter for the table.", "A colourful roll selection with a short note on flavours and portions."],
  [7, "A Saturday sushi stop", "Weekend dining", "Give weekend visitors a reason to drop in.", "A welcoming counter scene paired with opening hours and location."],
  [9, "Build your bento", "Menu discovery", "Make the lunch bento options easier to understand.", "Label the main bento components in a simple carousel."],
  [10, "Fresh fish, careful preparation", "Fresh ingredients", "Build trust in the ingredients used in the kitchen.", "A fresh ingredient spotlight paired with the dish it becomes."],
  [12, "Choose your lunch combination", "Lunch menu", "Encourage menu views for the lunch selection.", "A side-by-side menu card showing the available combinations."],
  [13, "An evening at the sushi counter", "Dining experience", "Help evening guests picture the dining experience.", "Warm counter lighting, close-up dishes and a reservation prompt."],
  [15, "A closer look at the salmon roll", "Signature dish", "Give a popular roll a dedicated moment in the feed.", "A bright close-up with ingredients and texture described clearly."],
  [16, "A little miso with your sushi", "Menu pairing", "Introduce a simple pairing to complement an order.", "A soup and sushi pairing styled as an easy lunch choice."],
  [18, "What makes our sushi rice special?", "Behind the scenes", "Share a small detail about the restaurant’s craft.", "A short kitchen clip showing rice preparation and finished nigiri."],
  [19, "Sushi night, ready to take away", "Takeaway", "Make takeaway ordering easy to discover.", "A packed takeaway selection with ordering details and pickup timing."],
  [21, "Make room for a date-night roll", "Date night", "Inspire couples to book an evening table.", "A shared sushi plate in a warm table setting with a booking prompt."],
  [22, "A lunch table for the whole team", "Group dining", "Encourage small group lunch visits.", "A generous table spread with group booking information."],
  [24, "The chef’s quick pick today", "Chef recommendation", "Help diners choose a dish with a personal recommendation.", "A short chef note beside a favourite dish and its key flavours."],
  [25, "Comfort food, Japanese style", "Guest favourites", "Connect familiar comfort with the restaurant’s menu.", "A warm bowl and roll pairing with a welcoming caption."],
  [27, "A midweek sushi treat", "Weekday occasion", "Give nearby customers a small reason to visit midweek.", "A bright dish photo with a concise weekday invitation."],
  [28, "The final touch before it reaches your table", "Plating detail", "Show the care that goes into serving each order.", "A short vertical clip of the final plating and handoff."],
  [30, "November’s favourites, all in one place", "Monthly roundup", "Close the month with a reminder of popular dishes.", "A carousel recap of guest favourites and a prompt to visit again."],
].map(([day, title, theme, objective, concept], index) => ({
  id: `sample-extra-${index + 1}`,
  date: new Date(Date.UTC(2026, 10, Number(day))),
  scheduledTime: index % 2 === 0 ? "12:30" : "17:30",
  title: String(title),
  theme: String(theme),
  objective: String(objective),
  concept: String(concept),
  platforms: index % 3 === 0 ? ["instagram", "facebook"] : index % 3 === 1 ? ["instagram", "tiktok"] : ["facebook", "instagram"],
  status: "PLANNED",
  content: null,
  submissions: [],
  previewImage: ["/demo/photos/restaurant-calendar/chef-nigiri.jpg", "/demo/photos/restaurant-calendar/lunch-set.jpg", "/demo/photos/restaurant-calendar/sushi-counter.jpg", "/demo/photos/restaurant-calendar/fresh-ingredients.jpg", "/demo/photos/restaurant-calendar/roll-made-to-order.jpg", "/demo/photos/restaurant-calendar/sushi-night.jpg", "/demo/photos/restaurant-calendar/bento-lunch.jpg", "/demo/photos/restaurant-calendar/guest-favourites.jpg"][index % 8],
}));
const orderedSampleMonthItems = [...sampleItems, ...extraSamplePosts].sort((a, b) => a.date.getTime() - b.date.getTime());
const samplePlatforms = getRestaurantPlatformSequence(30, ["instagram", "facebook", "tiktok"]);
const sampleMonthItems = orderedSampleMonthItems.map((item, index) => {
  const platform = samplePlatforms[index];
  return {
    ...item,
    platforms: [platform],
    ...(platform === "tiktok" ? { concept: `Short vertical video: ${item.concept}` } : {}),
  };
});

export default async function RestaurantCampaignsPage() {
  const t = await getTranslations("restaurantRequest.campaignsPage");
  const user = await requireUser();
  const briefs = await listRestaurantBriefsForClient(user.id);
  const showSample = user.phone === "demo" && briefs.length === 0;
  const statusLabels = { ACTIVE: t("statuses.ACTIVE"), SUBMITTED: t("statuses.SUBMITTED"), IN_REVIEW: t("statuses.IN_REVIEW"), IN_PRODUCTION: t("statuses.IN_PRODUCTION"), AWAITING_CLIENT: t("statuses.AWAITING_CLIENT"), CLOSED: t("statuses.CLOSED") };
  return <main className="mx-auto max-w-[1440px] px-4 py-8 lg:px-8"><p className="text-sm font-semibold uppercase tracking-widest text-primary">{t("eyebrow")}</p><h1 className="mt-2 text-3xl font-semibold">{t("title")}</h1><div className="mt-2 flex flex-wrap items-center justify-between gap-4"><p className="text-muted-foreground">{t("description")}</p><Link href="/restaurant/request" className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">{t("createButton")} <span className="ml-2" aria-hidden="true">→</span></Link></div>{briefs.length ? <div className="mt-8 grid gap-4 md:grid-cols-2">{briefs.map((brief)=><Link key={brief.id} href={`/restaurant/campaigns/${brief.id}`} className="rounded-2xl border bg-card p-5 transition hover:border-primary"><div className="flex items-start justify-between gap-3"><div><h2 className="text-xl font-semibold">{brief.businessName}</h2><p className="mt-1 text-sm text-muted-foreground">{brief.location}</p></div><span className="rounded-full bg-muted px-3 py-1 text-xs">{statusLabels[brief.status]}</span></div><p className="mt-5 font-medium">{brief.marketingPlan?.title ?? t("preparing")}</p>{brief.marketingPlan && <p className="mt-1 text-sm text-muted-foreground">{brief.marketingPlan.startDate.toLocaleDateString("en-IE", { timeZone: "UTC" })} – {brief.marketingPlan.endDate.toLocaleDateString("en-IE", { timeZone: "UTC" })} · {t("plannedMoments", { count: brief.marketingPlan._count.items })}</p>}<p className="mt-4 text-sm text-primary">{t("viewPlan")} →</p></Link>)}</div> : showSample ? <div className="mt-8"><RestaurantMarketingCalendar briefId="sample" planId="sample" startDate={sampleStart} endDate={sampleEnd} items={sampleMonthItems} submissions={[]} readOnly/></div> : <section className="mt-8 rounded-2xl border p-6"><h2 className="font-semibold">{t("emptyTitle")}</h2><p className="mt-2 text-sm text-muted-foreground">{t("emptyDescription")}</p></section>}</main>;
}
