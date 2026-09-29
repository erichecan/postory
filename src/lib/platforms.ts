export const PLATFORMS = [
  { id: "instagram-post" },
  { id: "instagram-story" },
  { id: "youtube" },
  { id: "twitter" },
  { id: "pinterest" },
  { id: "facebook" },
] as const;

export type PlatformId = (typeof PLATFORMS)[number]["id"];

export const BASE_PUBLISH_PLATFORMS = ["facebook", "instagram", "tiktok", "xiaohongshu"] as const;
export const EXTRA_PUBLISH_PLATFORMS = ["x", "youtube", "pinterest", "linkedin", "threads", "douyin", "wechat-moments"] as const;
export const PUBLISH_PLATFORMS = [...BASE_PUBLISH_PLATFORMS, ...EXTRA_PUBLISH_PLATFORMS] as const;
export type PublishPlatformId = (typeof PUBLISH_PLATFORMS)[number];

export function isPublishPlatform(value: string): value is PublishPlatformId {
  return (PUBLISH_PLATFORMS as readonly string[]).includes(value);
}

export function isExtraPlatform(value: string): value is (typeof EXTRA_PUBLISH_PLATFORMS)[number] {
  return (EXTRA_PUBLISH_PLATFORMS as readonly string[]).includes(value);
}

type Translate<K extends string> = (key: K) => string;

export function isPlatformId(value: string | undefined): value is PlatformId {
  return PLATFORMS.some((p) => p.id === value);
}

export function platformLabel(t: Translate<`platform.${PlatformId}`>, id: string) {
  return isPlatformId(id) ? t(`platform.${id}`) : id;
}

export function publishPlatformLabel(t: Translate<`publish.${PublishPlatformId}`>, value: string) {
  return isPublishPlatform(value) ? t(`publish.${value}`) : value;
}
