export const SCENES = ["dishCloseup", "drinkPoster", "newArrival", "beforeAfter", "salonInterior", "holidaySale"] as const;
export type SceneId = (typeof SCENES)[number];

export const RATIOS = [
  { id: "square", w: 1, h: 1, canvas: { width: 1080, height: 1080 } },
  { id: "portrait", w: 4, h: 5, canvas: { width: 1080, height: 1350 } },
  { id: "story", w: 9, h: 16, canvas: { width: 1080, height: 1920 } },
  { id: "landscape", w: 16, h: 9, canvas: { width: 1920, height: 1080 } },
] as const;
export type RatioId = (typeof RATIOS)[number]["id"];

export type Quality = "standard" | "hd";
export type StudioMode = "photo" | "text";

export const UPLOAD_MAX_BYTES = 10 * 1024 * 1024;
export const UPLOAD_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export const RATIO_IDS = RATIOS.map((r) => r.id) as [RatioId, ...RatioId[]];

export type Round = { id: string; url: string; prompt: string; quality: Quality; ratio: RatioId };
