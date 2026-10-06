export type ContentItem = {
  id: string;
  title: string;
  image: string | null;
  platform: string;
  date: string;
  time: string;
  category: string;
  status: "Published" | "Scheduled" | "In Progress";
  caption?: string;
};
export type Campaign = {
  id: string;
  name: string;
  description: string;
  start: string;
  end: string;
  cover: string | null;
  status: "Active" | "Upcoming" | "Completed";
  goal?: string;
  items: ContentItem[];
};
export type AgencyData = {
  demo: boolean;
  name: string;
  shop: string;
  profile: {
    shopName: string | null;
    slogan: string | null;
    activity: string | null;
    address: string | null;
    phone: string | null;
    wechat: string | null;
    logoUrl: string | null;
    industry:
      | "FOOD_TAKEAWAY"
      | "BEAUTY_HAIR"
      | "FITNESS"
      | "PHONE_REPAIR"
      | "OTHER"
      | null;
    country: "IE" | "CA" | null;
    whatsappNumber: string | null;
    marketingEmailOptIn: boolean;
    marketingSmsOptIn: boolean;
  } | null;
  accounts: { platform: string; handle: string | null; connected: boolean }[];
  campaigns: Campaign[];
  items: ContentItem[];
};
