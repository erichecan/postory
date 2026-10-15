import type { RatioId } from "@/components/create/studio-options";

export type DemoIndustry = "nails" | "sushi";

type CampaignRecipe = {
  name: string;
  composition: string;
  artDirection: string;
  colorAndLight: string;
  photoTreatment: string;
};

const INDUSTRY_PROFILES: Record<DemoIndustry, string> = {
  sushi: [
    "INDUSTRY: sushi restaurant marketing.",
    "SUBJECT FIDELITY: Treat the uploaded food as the exact product being advertised. Preserve its sushi type, visible ingredients, piece count, cut and shape, rice and topping appearance, garnish, plate or tray, and recognizable serving presentation. Never add, remove, replace, duplicate, or invent food or ingredients. Do not turn one sushi type into another.",
    "ALLOWED PHOTO EDITS: Improve the actual photo with restrained commercial food photography retouching: correct exposure and white balance, recover plausible detail from mild softness, reduce noise and compression, improve natural clarity and appetizing but believable color, and refine contrast and local light. You may extend or replace only the surrounding background, adjust crop/scale/position, and add subtle non-food props or ambient light when the chosen direction calls for it. Keep the food itself faithful; do not synthesize texture or garnish.",
  ].join(" "),
  nails: [
    "INDUSTRY: nail salon marketing.",
    "SUBJECT FIDELITY: Treat the uploaded manicure as the exact service being advertised. Preserve each visible nail's design, length, shape, polish color, cat-eye or glitter pattern, decorations, number of fingers, natural hand anatomy, skin tone, and recognizable pose. Never redesign the manicure, change colors or decorations, add or remove fingers, add jewelry, or distort the hand.",
    "ALLOWED PHOTO EDITS: Apply restrained beauty-photo retouching: correct exposure and white balance, recover only plausible detail from mild softness, reduce noise and compression, improve natural clarity and polish reflections, and refine skin tone without plastic smoothing. You may extend or replace only the surrounding background, adjust crop/scale/position, and add subtle non-hand props or ambient light when the chosen direction calls for it. Do not fabricate nail art or skin detail.",
  ].join(" "),
};

