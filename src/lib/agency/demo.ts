import type { AgencyData, ContentItem } from "./types";
const titles = [
  "Spring Facial Treatment",
  "Best Skincare Products for Spring",
  "A Relaxing Day at Our Beauty Studio",
  "3 Skincare Tips You Need to Know",
  "DIY Facial Mask at Home",
  "Client Transformation",
  "Brand Message",
  "Studio Tour",
  "Lymphatic Massage Benefits",
  "Mother’s Day Special Offer",
  "Morning vs. Evening Skincare Routine",
  "Client Q&A: Ask Us Anything",
];
const images = [
  "campaign-cover",
  "upcoming-1",
  "upcoming-3",
  "upcoming-4",
  "beauty-8",
  "beauty-2",
  "promotion-1",
  "beauty-3",
  "beauty-1",
  "promotion-3",
  "beauty-5",
  "upcoming-1",
];
export const demoItems: ContentItem[] = titles.map((title, i) => ({
  id: `content-${i + 1}`,
  title,
  image: `/visual/${images[i]}.webp`,
  platform: ["instagram", "tiktok", "facebook"][i % 3],
  date: `2026-03-${String([1, 3, 5, 7, 10, 12, 14, 17, 20, 22, 25, 28][i]).padStart(2, "0")}`,
  time: ["10:00 AM", "6:00 PM", "12:00 PM", "11:00 AM"][i % 4],
  category: ["Education", "Product", "Lifestyle", "Social Proof"][i % 4],
  status: i < 8 ? "Published" : "Scheduled",
  caption:
    "A little time for yourself, a beautiful way to start the season. Discover personalized skincare at Sophie Chen Beauty Studio.",
}));
export function getDemoData(): AgencyData {
  return {
    demo: true,
    name: "Sophie Chen",
    shop: "Beauty Studio",
    profile: {
      shopName: "Sophie Chen Beauty Studio",
      slogan: "Your glow. Our priority.",
      activity:
        "We help you look and feel your best with personalized skincare treatments and professional care. Our focus is on natural, healthy results in a relaxing and welcoming environment.",
      address: "Toronto, Canada",
      phone: "(416) 555-0188",
      wechat: "",
      logoUrl: null,
      industry: "BEAUTY_HAIR",
      country: "CA",
      whatsappNumber: "",
      marketingEmailOptIn: false,
      marketingSmsOptIn: false,
    },
    accounts: ["instagram", "facebook", "tiktok"].map((platform) => ({
      platform,
      handle:
        platform === "facebook"
          ? "Sophie Chen Beauty Studio"
          : "@beauty.studio",
      connected: true,
    })),
    items: demoItems,
    campaigns: [
      {
        id: "spring-beauty-refresh",
        name: "Spring Beauty Refresh",
        description:
          "Helping your studio increase spring bookings through seasonal treatments, skincare education, real client transformations, and limited-time offers.",
        start: "2026-03-01",
        end: "2026-03-31",
        cover: "/visual/campaign-cover.webp",
        status: "Active",
        goal: "Increase appointment bookings and promote seasonal services.",
        items: demoItems,
      },
      {
        id: "mothers-day",
        name: "Mother’s Day Beauty Event",
        description:
          "Celebrate Mother’s Day with special treatments and gift packages.",
        start: "2026-04-20",
        end: "2026-05-10",
        cover: "/visual/flowers.webp",
        status: "Upcoming",
        items: [],
      },
      {
        id: "summer-refresh",
        name: "Summer Skin Refresh",
        description:
          "Focus on summer skincare tips, sun protection, and seasonal services.",
        start: "2026-06-01",
        end: "2026-06-30",
        cover: "/visual/summer.webp",
        status: "Upcoming",
        items: [],
      },
      {
        id: "january-refresh",
        name: "January Refresh",
        description:
          "Focused on new year skincare goals and self-care routines.",
        start: "2026-01-02",
        end: "2026-01-31",
        cover: "/visual/campaign-cover.webp",
        status: "Completed",
        items: [],
      },
      {
        id: "holiday-gift",
        name: "Holiday Gift Campaign",
        description: "Promoted holiday gift packages and special offers.",
        start: "2025-12-01",
        end: "2025-12-31",
        cover: "/visual/holiday.webp",
        status: "Completed",
        items: [],
      },
    ],
  };
}
export const focus = [
  "Highlight seasonal skincare treatments",
  "Showcase real client results",
  "Educate with simple skincare tips",
  "Promote our Spring Special Offer",
];
