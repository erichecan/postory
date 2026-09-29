export const SCENES = ["dishCloseup", "drinkPoster", "newArrival", "beforeAfter", "salonInterior", "holidaySale"] as const;
export type SceneId = (typeof SCENES)[number];

export const RATIOS = [
  { id: "square", w: 1, h: 1 },
  { id: "portrait", w: 4, h: 5 },
  { id: "story", w: 9, h: 16 },
  { id: "landscape", w: 16, h: 9 },
] as const;
export type RatioId = (typeof RATIOS)[number]["id"];

export type Quality = "standard" | "hd";
export type StudioMode = "photo" | "text";

export const UPLOAD_MAX_BYTES = 10 * 1024 * 1024;
export const UPLOAD_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export type Round = { id: string; url: string; prompt: string; quality: Quality; ratio: RatioId };