const RECIPES: Record<DemoIndustry, Record<string, CampaignRecipe>> = {
  sushi: {
    "new-arrival": {
      name: "New arrival hero",
      composition: "Build a bold new-menu hero: one large, close, appetizing view of the uploaded signature sushi is the visual anchor in the lower-right or lower-center. Keep a calm, clean negative-space zone in the upper-left for a short headline. Create clear separation between food and background; the dish should occupy roughly 55–70% of the canvas without clipping its defining details.",
      artDirection: "Contemporary Japanese restaurant editorial, polished campaign art direction, confident asymmetry, crisp hierarchy, premium but approachable. The food remains photographic, never illustrated or collaged.",
      colorAndLight: "Use warm ivory, vermilion accents, and restrained charcoal. Directional softbox light with appetizing highlights and natural shadows; keep salmon and rice colors realistic.",
      photoTreatment: "Make the existing sushi photo feel freshly shot for a menu launch: lift muddy shadows, correct color cast, improve focus impression and micro-contrast naturally, and create a gentle depth separation from a refined restaurant background.",
    },
    "lunch-set": {
      name: "Lunch set / combo offer",
      composition: "Use a clear menu-board composition with the uploaded meal as a substantial hero on the right or lower half and a quieter text-safe panel on the left or top. Reserve distinct space for a set name, included items, and an optional price; never invent or render those words or numbers. If the uploaded image is a single item, do not fabricate a combo platter.",
      artDirection: "Energetic casual-dining promotion with strong geometric blocks, editorial food photography, concise visual hierarchy, and tidy alignment; make the meal feel like a convenient lunch choice, not a luxury tasting menu.",
      colorAndLight: "Use warm cream with tomato red and a small golden accent. Bright midday light, clean tabletop, readable contrast and naturally vivid food.",
      photoTreatment: "Brighten the true food photograph, retain ingredient detail, and harmonize its surrounding table/background with a fresh lunch setting. Do not add food, utensils that obscure it, or prices/labels.",
    },
    "healthy-light": {
      name: "Fresh and light",
      composition: "Create an airy editorial layout with the uploaded sushi as a crisp, generously sized focal point, surrounded by open breathing room. Place visual weight low or to one side and preserve a broad light negative-space area for copy. Avoid clutter and keep all defining food details inside a central safe area.",
      artDirection: "Fresh, minimal Japanese café campaign: refined natural materials, subtle paper-like texture, clean grid, restrained typography space, calm premium simplicity.",
      colorAndLight: "Pale warm ivory, soft leaf green, and a small coral accent. Diffused daylight, gentle shadows, neutral white balance and believable ingredient color; do not imply health claims.",
      photoTreatment: "Give the uploaded image a clean daylight finish with balanced highlights and realistic clarity. Keep any surrounding styling understated and never alter the ingredients or imply unverified nutritional benefits.",
    },
    "limited-offer": {
      name: "Limited-time offer",
      composition: "Design a high-impact promotion with a large, uncluttered hero of the uploaded sushi and one reserved high-contrast badge area for offer details. Establish a strong headline zone separate from the food. Keep the offer badge blank: do not create a discount, deadline, price, or claim.",
      artDirection: "Bold retail campaign with decisive blocks, clean edges, tight hierarchy, and one dynamic diagonal or circular accent. Avoid cheap sticker clutter, excessive bursts, and fake labels.",
      colorAndLight: "Use deep vermilion or lacquer red, creamy white, and a small dark accent. High contrast with controlled studio highlights while preserving realistic food color.",
      photoTreatment: "Increase visual punch through lighting and background contrast around the actual uploaded product. Retain natural texture and do not modify or multiply the food.",
    },
    "seafood-feature": {
      name: "Seafood feature",
      composition: "Make the visible seafood topping the immediate focal point. Use an editorial close crop with the plate or serving context still legible, and preserve a generous quiet field for a short feature title. Do not add seafood varieties not present in the upload.",
      artDirection: "Fresh market-meets-Japanese-menu editorial, tactile but refined, with a confident crop and a subtle handcrafted accent rather than decorative clutter.",
      colorAndLight: "Pearl cream, ink blue, and restrained coral. Cool-clean daylight balanced with soft warm reflections; keep seafood hue and freshness realistic, never neon.",
      photoTreatment: "Emphasize the existing seafood's naturally visible sheen and detail with subtle local contrast and clean color correction. Do not invent gloss, moisture, ingredients, or freshness evidence.",
    },
    "premium-signature": {
      name: "Premium signature dish",
      composition: "Use a quiet luxury composition: the uploaded signature dish sits as a carefully lit hero with elegant negative space around it. Keep the plate complete where possible, avoid busy props, and leave one refined copy zone away from the food.",
      artDirection: "High-end Japanese dining editorial, restrained asymmetry, fine material detail, measured spacing, and a sophisticated menu-campaign finish. No faux calligraphy or imitation brand marks.",
      colorAndLight: "Ink black, warm stone, muted brass highlights. Low-key directional lighting with delicate highlights; preserve accurate food color and shadow detail.",
      photoTreatment: "Refine tonal depth and plate highlights without making the uploaded meal look different. Use a subtle dark tabletop/background treatment and natural falloff.",
    },
    "signature-platter": {
      name: "Signature platter",
      composition: "Present the uploaded platter as the main graphic shape, preferably from its existing viewpoint. Center or slightly offset the complete visible arrangement, preserve plate edges and food count, and use a restrained framing device or circular field behind it. Reserve a narrow title area outside the plate.",
      artDirection: "Confident restaurant menu hero with bold scale, clean framing, editorial precision, and a strong focal point. Do not convert the photo into an overhead view if the upload is not overhead.",
      colorAndLight: "Deep charcoal or warm cream selected to complement the actual upload, with one red accent. Controlled studio contrast and realistic highlights.",
      photoTreatment: "Improve legibility across the real platter, gently balance exposure, and separate it from its background. Do not complete cropped food by inventing pieces or change the arrangement.",
    },
    "date-night": {
      name: "Date-night dining",
      composition: "Create an intimate dining mood around the uploaded sushi, with the food remaining the clear foreground hero and soft environmental depth behind it. Use warm bokeh or candle-like ambient light only in the background, and leave a calm copy zone. Do not add a second serving or imply two people are present unless they appear in the photo.",
      artDirection: "Modern date-night restaurant campaign: intimate, cinematic, inviting, and tasteful, with controlled depth of field and uncluttered editorial spacing.",
      colorAndLight: "Warm amber, burgundy, and dark wood, balanced so the food remains naturally colored. Soft directional highlights and gentle background bokeh.",
      photoTreatment: "Add warmth to the environment while keeping the uploaded sushi colors and details faithful. Keep blur confined to background elements; never blur the product itself.",
    },
  },
  nails: {
    "new-arrival": {
      name: "New manicure launch",
      composition: "Feature the uploaded hand as a large hero with the manicure fully visible. Leave a clean headline zone away from the fingertips and keep every visible nail within the central safe area.",
      artDirection: "Premium beauty editorial with intentional negative space, a refined campaign hierarchy, and a polished salon launch mood.",
      colorAndLight: "Use seasonal colors that complement the actual manicure. Soft directional beauty light, realistic skin and crisp polish reflections.",
      photoTreatment: "Clarify the real manicure and improve exposure, tone, and natural hand detail without changing the nail design.",
    },
    "seasonal-style": {
      name: "Seasonal manicure mood",
      composition: "Keep the uploaded manicure prominent and create a seasonal atmosphere through background, light, and surrounding negative space. Keep all nail art unobstructed and reserve a calm copy zone.",
      artDirection: "Fashion-beauty editorial, tactile seasonal styling, elevated but wearable, with tasteful restraint.",
      colorAndLight: "Choose a seasonal palette that harmonizes with the uploaded polish. Use soft directional light and natural skin tones.",
      photoTreatment: "Improve the source photo's clarity, exposure and tonal balance while preserving the manicure and hand exactly.",
    },
    appointment: {
      name: "Appointment availability",
      composition: "Present the uploaded manicure as a clear service example, with a quiet, separate area that can later hold appointment copy. Never invent dates, times, availability, or booking details.",
      artDirection: "Friendly, premium salon campaign with clear hierarchy and a welcoming, trustworthy feel.",
      colorAndLight: "Use a warm, inviting palette chosen around the uploaded manicure and soft, flattering salon light.",
      photoTreatment: "Naturally brighten and refine the original photo while preserving every nail and the real hand anatomy.",
    },
    "holiday-promo": {
      name: "Holiday manicure promotion",
      composition: "Make the uploaded manicure the hero and add restrained holiday atmosphere in the background. Reserve one uncluttered area for campaign copy; do not invent a discount or date.",
      artDirection: "Festive beauty editorial with elegant seasonal detail, polished hierarchy, and no generic clip-art decorations.",
      colorAndLight: "Use a holiday palette that does not recolor the manicure. Add soft highlights and restrained atmospheric sparkle only in the background.",
      photoTreatment: "Improve the photo's focus impression, light and color naturally; preserve the nail art, skin, and pose without alteration.",
    },
  },
};

