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
    headline: "Lunch plans?\nThink sushi.", subheadline: "A sushi lunch between busy moments.",
    cta: "VISIT US FOR LUNCH", photo: "/demo/photos/restaurant-calendar/lunch-set.jpg", scene: "lunch",
    description: "让真实寿司午餐占据视觉中心，标题锁定午休场景；菜单、地址和时段需要门店核实后才可发布。",
    socialCopy: "午休时间不多，又想吃点寿司？先看看 Sakura Sushi 的午餐菜单，挑一份适合自己的选择。门店位置、今日供应与营业时间确认后，欢迎查看菜单或联系订餐。\n\n#SakuraSushi #SushiLunch",
    approach: ["以完整套餐和午餐场景为主视觉", "正文说明经确认的营业时间与到店方式", "最后引导顾客查看菜单或直接到店"],
    indicators: ["午餐时段门店咨询", "导航或菜单链接点击", "可归因的午餐订单"]
  },
  promote: {
    id: "promote", purpose: "重点商品推广", eyebrow: "THE SIGNATURE SERIES",
    contentFormat: "brand_editorial", promotionTerms: "",
    headline: "A roll worth\na closer look.", subheadline: "A closer look at the featured sushi roll.",
    cta: "EXPLORE THE MENU", photo: "/demo/photos/restaurant-calendar/salmon-dragon-roll.jpg", scene: "signature",
    description: "采用单品近景的真实摄影，明确说的是寿司卷；配料、菜名和供应信息由门店确认。",
    socialCopy: "想换换平时点的寿司卷？这一条先带你看看门店主推的卷寿司。正式发布时只介绍已确认的品名和配料，再引导顾客查看菜单、询问供应或下单。\n\n#SakuraSushi #SushiRoll",
    approach: ["聚焦一款实际有售的主推菜品", "只展示商家已确认的配料与特点", "引导顾客查看菜单，而不是虚构折扣"],
    indicators: ["指定商品咨询", "菜单页访问", "指定菜品销量变化"]
  },
  repeat: {
    id: "repeat", purpose: "会员与回访", eyebrow: "FOR OUR REGULARS",
    contentFormat: "real_photo", promotionTerms: "",
    headline: "Sushi night\nagain?", subheadline: "A familiar dinner ritual, ready to revisit.",
    cta: "PLAN YOUR NEXT VISIT", photo: "/demo/photos/restaurant-calendar/sushi-night.jpg", scene: "loyalty",
    description: "使用真实就餐氛围和克制的品牌排版提醒顾客回访；没有核实的会员权益则不提优惠。",
    socialCopy: "好久不见！下一次想吃寿司的时候，希望你还会想起 Sakura Sushi。欢迎了解最新菜单与预约安排。\n\n#SakuraSushi #SeeYouAgain",
    approach: ["面向曾经消费的顾客设计回访理由", "用菜单更新或真实会员资讯提醒", "没有正式优惠规则时绝不杜撰会员折扣"],
    indicators: ["老顾客再次预约", "会员消息互动", "可归因的回访订单"]
  },
  basket: {
    id: "basket", purpose: "组合与客单价", eyebrow: "MADE TO SHARE",
    contentFormat: "carousel", promotionTerms: "",
    headline: "Sharing sushi\ntonight?", subheadline: "Mix and match a table of favourites.",
    cta: "DISCOVER SHARING IDEAS", photo: "/demo/photos/restaurant-calendar/guest-favourites.jpg", scene: "sharing",
    description: "多道真实菜品组合构图体现分享体验；没有已核实的套餐就不宣称套餐价或组合优惠。",
    socialCopy: "两个人吃寿司，怎么搭配更有趣？从寿司卷、握寿司到配菜，看看适合分享的点单思路。实际搭配与价格请以门店菜单为准。\n\n#SakuraSushi #BetterTogether",
    approach: ["展示真实可售的品项组合", "讲清适合几人分享和搭配理由", "如果提供套餐价格，需店主确认后再发布"],
    indicators: ["组合品项咨询", "平均订单金额", "每单商品数量"]
  },
  offpeak: {
    id: "offpeak", purpose: "指定日期与淡时段", eyebrow: "A LITTLE MIDWEEK RITUAL",
    contentFormat: "brand_editorial", promotionTerms: "",
    headline: "Tuesday night.\nSushi plans?", subheadline: "A midweek dinner worth planning.",
    cta: "CHECK OUR HOURS", photo: "/demo/photos/restaurant-calendar/sushi-counter.jpg", scene: "weekday",
    description: "用明确星期几建立周中用餐联想；只有确认周二实际营业及活动规则后才能正式发布。",
    socialCopy: "周二也值得好好吃一顿。想找个轻松的用餐时间？欢迎查看门店实际营业时间与当日菜单。\n\n#SakuraSushi #TuesdaySushi",
    approach: ["选定真实营业且有经营需求的日期", "明确表达该时段适合的用餐场景", "活动时间和优惠必须经过门店核实"],
    indicators: ["指定时段咨询", "指定时段订单", "活动带来的预约量"]
  },
  awareness: {
    id: "awareness", purpose: "地区知名度", eyebrow: "HELLO, NEIGHBOUR",
    contentFormat: "real_photo", promotionTerms: "",
    headline: "Sushi in your\nneighbourhood.", subheadline: "Discover the people and counter behind the menu.",
    cta: "GET TO KNOW US", photo: "/demo/photos/restaurant-calendar/sushi-counter.jpg", scene: "neighbourhood",
    description: "真实门店吧台作为主视觉，社媒正文补充已核实的门店地址与服务方式。",
    socialCopy: "你好，邻居！这里是 Sakura Sushi。想认识一家寿司店，可以先从环境、菜单与服务方式开始。真实地址和营业信息会在正式发布前补充。\n\n#SakuraSushi #LocalSushi",
    approach: ["门店环境和服务过程比折扣更重要", "加入可核实的服务地区与门店位置", "持续使用一致的品牌识别"],
    indicators: ["本地用户互动", "地图或地址点击", "品牌名称搜索"]
  },
  unsure: {
    id: "unsure", purpose: "探索营销方向", eyebrow: "START WITH WHAT YOU LOVE",
    contentFormat: "carousel", promotionTerms: "",
    headline: "Not sure what\nto order?", subheadline: "Start with the menu and a favourite dish.",
    cta: "SEE WHAT WE SERVE", photo: "/demo/photos/restaurant-calendar/chef-nigiri.jpg", scene: "discovery",
    description: "不知道推什么时先用真实菜单与顾客选择问题找到方向，不凭空制造新品或促销活动。",
    socialCopy: "不知道今天想吃什么？先来看看一些寿司选择。我们会根据门店实际菜品与顾客问题，继续整理更适合的内容。\n\n#SakuraSushi #DiscoverSushi",
    approach: ["先选择门店真正有代表性的菜品", "看看顾客最常问的问题", "再判断主要目标是到店、单品推广还是持续认知"],
    indicators: ["顾客对不同菜品的兴趣", "菜单访问", "咨询话题分布"]
  }
};

