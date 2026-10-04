export const BRAND = {
  name: "PoStory",
} as const;

export const CONTACT_WECHAT = process.env.NEXT_PUBLIC_CONTACT_WECHAT ?? "";
export const CONTACT_WECHAT_QR = process.env.NEXT_PUBLIC_CONTACT_WECHAT_QR ?? "";

export const LEGAL_ENTITY = process.env.NEXT_PUBLIC_LEGAL_ENTITY || BRAND.name;
export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "";
export const LEGAL_UPDATED = "2026-09-29";
