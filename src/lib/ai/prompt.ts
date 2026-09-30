import type { SceneId } from "@/components/create/studio-options";

const SCENE_BRIEFS: Record<SceneId, string> = {
  dishCloseup: "appetizing close-up food photography, shallow depth of field, soft natural side light, restaurant-menu quality",
  drinkPoster: "vibrant beverage poster, condensation on the glass, clean studio backdrop, bold commercial lighting",
  newArrival: "new product launch visual, hero product centered, minimal premium set design, subtle spotlight",
  beforeAfter: "beauty salon before-and-after showcase, clean split composition, flattering soft light, professional finish",
  salonInterior: "inviting shop interior, warm ambient lighting, tidy and spacious, lifestyle photography",
  holidaySale: "festive promotional scene, seasonal decorations, cheerful warm palette, space left for sale text",
};

export type PromptInput = {
  mode: "photo" | "text";
  scene: SceneId | null;
  userPrompt: string;
  brand: { shopName: string | null; slogan: string | null } | null;
  refine: boolean;
};

export function buildPrompt({ mode, scene, userPrompt, brand, refine }: PromptInput) {
  const parts: string[] = [];
  if (refine) {
    parts.push(`Edit the provided image: ${userPrompt}. Keep the subject, composition and everything not mentioned unchanged.`);
  } else {
    parts.push(mode === "photo" ? "Enhance the provided photo into a polished social-media marketing image. Keep the real product recognisable." : "Create a polished social-media marketing image.");
    if (scene) parts.push(`Style: ${SCENE_BRIEFS[scene]}.`);
    if (userPrompt) parts.push(`Customer request: ${userPrompt}.`);
  }
  if (brand?.shopName) parts.push(`Brand: "${brand.shopName}"${brand.slogan ? `, tagline "${brand.slogan}"` : ""}; match a small local business look.`);
  parts.push("No watermark. Do not render any text unless explicitly requested.");
  return parts.join(" ");
}