/** Original vector sushi artwork for four non-photographic demo posters. */
function SushiArtwork({ variant }: { variant: SushiCampaign["scene"] }) {
  const pieces = variant === "sharing"
    ? [[75,105,1],[160,87,1.06],[242,122,.88],[107,210,1.07],[211,220,1],[302,204,.9]]
    : variant === "loyalty" ? [[105,140,1.22],[224,118,1.12],[177,235,.94]]
    : variant === "weekday" ? [[115,170,1.25],[247,196,1.04]]
    : [[115,132,1],[218,110,.98],[157,235,1.05],[275,227,.92]];
  return <svg className="storex-sushi-artwork" viewBox="0 0 370 340" role="img" aria-label="原创寿司插画示意，不代表真实商品">
    <defs>
      <linearGradient id={`plate-${variant}`} x1="0" x2="1" y1="0" y2="1"><stop stopColor="#f4e8d8"/><stop offset="1" stopColor="#bdad99"/></linearGradient>
      <linearGradient id={`fish-${variant}`} x1="0" x2="1"><stop stopColor="#ffba7c"/><stop offset=".65" stopColor="#ee7864"/><stop offset="1" stopColor="#c85358"/></linearGradient>
    </defs>
    <ellipse cx="187" cy="185" rx="172" ry="146" fill="#000" opacity=".11"/>
    <ellipse cx="183" cy="166" rx="173" ry="147" fill={`url(#plate-${variant})`}/>
    <ellipse cx="183" cy="162" rx="160" ry="133" fill="#1b3433" stroke="#b4a18e" strokeWidth="8"/>
    {pieces.map(([x,y,scale],i)=><g key={i} transform={`translate(${x} ${y}) rotate(${i%2===0?-14:23}) scale(${scale})`}>
      <ellipse cx="0" cy="9" rx="47" ry="33" fill="#0a1b1b" opacity=".28"/>
      <rect x="-37" y="-20" width="74" height="43" rx="20" fill="#faf2e8"/>
      <rect x="-45" y="-25" width="90" height="33" rx="16" fill={`url(#fish-${variant})`}/>
      <path d="M-25 -20Q-5 -8 24 -18M-21 -10Q-1 0 25 -11M-18 -1Q7 8 28 0" stroke="#ffd4b0" opacity=".7" strokeWidth="3" fill="none"/>
    </g>)}
    <circle cx="294" cy="84" r="19" fill="#e2d5bb" opacity=".9"/>
    <circle cx="294" cy="84" r="12" fill="#4b7051"/>
    <path d="M45 92L58 56M39 99L76 70" stroke="#dcb568" strokeWidth="5" strokeLinecap="round"/>
  </svg>;
}

export function SushiCampaignPoster({ campaign, modal = false }: { campaign: SushiCampaign; modal?: boolean }) {
  return <div className={`storex-poster storex-poster--${campaign.id} storex-poster--format-${campaign.contentFormat} ${modal ? "is-modal" : ""}`} aria-label={`Sakura Sushi ${campaign.purpose}营销海报示例`}>
    <div className="storex-poster-brand"><span className="storex-poster-monogram">桜</span><span>SAKURA <b>SUSHI</b></span><small>CAMPAIGN CONCEPT</small></div>
    <div className="storex-poster-eyebrow">{campaign.eyebrow}</div>
    <div className="storex-poster-message">
      {campaign.headline.split("\n").map((line,i)=><span key={i}>{line}</span>)}
    </div>
    <div className="storex-poster-subheadline">{campaign.subheadline}</div>
    {campaign.photo
      ? <div className="storex-poster-photo"><Image src={campaign.photo} alt={campaign.purpose + "寿司店场景"} fill sizes={modal ? "450px" : "360px"} unoptimized /></div>
      : <div className="storex-poster-illustration"><SushiArtwork variant={campaign.scene}/></div>}
    <div className="storex-poster-action"><span>{campaign.cta}</span><span aria-hidden="true">↗</span></div>
    <div className="storex-poster-signoff">SAKURA SUSHI <span>—</span> MADE WITH CARE</div>
  </div>;
}
