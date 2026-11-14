# 餐厅直销单页、话术与自动化方案

更新时间：2026-10-25

## 本轮定位

主销售对象先定为本地独立餐厅和咖啡店。宣传页路径为 `/our-work/restaurant`，提交资料仍走已有 `/restaurant/request`。主张是：**社媒要持续出现，不是忙完了才想起发一条；内容不能只靠打折，要覆盖顾客认识、喜欢、信任和行动的理由。**

本轮将餐厅页面改成可直接发给潜在客户看的手机优先销售页：先展示月历/作品，再讲内容体系和 `$8.99/day`，最后引导查看 30 天日历并提交资料。月历与作品集目前是样例演示，不是客户真实账号中的实时数据。

## 客户宣传页英文核心文案

**Headline**

Show up all month, without the daily scramble.

**Subhead**

A steady mix of food, people, stories and timely offers—turned into social content and scheduled for your connected accounts.

**Value**

A promotion is one post. Your brand is the whole story. New dishes, customer favourites, kitchen moments, your team, useful tips, local events and timely offers all give people a reason to remember you. A 30-day plan keeps those stories moving, even when service gets busy.

**Brand principle**

The world’s best-known brands still advertise after decades. Consistent visibility is part of building a familiar brand—not a promise that every post will turn into an immediate sale.

**Price for Ireland**

Starter: €149/month for 8 planned posts including 2 short videos, one location, and up to 2 eligible connected platforms. Growth: €299/month for 12 planned posts including 4 short videos, one location, and up to 3 eligible connected platforms. Each plan includes a monthly calendar and one review round. Paid advertising budget is separate.

**CTA**

See My 30-Day Calendar → submit business details → connect eligible social accounts → confirm monthly plan and payment → approve/enable publishing.

## 现有流程与缺口

仓库现有 `/restaurant/request` 可提交餐厅、联系人、平台和活动方向；客户可通过私密链接确认作品、提出修改，并关联 PoStory 账号。餐厅内容可以关联平台、排期，并由 Ayrshare 发布到已连接账号。共享 Stripe 订阅也已存在。

餐厅产品闭环仍缺以下串联，不能把它描述成已经完全自动：

1. 请求被接受后自动生成账户/商户设置清单，并在工作区展示品牌、门店地址、营业时间、电话、网址、预订链接、菜品/服务事实、禁用说法、语气、语言和图片授权。
2. 将社交授权嵌入客户旅程，并验证 Facebook Page、Instagram 专业账号、TikTok 等各渠道是否已实际连接。断连或权限失效要阻止排期并提醒。
3. 将餐厅方案与 Stripe 月订阅绑定：收卡、自动月扣款、自动出收据/发票、付款失败提醒、取消/暂停。已有通用账单代码，不等于餐厅方案已接好。
4. 将“月历 → 内容生成 → 客户审核 → 排期 → 发布 → 失败重试/提示”编排成可观察的异步任务。每条工作用幂等键，防止超时重试造成重复生成和重复发布。
5. 内容日历现在由团队维护；自动生图/视频、行业提示词的版本化、批量任务和成本限额尚未形成端到端流水线。

## 建议的客户流程

1. **先看月历和作品**：展示真实样例并标明为作品示例；月历说明一个月会交替呈现的主题。
2. **提交门店简报**：先填最少必要资料，接受后再补齐品牌事实和素材授权。
3. **连接账号**：按平台引导授权，不要要求顾客交社媒密码。展示账号名称、权限和连接状态。
4. **确认范围与付款**：展示每月金额、内容数量、平台范围、修改次数、广告费另计和取消规则。客户保存支付方式并启动月订阅。
5. **预览首月日历**：首月由客户确认内容方向与品牌事实。首批成品逐条预览并确认。
6. **自动排期发布**：确认后按月历发布。提供暂停、撤回排期、修改、重新授权入口；失败时发提醒并留状态记录。
7. **月度回顾**：自动汇总发布数量、平台状态、链接点击/预约等可取得的数据；不将平台曝光直接表述为销售额。

自动发布需要明确单独授权。建议首月逐条审核；建立信任后允许客户选择“通过整月计划，后续按计划自动发布”。菜单价格、优惠截止时间、地址、营业时间等事实改变时要求客户更新或暂停相关内容。

