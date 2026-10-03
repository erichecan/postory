/**
 * 每周内容节奏（营销日历手册第一章）：没有大节点的日子用这个规则填。
 * 频率取手册"每周3-5条"里的上限5条，选周一/三/四/五/六，让价值内容（新品/幕后/好评）
 * 占多数、促销和互动各占一部分，贴近手册建议的 70/20/10 配比精神，不是精确数学切分。
 */
export type WeeklyRhythmTag = "NEW_PRODUCT" | "BEHIND_THE_SCENES" | "CUSTOMER_REVIEW" | "PROMOTION" | "INTERACTIVE";

// JS Date.getDay()：0=周日 … 6=周六
export const WEEKLY_RHYTHM_BY_WEEKDAY: Partial<Record<number, WeeklyRhythmTag>> = {
  1: "NEW_PRODUCT", // 周一
  3: "BEHIND_THE_SCENES", // 周三
  4: "CUSTOMER_REVIEW", // 周四
  5: "PROMOTION", // 周五
  6: "INTERACTIVE", // 周六
};
