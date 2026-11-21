"use client";

import Image from "next/image";

export type SushiCampaignId = "footfall" | "promote" | "repeat" | "basket" | "offpeak" | "awareness" | "unsure";

export type SushiCampaign = {
  id: SushiCampaignId;
  purpose: string;
  eyebrow: string;
  headline: string;
  subheadline: string;
  cta: string;
  photo?: string;
  scene: "lunch" | "signature" | "loyalty" | "sharing" | "weekday" | "neighbourhood" | "discovery";
  description: string;
  socialCopy: string;
  /** Preview-only creative direction; actual client photos and terms must be checked. */
  contentFormat: "real_photo" | "brand_editorial" | "offer_poster" | "carousel";
  promotionTerms: string;
  approach: string[];
  indicators: string[];
};

export const SUSHI_CAMPAIGNS: Record<SushiCampaignId, SushiCampaign> = {
  footfall: {
    id: "footfall", purpose: "到店与预约", eyebrow: "FRESHLY MADE · LUNCH",
    contentFormat: "real_photo", promotionTerms: "",
    headline: "Make it a\nsushi lunch.", subheadline: "A sushi lunch between busy moments.",
    cta: "VISIT US FOR LUNCH", photo: "/demo/photos/restaurant-calendar/lunch-set.jpg", scene: "lunch",
    description: "让真实寿司午餐占据视觉中心，标题锁定午休场景；菜单、地址和时段需要门店核实后才可发布。",
    socialCopy: "午休时间只有一小段？换个思路，今天安排一顿寿司午餐。看一看菜单里的寿司选择，找到适合今天心情的那一份。想好吃什么，就去查看菜单。\n\n#SakuraSushi #SushiLunch",
    approach: ["以完整套餐和午餐场景为主视觉", "正文说明经确认的营业时间与到店方式", "最后引导顾客查看菜单或直接到店"],
    indicators: ["午餐时段门店咨询", "导航或菜单链接点击", "可归因的午餐订单"]
  },
  promote: {
    id: "promote", purpose: "重点商品推广", eyebrow: "THE SIGNATURE SERIES",
    contentFormat: "brand_editorial", promotionTerms: "",
    headline: "A roll\nworth a look.", subheadline: "A closer look at the featured sushi roll.",
    cta: "EXPLORE THE MENU", photo: "/demo/photos/restaurant-calendar/salmon-dragon-roll.jpg", scene: "signature",
    description: "采用单品近景的真实摄影，明确说的是寿司卷；配料、菜名和供应信息由门店确认。",
    socialCopy: "每次点寿司卷，你会先看外层、馅料还是那一口口感？今天把镜头拉近，看看卷寿司本身的层次。想找下一次点单的灵感，先浏览菜单。\n\n#SakuraSushi #SushiRoll",
    approach: ["聚焦一款实际有售的主推菜品", "只展示商家已确认的配料与特点", "引导顾客查看菜单，而不是虚构折扣"],
    indicators: ["指定商品咨询", "菜单页访问", "指定菜品销量变化"]
  },
  repeat: {
    id: "repeat", purpose: "会员与回访", eyebrow: "FOR OUR REGULARS",
    contentFormat: "real_photo", promotionTerms: "",
    headline: "Sushi night\nagain?", subheadline: "A familiar dinner ritual, ready to revisit.",
    cta: "PLAN YOUR NEXT VISIT", photo: "/demo/photos/restaurant-calendar/sushi-night.jpg", scene: "loyalty",
    description: "使用真实就餐氛围和克制的品牌排版提醒顾客回访；没有核实的会员权益则不提优惠。",
    socialCopy: "上一次和喜欢的人坐下来吃寿司，是多久以前？下一次见面，不如把晚餐留给一桌好吃的寿司。打开菜单，开始计划这一顿。\n\n#SakuraSushi #SushiNight",
    approach: ["面向曾经消费的顾客设计回访理由", "用菜单更新或真实会员资讯提醒", "没有正式优惠规则时绝不杜撰会员折扣"],
    indicators: ["老顾客再次预约", "会员消息互动", "可归因的回访订单"]
  },
  basket: {
    id: "basket", purpose: "组合与客单价", eyebrow: "MADE TO SHARE",
    contentFormat: "carousel", promotionTerms: "",
    headline: "Sushi to\nshare.", subheadline: "Mix and match a table of favourites.",
    cta: "DISCOVER SHARING IDEAS", photo: "/demo/photos/restaurant-calendar/guest-favourites.jpg", scene: "sharing",
    description: "多道真实菜品组合构图体现分享体验；没有已核实的套餐就不宣称套餐价或组合优惠。",
    socialCopy: "和朋友点寿司，最难的可能是大家想吃的不一样。先选几款寿司，再各自加一份喜欢的口味，分享起来更有意思。打开菜单，挑你们想一起试的组合。\n\n#SakuraSushi #SushiTogether",
    approach: ["展示真实可售的品项组合", "讲清适合几人分享和搭配理由", "如果提供套餐价格，需店主确认后再发布"],
    indicators: ["组合品项咨询", "平均订单金额", "每单商品数量"]
  },
  offpeak: {
    id: "offpeak", purpose: "指定日期与淡时段", eyebrow: "A LITTLE MIDWEEK RITUAL",
    contentFormat: "brand_editorial", promotionTerms: "",
    headline: "Make time\nfor sushi.", subheadline: "A midweek dinner worth planning.",
    cta: "CHECK OUR HOURS", photo: "/demo/photos/restaurant-calendar/sushi-counter.jpg", scene: "weekday",
    description: "用明确星期几建立周中用餐联想；只有确认周二实际营业及活动规则后才能正式发布。",
    socialCopy: "忙了一整天，周中的晚饭也值得认真选。想吃寿司的时候，不妨先看看菜单，再安排适合自己的用餐时间。查看营业时间，计划下一顿。\n\n#SakuraSushi #MidweekSushi",
    approach: ["选定真实营业且有经营需求的日期", "明确表达该时段适合的用餐场景", "活动时间和优惠必须经过门店核实"],
    indicators: ["指定时段咨询", "指定时段订单", "活动带来的预约量"]
  },
  awareness: {
    id: "awareness", purpose: "地区知名度", eyebrow: "HELLO, NEIGHBOUR",
    contentFormat: "real_photo", promotionTerms: "",
    headline: "Behind the\nsushi counter.", subheadline: "Discover the people and counter behind the menu.",
    cta: "GET TO KNOW US", photo: "/demo/photos/restaurant-calendar/sushi-counter.jpg", scene: "neighbourhood",
    description: "真实门店吧台作为主视觉，社媒正文补充已核实的门店地址与服务方式。",
    socialCopy: "一盘寿司端上桌之前，吧台后还有多少细节？从准备到装盘，来看看寿司制作中的那些专注时刻。想进一步认识 Sakura Sushi，欢迎先浏览菜单。\n\n#SakuraSushi #SushiCounter",
    approach: ["门店环境和服务过程比折扣更重要", "加入可核实的服务地区与门店位置", "持续使用一致的品牌识别"],
    indicators: ["本地用户互动", "地图或地址点击", "品牌名称搜索"]
  },
  unsure: {
    id: "unsure", purpose: "探索营销方向", eyebrow: "START WITH WHAT YOU LOVE",
    contentFormat: "carousel", promotionTerms: "",
    headline: "Which sushi\ntonight?", subheadline: "Start with the menu and a favourite dish.",
    cta: "SEE WHAT WE SERVE", photo: "/demo/photos/restaurant-calendar/chef-nigiri.jpg", scene: "discovery",
    description: "不知道推什么时先用真实菜单与顾客选择问题找到方向，不凭空制造新品或促销活动。",
    socialCopy: "握寿司、寿司卷，还是适合分享的组合？如果今晚还没拿定主意，不妨先从自己偏爱的口味和用餐场景开始选。打开菜单，看看哪一类最吸引你。\n\n#SakuraSushi #SushiIdeas",
    approach: ["先选择门店真正有代表性的菜品", "看看顾客最常问的问题", "再判断主要目标是到店、单品推广还是持续认知"],
    indicators: ["顾客对不同菜品的兴趣", "菜单访问", "咨询话题分布"]
  }
};

/** Seven genuinely distinct demo compositions, rendered from owned local demo photography. */
export function SushiCampaignPoster({ campaign, modal = false }: { campaign: SushiCampaign; modal?: boolean }) {
  return <div className={`storex-sushi-creative-frame ${modal ? "is-modal" : ""}`} aria-label={`Sakura Sushi ${campaign.purpose}创意展示`}>
    <Image src={`/api/sakura-creative/${campaign.id}`} alt={`Sakura Sushi ${campaign.purpose}：${campaign.headline.replace(/\n/g," ")}。虚构品牌创意效果，不代表真实菜品或餐厅。`} fill sizes={modal ? "450px" : "360px"} unoptimized />
  </div>;
}
