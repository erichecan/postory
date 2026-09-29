export const BRAND = {
  name: "Postory",
} as const;

export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "hello@postory.app";
export const CONTACT_HREF = `mailto:${CONTACT_EMAIL}`;
