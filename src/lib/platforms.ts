export const PLATFORMS = [
  { id: "instagram-post" },
  { id: "instagram-story" },
  { id: "youtube" },
  { id: "twitter" },
  { id: "pinterest" },
  { id: "facebook" },
] as const;

export type PlatformId = (typeof PLATFORMS)[number]["id"];

export const PUBLISH_TARGETS = ["小红书", "微信朋友圈", "抖音", "Instagram", "Facebook", "X / Twitter"] as const; // i18n-allow: 存库的值

export type PublishTarget = (typeof PUBLISH_TARGETS)[number];

type PublishTargetKey = "xiaohongshu" | "wechatMoments" | "douyin" | "instagram" | "facebook" | "twitter";

const PUBLISH_TARGET_KEYS: Record<PublishTarget, PublishTargetKey> = {
  小红书: "xiaohongshu", // i18n-allow
  微信朋友圈: "wechatMoments", // i18n-allow
  抖音: "douyin", // i18n-allow
  Instagram: "instagram",
  Facebook: "facebook",
  "X / Twitter": "twitter",
};

type Translate<K extends string> = (key: K) => string;

export function isPlatformId(value: string | undefined): value is PlatformId {
  return PLATFORMS.some((p) => p.id === value);
}

export function platformLabel(t: Translate<`platform.${PlatformId}`>, id: string) {
  return isPlatformId(id) ? t(`platform.${id}`) : id;
}

function isPublishTarget(value: string): value is PublishTarget {
  return Object.hasOwn(PUBLISH_TARGET_KEYS, value);
}

export function publishTargetLabel(t: Translate<`target.${PublishTargetKey}`>, value: string) {
  return isPublishTarget(value) ? t(`target.${PUBLISH_TARGET_KEYS[value]}`) : value;
}
