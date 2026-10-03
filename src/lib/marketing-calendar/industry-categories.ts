import type { Industry } from "@/generated/prisma/client";

/**
 * Template.categories 是中英混杂的自由标签（历史遗留，见 20261003 DEV-PLAN 风险点 3），
 * 这里维护行业枚举到实际标签字符串的映射，不对外展示，只用于日历生成时筛选候选模板。
 */
export const INDUSTRY_TEMPLATE_CATEGORIES: Record<Industry, string[]> = {
  FOOD_TAKEAWAY: ["餐饮", "Food", "Restaurant"],
  BEAUTY_HAIR: ["美发", "美容", "美甲", "Beauty"],
  FITNESS: ["健身", "Fitness"],
  PHONE_REPAIR: ["手机维修", "手机壳批发", "数据线", "3C数码产品"],
  OTHER: [],
};