## 定价与单位经济

当前宣传页改为爱尔兰市场的两个月套餐：Starter €149、Growth €299。这里的增长套餐与之前推荐的 12 条内容/4 条短视频相符；入门套餐限为 8 条/2 条。

一个可测试的标准包（须在落地页/合同最终确认后才宣传）：

- 1 个门店；最多 3 个已连接平台（以已获批的发布能力为准）。
- 每月 12 条内容：例如 8 张模板图 + 4 条 10 秒以内的模板动效短片；同一个素材可以为不同平台重排版。
- 1 份月历、1 次整月方向调整、首批逐条审核；不含广告投放预算、拍摄、复杂剪辑、临时活动和无限次修改。
- 内容多寡、真实视频生成方式、语言数量、平台功能会显著改变成本，不能承诺不限量“天天发帖”。“天天有人运营”表达的是持续规划与维护，而不是每天一条新作品。

官方定价核算快照（2026-10-25，供应商美元标价；按 2026-10-23 加拿大央行参考汇率 US$1 = CA$1.3993 粗算；不含税、刷卡汇差、其它基础设施）：

- Ayrshare Launch 当前 US$299/月，最多 10 个社交 profile；同一客户多个网络共用一个 profile。平均 10 个活跃客户时最低约 US$29.90（约 CA$41.84）/客户/月。1 个客户时整笔约 CA$418.39，尚未算生成、工时、客服和支付手续费。Premium US$149/月仅 1 个 profile，官网定位是管理自己的社媒，不适合作为多客户代发布档。
- Orshot Launch US$39/月（约 CA$54.57）含 1,500 render credits，官方价格表列视频渲染按秒扣点；12 张静态图 + 4 条 10 秒动效约 52 credits/客户/月，10 客户约 520 credits（不包括重试和多版导出）。这个估算只覆盖模板渲染，不代表 AI 视频生成免费。
- Orshot `$39` 套餐只有 300 AI credits，官方约相当于 100 秒 AI 视频；若每客 4 条各 10 秒 AI 视频，10 客户共 400 秒，额度不够。先用客户提供的真照片/视频，加模板裁切、字幕、转场做轻量动效；真正生成新视频另列高级加价档并加硬额度。
- Growth €299 接近 Ayrshare + Orshot 两项基础月费共约 €301.89 的成本底线；客户只有 1 家时仍无法覆盖供应商费，且还未计人工和生成。达到约 10 个活跃 profile 时，每户分摊的基础软件费约 €30.19，两个套餐才有空间覆盖模板化生产。未达 10 个客户前，Starter/Growth 价不要承诺全自动发布并自行承担整笔 Ayrshare 费用：可先采用人工发布试点、等签够客户再启用发布供应商，或收取覆盖实际平台费的自动化试点价。每月看真实工时、重试和 API 账单后再决定是否调价。

估算不是毛利保证。正式发售前把摄影/上传质量、生成模型、人工审核分钟数、销售成本、税费及退款都放入一张按活跃客户数计算的成本表。

## 行业提示词如何分层和维护

不要靠一大段不可追踪的“万能提示词”。提示词分五层，保存版本号、修改人和生效时间：

1. **品牌事实层**：门店提供并确认的菜单、价格、地址、营业时间、预订网址、服务、优惠有效期、语言、品牌语气、禁说事项、图片肖像/版权授权。只可使用确认过的事实；缺字段时不要自行补全。
2. **行业策略层**：每行业维护内容支柱、比例建议、季节性和禁区；每月轮换主题以减少重复。
3. **本月计划层**：每条内容的目标、主题、行动按钮、平台、日期、图片/素材要求，以及与本月其它帖子的差异。
4. **平台输出层**：平台尺寸、字数、标签、CTA、图片文字规则、链接能力及发布接口约束；同一内容可以输出不同的图和文案。
5. **质量门槛层**：事实核对、价格/日期核对、图片版权/肖像授权、重复度、文案敏感内容、平台政策和渲染空白检查。不合格进入待人工处理，不自动发布。

餐厅主题库建议：招牌菜/新品、制作过程、食材来源、厨师与团队、店内氛围、顾客常点组合、经许可的顾客故事/评论、菜单解释、本地活动、季节档期、优惠/活动、预订和外带引导。优惠只是 12 个主题中的一类。

