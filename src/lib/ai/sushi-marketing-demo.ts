import type { VideoMarketingPlanHandoff } from "@/lib/ai/video-marketing-plan-handoff";

/** A clearly labelled, reusable sample built from bundled demo photos, not from a merchant's real menu or footage. */
export const SUSHI_MARKETING_DEMO: VideoMarketingPlanHandoff = {
  id: "demo-sushi-marketing-week-2026-11",
  createdAt: Date.now(),
  products: [
    { id: "sushi-demo-roll", videoName: "示例素材：招牌卷物", name: "招牌卷物（待商家核名）", reason: "示例照片展示卷物拼盘；具体菜名、配料与供应情况需门店确认。", confidence: "medium", originalImageDataUrl: "/demo/photos/restaurant-calendar/salmon-dragon-roll.jpg", optimizedImageDataUrl: null, currentPrice: "", promotionalPrice: "", productFacts: "" },
    { id: "sushi-demo-nigiri", videoName: "示例素材：握寿司制作", name: "握寿司（待商家核名）", reason: "示例照片展示厨师制作握寿司；鱼种、来源与菜单名称需门店确认。", confidence: "medium", originalImageDataUrl: "/demo/photos/restaurant-calendar/chef-nigiri.jpg", optimizedImageDataUrl: null, currentPrice: "", promotionalPrice: "", productFacts: "" },
    { id: "sushi-demo-lunch", videoName: "示例素材：午餐组合", name: "午餐组合（待商家核名）", reason: "示例照片用于演示午餐内容；实际组成、供应时段与售价需门店确认。", confidence: "medium", originalImageDataUrl: "/demo/photos/restaurant-calendar/lunch-set.jpg", optimizedImageDataUrl: null, currentPrice: "", promotionalPrice: "", productFacts: "" },
    { id: "sushi-demo-platter", videoName: "示例素材：分享拼盘", name: "分享拼盘（待商家核名）", reason: "示例照片用于演示多人分享场景；份量、适用人数与菜品组成需门店确认。", confidence: "medium", originalImageDataUrl: "/demo/photos/restaurant-calendar/guest-favourites.jpg", optimizedImageDataUrl: null, currentPrice: "", promotionalPrice: "", productFacts: "" },
  ],
  activities: [],
  customerFacts: "寿司店示例。这里只使用项目内置的演示照片，不代表真实门店菜单、价格、库存、营业时间或优惠。",
  goal: "store_visits",
  location: "门店周边 5 公里（示例设定，待商家确认）",
  startDate: "2026-11-16",
  endDate: "2026-11-22",
  platforms: ["Instagram", "Facebook", "TikTok", "小红书"],
  notes: "示例计划：以真实菜品素材建立信任，安排招牌菜、制作过程、午餐场景与多人分享内容；价格、优惠、食材、过敏原、门店地址及营业时间均待商家确认。",
  formValues: {
    goal: "store_visits", location: "门店周边 5 公里（示例设定，待商家确认）", startDate: "2026-11-16", endDate: "2026-11-22",
    platforms: ["Instagram", "Facebook", "TikTok", "小红书"], budget: "", notes: "寿司店示例：菜名、售价、优惠、过敏原、营业时间未确认，不在文案中编造。",
    prices: {}, activityOfferType: "not_set", activityDiscount: "", activityTerms: "",
  },
  generatedPlan: {
    campaignTitle: "寿司店一周内容计划｜用真实菜品带动附近到店",
    strategySummary: "围绕门店现有的寿司菜品与制作过程，安排一周内容：先展示菜品，再展示制作和用餐场景，最后以到店或咨询作为行动引导。样例素材来自项目内置演示照片，不是商家实拍；发布前需用门店真实素材替换，并核实菜单、供货和营业信息。",
    targetAudience: "门店周边约 5 公里内，正在寻找便捷午餐、晚餐或多人聚餐选择的本地居民与上班族。范围为示例设定，需按门店位置调整。",
    offerStrategy: "本轮不虚构折扣或套餐价格。先用招牌菜、制作过程和用餐场景吸引关注；商家确认午餐时段、套餐组成和价格后，再将优惠信息加入对应帖子。",
    productPlans: [
      { productName: "招牌卷物（待商家核名）", positioning: "以切面、摆盘和制作细节呈现视觉吸引力；菜名和配料需核实。", offerRecommendation: "不先承诺折扣。可在核实菜单后突出门店招牌或顾客常点品项。", messageAngle: "近景展示卷物纹理与摆盘，引导顾客到菜单查看完整信息。" },
      { productName: "握寿司（待商家核名）", positioning: "用手作过程和出品细节展示现做体验；鱼种与来源未经确认。", offerRecommendation: "使用制作过程作为内容价值，不添加价格或食材来源声明。", messageAngle: "从厨师手部操作切入，突出制作过程与出餐瞬间。" },
      { productName: "午餐组合（待商家核名）", positioning: "呈现午间用餐场景，帮助附近上班族判断是否适合自己的午餐安排。", offerRecommendation: "确认套餐组成、供应时段和售价后再写具体套餐信息。", messageAngle: "用完整桌面画面说明午餐选择，并引导查看当日菜单。" },
      { productName: "分享拼盘（待商家核名）", positioning: "呈现多人分享的用餐场景；份量和适用人数需确认。", offerRecommendation: "可在商家确认份量后介绍分享场景，不预设人数或价格。", messageAngle: "从上桌全景与夹取细节表现聚餐氛围。" },
    ],
    schedule: [
      { date: "2026-11-16", platform: "Instagram", productName: "招牌卷物（待商家核名）", objective: "建立菜品第一印象", concept: "招牌卷物近景：完整呈现摆盘与切面", copy: "今天想吃点什么？来看看店里的卷物和寿司选择。具体菜名、配料与供应情况以门店当日菜单为准。", callToAction: "查看当日菜单，或到店看看。", visualDirection: "使用门店真实菜品照片；补拍自然光近景、完整摆盘和切面。不要添加未经确认的菜名、食材或价格。", referenceImageDataUrl: "/demo/photos/restaurant-calendar/roll-made-to-order.jpg" },
      { date: "2026-11-17", platform: "TikTok", productName: "握寿司（待商家核名）", objective: "用过程内容呈现制作体验", concept: "握寿司制作短视频：手部操作到出餐", copy: "从制作到上桌，一份寿司是这样完成的。想看当天供应哪些选择，欢迎到店了解。", callToAction: "收藏这条视频，来店时查看当日菜单。", visualDirection: "拍摄 10–15 秒竖屏片段：准备、制作、摆盘、出餐。先确认店内允许拍摄，并核对画面中的菜品名称。", referenceImageDataUrl: "/demo/photos/restaurant-calendar/chef-nigiri.jpg" },
      { date: "2026-11-18", platform: "Facebook", productName: "午餐组合（待商家核名）", objective: "触达附近午餐客群", concept: "午餐桌面与门店氛围", copy: "附近午餐有什么选择？可以来看看店里的寿司和午餐菜单。套餐内容、供应时段与价格请以门店确认信息为准。", callToAction: "查看菜单或联系门店确认午餐供应。", visualDirection: "用真实午餐桌面照片，保留份量和配菜的真实样貌。确认套餐信息后，再补充名称、时段和售价。", referenceImageDataUrl: "/demo/photos/restaurant-calendar/lunch-set.jpg" },
      { date: "2026-11-19", platform: "小红书", productName: "招牌卷物（待商家核名）", objective: "提供到店选择参考", concept: "一图看店内寿司选择与用餐氛围", copy: "在附近找寿司店？这组照片带你看看店里的出品和用餐环境。具体菜品与当天供应请以门店菜单为准。", callToAction: "收藏作参考，到店前查看营业时间。", visualDirection: "使用门店实拍的菜品、柜台和座位照片；发布前补上核实过的地址与营业时间。避免使用演示素材冒充该店实拍。", referenceImageDataUrl: "/demo/photos/restaurant-calendar/sushi-counter.jpg" },
      { date: "2026-11-20", platform: "Instagram", productName: "握寿司（待商家核名）", objective: "展示制作细节并促成咨询", concept: "厨师制作过程的幕后片段", copy: "镜头记录制作过程，也让你看看寿司从准备到出餐的细节。关于鱼种、过敏原或供应情况，请直接向门店确认。", callToAction: "有食材或过敏原问题，请在下单前询问门店。", visualDirection: "拍摄厨师操作与成品，不做未经核实的“最新鲜”“本地采购”等品质承诺；若提及食材，先由门店确认。", referenceImageDataUrl: "/demo/photos/restaurant-calendar/fresh-ingredients.jpg" },
      { date: "2026-11-21", platform: "Facebook", productName: "分享拼盘（待商家核名）", objective: "连接周末聚餐场景", concept: "多人共享寿司的桌面场景", copy: "周末和朋友一起吃饭，可以看看店里的寿司选择。拼盘组成、份量和适用人数欢迎向门店确认。", callToAction: "提前联系门店确认座位与拼盘供应。", visualDirection: "拍摄真实多人用餐桌面，避免暗示未核实的拼盘人数、售价或预约政策。获得顾客同意后再拍摄可识别人物。", referenceImageDataUrl: "/demo/photos/restaurant-calendar/sushi-night.jpg" },
      { date: "2026-11-22", platform: "TikTok", productName: "分享拼盘（待商家核名）", objective: "回顾本周内容并引导到店", concept: "本周菜品与制作画面合集", copy: "这一周的寿司与制作片段回顾。想知道今天有哪些菜品供应，欢迎查看当日菜单或联系门店。", callToAction: "查看当日菜单，确认供应与营业时间后再出发。", visualDirection: "仅剪辑门店实际拍摄并获准使用的素材；用字幕呈现经核实的店名、地址和营业时间，不使用虚构优惠。", referenceImageDataUrl: "/demo/photos/restaurant-calendar/bento-lunch.jpg" },
    ],
    budgetStrategy: "未提供预算，因此本示例按自然内容发布规划，不假设会投放广告。若之后确认预算，可先在门店可服务的地理范围内小额测试表现较好的内容，再按到店咨询和兑换结果调整。",
    successMeasures: ["各平台触达、播放完成和收藏/分享情况", "从帖子带来的菜单查看、电话/私信咨询数量", "顾客到店时自愿提及社媒内容的人数", "如设置专属且已确认的兑换口令，记录实际核销次数"],
    confirmations: ["核对四类演示菜品对应的真实菜名、配料和供应情况。", "确认午餐组合与分享拼盘的内容、份量、供应时段和价格。", "确认地址、营业时间、预约方式及门店拍摄许可。", "用寿司店自己的实拍替换所有项目内置演示照片，并确认发布授权。", "如需宣传折扣或套餐，先确认规则、有效日期及例外条件。"],
  },
};