const RATIO_RULES: Record<RatioId, string> = {
  square: "FORMAT: square 1:1. Compose specifically for a square canvas, not by squeezing a portrait layout. Keep the entire product and essential visual cues inside the central 82% safe area.",
  portrait: "FORMAT: portrait 4:5. Compose for a 4:5 feed poster. Keep the full product, focal details, and intended negative-space zones within the central 80% width and 84% height so a later square or story crop can be made without losing the subject.",
  story: "FORMAT: vertical 9:16 story. Compose specifically for a tall mobile canvas. Keep the product and essential details within the central 80% width and 72% height, away from the top and bottom interface-safe zones; use background/negative space to fill the extra height.",
  landscape: "FORMAT: landscape 16:9. Compose specifically for a wide canvas, keeping the entire product and focal details within the central 82% safe area and reserving a clear copy zone.",
};

export function buildDemoCampaignPrompt(industry: DemoIndustry, direction: string, ratio: RatioId): string | null {
  const recipe = RECIPES[industry][direction];
  if (!recipe) return null;

  return [
    "TASK: Create a polished, production-quality social media advertising image by editing the user's uploaded product photo. The uploaded photo is the product source of truth. Make a visibly art-directed, professionally enhanced image; do not merely place text over the untouched upload.",
    ...(industry === "sushi" ? [
      "IMAGE INPUT ROLES: Image 1 is the customer's uploaded sushi photo and the sole source of truth for the advertised food. Preserve its actual sushi, ingredients, count, plating, and viewpoint as closely as possible. Image 2 is the selected campaign inspiration poster and is a visual-layout reference only: borrow its composition, color relationships, negative-space placement, graphic shapes, and overall visual hierarchy. Do not copy or introduce Image 2's food, wording, letters, numbers, logos, restaurant identity, or brand marks. Do not mix the two images or treat the inspiration poster's dish as the product.",
    ] : []),
    INDUSTRY_PROFILES[industry],
    `CAMPAIGN DIRECTION: ${recipe.name}. ${recipe.composition}`,
    `VISUAL STYLE: ${recipe.artDirection}`,
    `COLOR AND LIGHT: ${recipe.colorAndLight}`,
    `PHOTO ENHANCEMENT: ${recipe.photoTreatment}`,
    RATIO_RULES[ratio],
    "OUTPUT IS A PHOTO LAYER ONLY. The application adds all campaign copy, typography, badges, dates, prices, and branding afterward in code. Render absolutely no text, letters, digits, punctuation, symbols, logos, watermarks, labels, signage, packaging copy, or interface elements. Remove stray writing from the scene rather than reproducing it. Keep the designated copy area as a visibly clean, uninterrupted field of background color or texture with no objects crossing it. Any generated writing or numbers are defects. Never guess business facts or add claims. Keep one clear focal hierarchy, crisp edges, natural detail, and a commercially usable finish.",
  ].join("\n\n");
}