行业模板例子：

- 美甲/美容：作品展示、护理过程、服务说明、常见问题、经同意的前后对比、空档与预订；禁止编造顾客评价、保证疗效或擅自使用顾客照片。
- 家装/维修：工程前后对比、季节保养、安全提示、服务区域、施工流程和真实案例；不虚构执照、保修和报价，也不承诺无法验证的结果。
- 餐饮：菜品、制作、厨房/团队、菜单、新品、用餐体验、本地活动、预订/外带和优惠；价格与优惠只从确认过的菜单数据读取。

维护方式：提示词和行业数据表版本化；用每行业 20–30 组标准输入跑批检查；记录生成后客户批准、改字、重做、拒绝、发布失败和平台拒绝原因；每月由运营者审阅低分案例，只调整失败的层；模型变更后重新跑全部标准输入。客户改了菜单或优惠时使旧事实失效，不静默用旧缓存继续发布。

## 平台内容能力矩阵

| 平台 | 图片里放电话/地址/网址 | 优惠/积分/预订 | 对自动发布的注意 |
|---|---|---|---|
| Facebook | 一般图片文案可展示自家联系信息，但更推荐放在帖子文案、Page 联系信息或经验证的行动按钮；付费广告还要遵守广告政策。 | 可在帖子文案放折扣码/链接；预订通常走按钮或客户官网/第三方预订页；积分由 POS/会员系统管理，Facebook 不应被当成积分账本。 | Page 权限和平台/媒体规格先验证。用平台按钮比把电话号码烧录进图更易点按、更新。 |
| Instagram | 普通图片可把必要门店信息作为图中文字，但避免小字；caption 的网址通常不能当可点击链接使用，优先用资料页链接/行动按钮。 | 可在 caption 放优惠码；预约需合资格专业账号及可用的预订按钮/链接。积分走外部 POS/会员页。 | 只支持合资格专业账号；Meta 发布权限、内容类型会因 API 路径而不同。不要承诺所有 Stories/功能都能自动发。 |
| TikTok | **API 发布的素材不能叠加品牌名、Logo、水印、链接或促销文字。**不要把电话、地址、网址烧录进自动发布版本；用 profile、caption/CTA 和客户网站表达，并按当前规则核验。 | 可在文案里做清楚的行动引导、在主页/广告里用可用链接；优惠兑现与积分最好在预订/订单/POS 系统完成。 | Direct Post 需要获批 `video.publish` 权限和应用审核；未审核的应用发出的内容会是仅自己可见。用户需预览、修改和明确同意；需检查发布状态。应为 TikTok 单独渲染无 Logo/营销字版本。 |
| Google Business Profile | 资料页可展示商家自己的电话、地址和网址。帖文电话规则更严格：不要把电话号码硬塞在帖子文字；用验证过的“Call now”按钮。 | Offer 帖可用标题、日期、券码、条款、链接和“View Offer”；更新帖可放指向预约/订购网页的 CTA。积分仍走 POS/会员系统。 | 不要把 GBP 混同 Facebook/Instagram。酒店对促销有特殊限制；所有内容需符合行业政策并可能被审核。 |

图像规则的产品结论：按平台出不同素材版本。Facebook/Instagram 可按需要放品牌图形；TikTok 自动发布版本去掉水印、Logo、链接和促销字；GBP 使用原图加结构化帖子按钮，避免把手机号写进帖文。电话、地址和网站作为结构化品牌数据单独存储，不让模型自由编造。

## 广告渠道建议

没有一个平台对所有商家“效果最好”。先按意图选目标，并把预约、电话、路线、下单事件回传：

- **Google Search/Maps**：更适合抓“附近餐厅/菜系/现在营业”的主动搜索需求；先完善 Google Business Profile、菜单、电话和预订页，再以低预算测高意图本地关键词/地图位置素材。适合获客和到店意图，不等于发社媒帖。
- **Facebook + Instagram Ads**：适合本地半径、菜单新品、活动优惠、短视频触达、重定向互动人群；小店可以先用一个转化目标（预订/订单/电话/消息）进行小额区域测试，避免只追曝光和点赞。
- **TikTok Ads**：适合新客认知、菜品制作和本地短视频创意；当店铺已有原生短视频素材、有站点 Pixel/转化追踪并能承接访问时再加预算。不要把浏览量当成预约或营收。

