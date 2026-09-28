export const PLATFORMS = [
  { id: "instagram-post", label: "Instagram 帖子" },
  { id: "instagram-story", label: "Instagram 快拍" },
  { id: "youtube", label: "YouTube 封面" },
  { id: "twitter", label: "X / Twitter" },
  { id: "pinterest", label: "Pinterest" },
  { id: "facebook", label: "Facebook" },
] as const;

export type PlatformId = (typeof PLATFORMS)[number]["id"];

export const PUBLISH_TARGETS = ["小红书", "微信朋友圈", "抖音", "Instagram", "Facebook", "X / Twitter"] as const;

export function platformLabel(id: string) {
  return PLATFORMS.find((p) => p.id === id)?.label ?? id;
}

export function isPlatformId(value: string | undefined): value is PlatformId {
  return PLATFORMS.some((p) => p.id === value);
}
