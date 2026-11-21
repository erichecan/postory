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
  approach: string[];
  indicators: string[];
};

export const SUSHI_CAMPAIGNS: Record<SushiCampaignId, SushiCampaign> = {
  footfall: {
    id: "footfall", purpose: "到店与预约", eyebrow: "FRESHLY MADE · LUNCH",
    headline: "Your lunch break,\nmade better.", subheadline: "Take a moment. Enjoy something fresh.",
    cta: "VISIT US FOR LUNCH", photo: "/demo/photos/restaurant-calendar/lunch-set.jpg", scene: "lunch",
    description: "用完整午餐场景传达一顿值得到店享用的寿司，而不只展示一个孤立菜品。",
    socialCopy: "午餐时间，来一份新鲜寿司。想知道今天有什么午餐选择？欢迎联系门店了解当日供应和营业时间。\n\n#SakuraSushi #SushiLunch",
    approach: ["以完整套餐和午餐场景为主视觉", "正文说明经确认的营业时间与到店方式", "最后引导顾客查看菜单或直接到店"],
    indicators: ["午餐时段门店咨询", "导航或菜单链接点击", "可归因的午餐订单"]
  },
  promote: {
    id: "promote", purpose: "重点商品推广", eyebrow: "THE SIGNATURE SERIES",
    headline: "Meet your\nnew favourite.", subheadline: "Discover our signature sushi selection.",
    cta: "EXPLORE THE MENU", photo: "/demo/photos/restaurant-calendar/salmon-dragon-roll.jpg", scene: "signature",
    description: "把单品放大，用不同于午餐海报的构图突出菜品本身，帮助顾客记住一件具体商品。",
    socialCopy: "今天想试点不一样的寿司？来看看我们想介绍的特色菜品。具体配料和供应情况以门店正式菜单为准。\n\n#SakuraSushi #SignatureSushi",
    approach: ["聚焦一款实际有售的主推菜品", "只展示商家已确认的配料与特点", "引导顾客查看菜单，而不是虚构折扣"],
    indicators: ["指定商品咨询", "菜单页访问", "指定菜品销量变化"]
  },
  repeat: {
    id: "repeat", purpose: "会员与回访", eyebrow: "FOR OUR REGULARS",
    headline: "Good to\nsee you again.", subheadline: "Your next sushi night starts here.",
    cta: "PLAN YOUR NEXT VISIT", scene: "loyalty",
    description: "用温暖的回访主题提醒熟悉的顾客再次光临；只有确认了会员权益才加入具体优惠。",
    socialCopy: "好久不见！下一次想吃寿司的时候，希望你还会想起 Sakura Sushi。欢迎了解最新菜单与预约安排。\n\n#SakuraSushi #SeeYouAgain",
    approach: ["面向曾经消费的顾客设计回访理由", "用菜单更新或真实会员资讯提醒", "没有正式优惠规则时绝不杜撰会员折扣"],
    indicators: ["老顾客再次预约", "会员消息互动", "可归因的回访订单"]
  },
  basket: {
    id: "basket", purpose: "组合与客单价", eyebrow: "MADE TO SHARE",
    headline: "Better\ntogether.", subheadline: "A table full of little favourites.",
    cta: "DISCOVER SHARING IDEAS", scene: "sharing",
    description: "用多人分享的餐桌构图，提示顾客把寿司与其他品项搭配起来，而非单纯增加一项价格标签。",
    socialCopy: "两个人吃寿司，怎么搭配更有趣？从寿司卷、握寿司到配菜，看看适合分享的点单思路。实际搭配与价格请以门店菜单为准。\n\n#SakuraSushi #BetterTogether",
    approach: ["展示真实可售的品项组合", "讲清适合几人分享和搭配理由", "如果提供套餐价格，需店主确认后再发布"],
    indicators: ["组合品项咨询", "平均订单金额", "每单商品数量"]
  },
  offpeak: {
    id: "offpeak", purpose: "指定日期与淡时段", eyebrow: "A LITTLE MIDWEEK RITUAL",
    headline: "Make Tuesday\nsushi day.", subheadline: "An easy reason to enjoy the middle of the week.",
    cta: "CHECK OUR HOURS", scene: "weekday",
    description: "把明确的星期几放在视觉中心，让顾客将一个具体时段和到店用餐的想法联系起来。",
    socialCopy: "周二也值得好好吃一顿。想找个轻松的用餐时间？欢迎查看门店实际营业时间与当日菜单。\n\n#SakuraSushi #TuesdaySushi",
    approach: ["选定真实营业且有经营需求的日期", "明确表达该时段适合的用餐场景", "活动时间和优惠必须经过门店核实"],
    indicators: ["指定时段咨询", "指定时段订单", "活动带来的预约量"]
  },
  awareness: {
    id: "awareness", purpose: "地区知名度", eyebrow: "HELLO, NEIGHBOUR",
    headline: "Your neighbourhood\nsushi spot.", subheadline: "A familiar place for a fresh bite.",
    cta: "GET TO KNOW US", photo: "/demo/photos/restaurant-calendar/sushi-counter.jpg", scene: "neighbourhood",
    description: "展示吧台与经营氛围，让还没来过的附近顾客记住这家寿司店的名字和形象。",
    socialCopy: "你好，邻居！这里是 Sakura Sushi。想认识一家寿司店，可以先从环境、菜单与服务方式开始。真实地址和营业信息会在正式发布前补充。\n\n#SakuraSushi #LocalSushi",
    approach: ["门店环境和服务过程比折扣更重要", "加入可核实的服务地区与门店位置", "持续使用一致的品牌识别"],
    indicators: ["本地用户互动", "地图或地址点击", "品牌名称搜索"]
  },
  unsure: {
    id: "unsure", purpose: "探索营销方向", eyebrow: "START WITH WHAT YOU LOVE",
    headline: "There's always\nsomething to try.", subheadline: "Get to know a few Sakura favourites.",
    cta: "SEE WHAT WE SERVE", scene: "discovery",
    description: "给尚未确定目的的商家一张以菜单特色为中心的入门海报，先展示真实内容，再根据经营问题确定方向。",
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
  return <div className={`storex-poster storex-poster--${campaign.id} ${modal ? "is-modal" : ""}`} aria-label={`Sakura Sushi ${campaign.purpose}营销海报示例`}>
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