初始预算可做 2–4 周小试，不预设保证 ROI。一次只测试一条主要 CTA 和少数素材；记录广告花费、有效电话/预订/下单、到店转化及客单价。付费广告管理和广告金单独报价，不含在 `$269.70/月` 内容运营费里。

## 直销话术

### 第一次接触（现场/电话/私信）

Hi, I help local restaurants stay visible online with a planned mix of menu highlights, behind-the-scenes stories, short videos and timely offers. I made a sample 30-day calendar so you can see what a month could look like for your restaurant. Would you like me to send it over?

### 对方说可以

Send the sample calendar first. Then say: “This is an example of the monthly rhythm—not generic daily discounts. We can build the mix around your dishes, team, events and booking goals. The starting price is $8.99 a day, billed monthly. Would you like to see a plan shaped around your restaurant?”

### 对方问“能保证带来多少客人吗？”

“I can’t promise a number of sales from organic posts. The service is designed to keep your restaurant showing up consistently with relevant content. If you want measurable bookings or calls, we can separately test paid ads and track those actions.”

### 跟进（2–3 天后）

“Just checking whether you had a chance to look at the calendar. If you send me your top dishes, current offers and the social accounts you use, I can point out which content themes would suit your restaurant. No pressure to commit.”

### 邮件版

**Subject:** A 30-day social media plan for {{Restaurant Name}}

Hi {{First Name}},

Running a restaurant leaves little time to keep social media active. A single promotion can help for a moment, but customers also want to see the food, the people, the atmosphere and what is new.

PoStory plans a month of restaurant content—images, short videos and posts for eligible connected social accounts—so your business can show up consistently without adding another daily task to your list.

The starting price is $8.99 per day, billed monthly ($269.70 for a 30-day month). We’ll confirm the content volume and connected platforms with you before the plan starts. Paid advertising is separate.

Here’s a sample calendar and portfolio: {{Link}}

Would you like me to prepare a sample month around {{Restaurant Name}}’s menu and goals?

Best,

{{Your Name}}
## 销售使用顺序

1. 先问是否可以发送样例；冷联系邮件/短信需遵守当地反垃圾及同意规则。
2. 先发月历与作品链接，提示这是样例而非效果承诺。
3. 说明 `$8.99/day` 是按月计费，广告金另计，数量/平台先书面确认。
4. 客户有兴趣后发 `/restaurant/request` 资料表链接；不要求客户发密码。
5. 资料提交后人工确认首月范围与账户资格，再接账号和付款；完整自动化未上线前，销售要说清仍需团队审核。

## 来源（2026-10-25 核验）

- Ayrshare 官方定价：[pricing](https://www.ayrshare.com/pricing/)
- Orshot 官方定价及点数：[pricing](https://orshot.com/pricing)、[render usage](https://orshot.com/help/render-usage-and-credits)
- TikTok 官方：[Direct Post API](https://developers.tiktok.com/docs/en/content-posting-api-reference-direct-post)、[Content Sharing Guidelines](https://developers.tiktok.com/docs/en/content-sharing-guidelines)
- Google 官方：[Business Profile posts](https://support.google.com/business/answer/7342169)、[photos and posts policy](https://support.google.com/business/answer/7213077)
- Google Ads 官方：[local search ads](https://support.google.com/google-ads/answer/2914785)、[location assets](https://support.google.com/google-ads/answer/2404182)
- Meta 官方：[Instagram API collection](https://www.postman.com/meta/instagram/documentation/6yqw8pt/instagram-api)、[Reels ads](https://www.facebook.com/business/ads/facebook-instagram-reels-ads)
- TikTok Ads 官方：[choose ad objective](https://ads.tiktok.com/resources/help/article/choose-right-objective)
- 加拿大央行：[2026-10-23 USD/CAD 参考汇率](https://www.bankofcanada.ca/rates/exchange/daily-exchange-rates-lookup/?dF=2026-09-25&dT=2026-10-25&lP=lookup_daily_exchange_rates_2017.php&rangeType=dates&rangeValue=&sR=2009-03-06&se=FXUSDCAD)
