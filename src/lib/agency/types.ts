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
  /** 代理商以客户身份查看时的路由前缀（如 /partners/clients/<clientUserId>），覆盖 demo 的 /demo 前缀 */
  basePath?: string;
  /** 代理商以客户身份查看时为 true：隐藏品牌资料编辑、社交账号连接管理等写操作入口 */
  readOnly?: boolean;
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
