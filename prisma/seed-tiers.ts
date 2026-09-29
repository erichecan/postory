import type { TierFeatures } from "../src/lib/billing/tier-features";

const COMMON = { topup: true, basePlatforms: true, schedule: true, templates: true, aiImages: true, multiRound: true, brandFill: true } as const;

export const DEFAULT_TIERS: {
  slug: string;
  nameZh: string;
  nameEn: string;
  taglineZh: string;
  taglineEn: string;
  benefitsZh: string[];
  benefitsEn: string[];
  features: TierFeatures;
  defaultMonthlyCredits: number;
  defaultMonthlyVideos: number;
  referenceFee: number;
  recommended: boolean;
  sortOrder: number;
}[] = [
  {
    slug: "basic",
    nameZh: "基础会员",
    nameEn: "Basic",
    taglineZh: "一家店日常发帖够用",
    taglineEn: "Everyday posting for one location",
    benefitsZh: ["每月 60 张图片额度", "每月 4 条视频", "发布到 Facebook、Instagram、TikTok、小红书", "全部模板可用", "AI 生图：标准 1 credit / 高清 2 credit"],
    benefitsEn: ["60 image credits per month", "4 videos per month", "Publish to Facebook, Instagram, TikTok and RedNote", "Every template unlocked", "AI images: 1 credit standard / 2 credits HD"],
    features: { ...COMMON, monthlyCredits: 60, monthlyVideos: 4, extraPlatforms: "addon", prioritySupport: false, dedicatedDesigner: false, contentPlanning: false },
    defaultMonthlyCredits: 60,
    defaultMonthlyVideos: 4,
    referenceFee: 9900,
    recommended: false,
    sortOrder: 1,
  },
  {
    slug: "growth",
    nameZh: "成长会员",
    nameEn: "Growth",
    taglineZh: "多平台、发得勤的门店",
    taglineEn: "For busy shops on many platforms",
    benefitsZh: ["每月 150 张图片额度", "每月 10 条视频", "基础 4 个平台 + 可加开更多平台", "店铺资料一键填入", "优先支持"],
    benefitsEn: ["150 image credits per month", "10 videos per month", "The 4 core platforms, plus more on request", "One-click business details", "Priority support"],
    features: { ...COMMON, monthlyCredits: 150, monthlyVideos: 10, extraPlatforms: "addon", prioritySupport: true, dedicatedDesigner: false, contentPlanning: false },
    defaultMonthlyCredits: 150,
    defaultMonthlyVideos: 10,
    referenceFee: 19900,
    recommended: true,
    sortOrder: 2,
  },
  {
    slug: "all-in",
    nameZh: "全包会员",
    nameEn: "All-inclusive",
    taglineZh: "内容全交给我们",
    taglineEn: "Hand all your content to us",
    benefitsZh: ["图片、视频按需定制", "全部平台", "专人对接出图", "月度内容规划"],
    benefitsEn: ["Images and videos sized to your needs", "Every platform", "A dedicated designer", "Monthly content planning"],
    features: { ...COMMON, monthlyCredits: "custom", monthlyVideos: "custom", extraPlatforms: "all", prioritySupport: true, dedicatedDesigner: true, contentPlanning: true },
    defaultMonthlyCredits: 300,
    defaultMonthlyVideos: 20,
    referenceFee: 49900,
    recommended: false,
    sortOrder: 3,
  },
];
