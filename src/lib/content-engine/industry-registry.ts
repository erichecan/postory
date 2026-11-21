/**
 * PoStory Content Engine: industry-facing presentation and promotion policy.
 * This is a source-of-truth proposal for new vertical routes. It does not
 * mutate existing /store behavior until that workflow is migrated deliberately.
 */
export const INDUSTRY_CONFIGS = {
  sushi: {
    slug: "sushi",
    label: "寿司／日式餐饮",
    customerPath: "/for/sushi",
    contentLocale: ["zh", "en"],
    goals: [
      { id: "lunch_traffic", label: "增加午餐到店和预订", commonCategory: "acquisition", example: "工作日午餐、店内推荐、订位" },
      { id: "featured_dish", label: "推广招牌寿司或新品", commonCategory: "conversion", example: "真实菜品特写、菜单介绍" },
      { id: "return_visits", label: "让老顾客再次回来", commonCategory: "retention", example: "新菜单、已确认的回访活动" },
      { id: "sharing_sets", label: "推荐双人或多人分享组合", commonCategory: "order_value", example: "实际有售的分享套餐" },
      { id: "quiet_periods", label: "改善指定日期或淡时段生意", commonCategory: "time_slot", example: "工作日非高峰时段" },
      { id: "local_awareness", label: "让附近的人认识寿司店", commonCategory: "awareness", example: "门店环境、厨师、真实服务" },
    ],
    promotionTypes: ["none", "fixed_price", "percent_off", "bundle", "buy_x_get_y", "gift_with_purchase", "member_event", "time_slot"],
    prohibitedClaims: ["未经确认的食材产地", "杜撰过敏原信息", "虚构优惠价格", "未经确认的稀缺性"],
    requiredBrandAssets: ["businessName", "storefront", "productPhotos"],
    recommendedContent: ["menu_hero", "dish_closeup", "sharing_combo", "local_story", "offer_poster"],
  },
  nail: {
    slug: "nail",
    label: "美甲与美容",
    customerPath: "/for/nail",
    contentLocale: ["zh", "en"],
    goals: [
      { id: "bookings", label: "获得更多项目预约", commonCategory: "acquisition", example: "项目与预约档期" },
      { id: "design_showcase", label: "展示最新款式和真实作品", commonCategory: "conversion", example: "手部实拍作品" },
      { id: "client_returns", label: "提醒老客回来预约", commonCategory: "retention", example: "新款、换季、会员计划" },
      { id: "fill_slots", label: "改善空闲预约时段", commonCategory: "time_slot", example: "空档说明与预约入口" },
      { id: "local_reputation", label: "建立本地口碑和辨识度", commonCategory: "awareness", example: "团队与真实环境" },
    ],
    promotionTypes: ["none", "fixed_price", "first_visit", "member_event", "time_slot", "bundle"],
    prohibitedClaims: ["未经确认的疗效", "虚构客户前后对比", "保证持久时间", "虚构预约余量"],
    requiredBrandAssets: ["businessName", "servicePhotos"],
    recommendedContent: ["service_showcase", "seasonal_design", "local_story", "booking_prompt"],
  },
  roofing: {
    slug: "roofing",
    label: "屋顶／装修服务",
    customerPath: "/for/roofing",
    contentLocale: ["zh", "en"],
    goals: [
      { id: "quote_requests", label: "获得上门评估或报价咨询", commonCategory: "acquisition", example: "服务范围、咨询流程" },
      { id: "project_proof", label: "展示真实工程和专业施工", commonCategory: "conversion", example: "授权的施工前中后照片" },
      { id: "trust", label: "建立施工可信度与本地认知", commonCategory: "awareness", example: "工作现场、团队、材料与过程" },
      { id: "seasonal", label: "推广季节检查或保养", commonCategory: "time_slot", example: "秋冬检查与真实服务项目" },
      { id: "referrals", label: "让邻居更容易推荐我们", commonCategory: "retention", example: "服务区域与推荐方式" },
    ],
    promotionTypes: ["none", "consultation", "seasonal_service", "fixed_price"],
    prohibitedClaims: ["虚构执照和保险", "未经授权的完工案例", "保证不漏水", "虚构保修年限"],
    requiredBrandAssets: ["businessName", "projectPhotos", "serviceArea"],
    recommendedContent: ["project_showcase", "service_explainer", "quote_prompt", "local_story"],
  },
  accounting: {
    slug: "accounting",
    label: "会计／税务服务",
    customerPath: "/for/accounting",
    contentLocale: ["zh", "en"],
    goals: [
      { id: "consultations", label: "获取合适的税务咨询", commonCategory: "acquisition", example: "服务领域与预约要求" },
      { id: "expertise", label: "解释专业服务与流程", commonCategory: "awareness", example: "报税前准备事项" },
      { id: "tax_season", label: "提醒报税季预约", commonCategory: "time_slot", example: "官方截止日期与咨询时间" },
      { id: "business_clients", label: "获得企业服务客户", commonCategory: "conversion", example: "企业会计服务范围" },
    ],
    promotionTypes: ["none", "consultation", "service_bundle"],
    prohibitedClaims: ["保证退税", "虚构持牌资质", "收集敏感财务信息用于公开文案", "承诺无依据的节税幅度"],
    requiredBrandAssets: ["businessName", "serviceArea"],
    recommendedContent: ["education_carousel", "service_explainer", "booking_prompt"],
  },
  fitness: {
    slug: "fitness",
    label: "健身与运动",
    customerPath: "/for/fitness",
    contentLocale: ["zh", "en"],
    goals: [
      { id: "trial_bookings", label: "获得体验课预约", commonCategory: "acquisition", example: "教练与课程体验" },
      { id: "classes", label: "推广具体课程", commonCategory: "conversion", example: "课程时间与真实上课环境" },
      { id: "renewals", label: "提高会员续费与参与", commonCategory: "retention", example: "会员活动" },
      { id: "class_slots", label: "填充指定课程名额", commonCategory: "time_slot", example: "已确认的课程档期" },
    ],
    promotionTypes: ["none", "first_visit", "member_event", "time_slot", "bundle"],
    prohibitedClaims: ["保证体重变化", "虚构康复结果", "虚构课程剩余名额"],
    requiredBrandAssets: ["businessName", "servicePhotos"],
    recommendedContent: ["class_showcase", "coach_story", "booking_prompt", "offer_poster"],
  },
} as const;

export type IndustrySlug = keyof typeof INDUSTRY_CONFIGS;
export type IndustryGoal = (typeof INDUSTRY_CONFIGS)[IndustrySlug]["goals"][number];
export type PromotionKind = (typeof INDUSTRY_CONFIGS)[IndustrySlug]["promotionTypes"][number];
export type CommonGoalCategory = "acquisition" | "conversion" | "retention" | "order_value" | "time_slot" | "awareness";

export function getIndustryConfig(slug: string) {
  return Object.hasOwn(INDUSTRY_CONFIGS, slug) ? INDUSTRY_CONFIGS[slug as IndustrySlug] : null;
}

export function industrySupportsPromotion(industry: IndustrySlug, type: string): boolean {
  return (INDUSTRY_CONFIGS[industry].promotionTypes as readonly string[]).includes(type);
}

export function industrySupportsGoal(industry: IndustrySlug, goal: string): boolean {
  return INDUSTRY_CONFIGS[industry].goals.some((item) => item.id === goal);
}
