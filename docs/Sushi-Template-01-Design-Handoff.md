# PoStory — Sushi Template 01 Design Handoff

- **Template ID:** `sushi-signature-editorial-01`
- **Version:** `1.0.0`
- **Industry:** `sushi`
- **Family:** `full-bleed-editorial`
- **Reference:** `sushi-template-0.webp` (362 × 333 px)
- **Status:** Implementation specification; visual reference inspected. Source is a flattened WebP, not an editable layered design.
- **Scope:** One pilot template, shared Nail/Sushi template engine. No publishing or scheduling in free Demo.

## 1. Verified reference image

The image is a landscape-near-square thumbnail (362 × 333, aspect ratio 1.087). It shows a full-bleed food photograph with two foreground salmon nigiri, dark/blurred background and orange highlights. Upper-left: white high-contrast serif `Fresh` on line 1 and `Sushi` on line 2. Below: two lines of uppercase white sans-serif text, `SIMPLE INGREDIENTS` and `EXTRAORDINARY TASTE`. Two small gold botanical line-art decorations appear near the right side of the headline and near the lower-left photo area. Upper-right: a circular orange checkmark with white ring.

**Critical distinction:** the orange checkmark is **Page 03 selection UI**, not part of the artwork. Never render it in the post itself or in exports. The reference does not show a PoStory watermark, but the free Demo export **must** add one.

### Approximate layer map (reference pixels)

Coordinates are measured/estimated visually against 362 × 333 thumbnail; tolerance ±5–10 px. These are NOT extracted source-layer bounds. Origin is top-left. The photo fills the full 362 × 333 canvas.

| Z | Element | Approx. x | Approx. y | Approx. w | Approx. h | Implementation | Export? |
|---|---|---:|---:|---:|---:|---|---|
| 0 | Salmon nigiri photograph | 0 | 0 | 362 | 333 | User image slot, `object-fit:cover` | Yes |
| 1 | Left-side legibility overlay | 0 | 0 | ~230 | ~270 | Transparent-to-black gradient, tune visually | Yes |
| 2 | Main headline `Fresh / Sushi` | 20 | 72 | ~166 | ~102 | Editable serif text, two lines | Yes |
| 3 | Supporting copy | 20 | 187 | ~206 | ~39 | Editable uppercase sans-serif, two lines | Yes |
| 4 | Upper gold botanical ornament | 181 | 156 | ~45 | ~52 | Separate transparent SVG | Yes |
| 5 | Lower-left gold botanical ornament | 18 | 239 | ~63 | ~53 | Separate transparent SVG | Yes |
| UI | Orange circular selection checkmark | 303 | 7 | ~51 | ~51 | Page 03 `TemplateSelectionBadge` | **NO** |
| Export | PoStory watermark | N/A | N/A | N/A | N/A | Shared watermark layer, safe area | Free export only |

**Important:** This thumbnail includes text and decorations baked into the photograph. It cannot be used as the runtime photo background: editing the headline would leave the original headline visible underneath. Use a clean source photograph (or a user-uploaded photo) and recreate all other layers. Do not try to erase the embedded text with naive image masking.

## 2. Visual intent and design tokens

- Editorial, premium Japanese food advertising, photographic first.
- Large white contrast serif headline; deliberately short and stacked on two lines.
- Small uppercase sans-serif support copy with modest tracking.
- Dark photographic background behind the headline; avoid heavy flat-color blocks.
- Fine muted-gold botanical outlines (not filled icons).
- Template art is separate from surrounding Sushi Demo UI: warm cream/orange application chrome **must not** be baked into the exported poster.

**Suggested fonts, subject to visual review:** `Cormorant Garamond` or `Playfair Display` (serif heading), `Inter` or `Noto Sans` (support text). Do not assert these are the original fonts. Confirm licensing and load fonts before capture. For Japanese/Chinese localized copy, define explicit fallback stacks and test line metrics.

**Suggested tokens, not sampled exact colors:** `text: #FFF`, `ornament: #D9A46D`, `overlay: rgba(0,0,0,.30)`, `watermark: rgba(255,255,255,.65)`.

## 3. Slot schema

| Slot | Type | Required | Initial example | Rules |
|---|---|---|---|---|
| `hero` | image | yes | user's uploaded sushi photo | `cover`, focal point x/y [0..1], image crop independently adjustable |
| `headline` | text | yes | `Fresh Sushi` | max 32 chars; default visual line break after `Fresh`; max 2 lines; no invisible overflow |
| `tagline` | text | no | `SIMPLE INGREDIENTS\nEXTRAORDINARY TASTE` | max 72 chars; uppercase presentation, max 3 lines |
| `ornamentTop` | decorative | no | botanical SVG | noneditable by user; variant-controlled |
| `ornamentBottom` | decorative | no | botanical SVG | noneditable by user; variant-controlled |
| `watermark` | system | yes for free export | PoStory | system controlled, not editable |

Text line breaks: preserve explicit `\n` in defaults; if user edits, reflow using layout constraints. Never cut off content without warning. For optional tagline, if empty, hide and adjust spacing. Do not invent prices, discounts, business names, or availability.

### Suggested TypeScript representation

```ts
export const sushiSignatureEditorial01 = {
  id: 'sushi-signature-editorial-01',
  version: '1.0.0',
  industry: 'sushi',
  family: 'full-bleed-editorial',
  slots: {
    hero: { type: 'image', required: true, fit: 'cover' },
    headline: { type: 'text', required: true, maxLength: 32, maxLines: 2 },
    tagline: { type: 'text', required: false, maxLength: 72, maxLines: 3 },
  },
  supportedRatios: ['1:1', '4:5', '9:16'],
  layouts: {
    '1:1': 'sushiSignatureSquare',
    '4:5': 'sushiSignaturePortrait',
    '9:16': 'sushiSignatureStory',
  },
} as const;
```

Preserve the existing `IndustryConfig`, `TemplateDescriptor` and registry; extend their schemas rather than creating a separate Sushi engine.

## 4. Layouts for three export ratios

**These layouts are proposed adaptations, not measurements from three supplied reference artworks.** Use normalized coordinates in the target logical canvas, then verify on device and export. Do not stretch the original 362×333 artwork.

### 4:5 — master layout (1080 × 1350)

| Layer | Proposed normalized bounding box (x,y,w,h) | Notes |
|---|---|---|
| Photo | (0,0,1,1) | full bleed; crop focus defaults (0.55,0.60), user adjustable |
| Overlay | (0,0,0.78,0.78) | left/top vignette or gradient |
| Headline | (0.055,0.19,0.66,0.22) | two lines, serif; adapt 64–115 px depending on copy |
| Tagline | (0.058,0.43,0.69,0.10) | 28–38 px, uppercase appearance |
| Upper ornament | (0.50,0.33,0.13,0.12) | avoid collisions with copy |
| Lower ornament | (0.06,0.72,0.15,0.12) | contrast-aware |
| Watermark | safe bottom-right inset >= 4% | never cover text |

### 1:1 — square layout (1080 × 1080)

| Layer | Proposed normalized bounding box (x,y,w,h) | Notes |
|---|---|---|
| Photo | (0,0,1,1) | crop to square, retain sushi focal point |
| Overlay | (0,0,0.82,0.80) | gradient |
| Headline | (0.055,0.20,0.67,0.27) | closer to reference thumbnail composition |
| Tagline | (0.058,0.54,0.72,0.13) | allow up to 3 lines |
| Upper ornament | (0.50,0.43,0.14,0.14) | avoid headline |
| Lower ornament | (0.05,0.76,0.17,0.16) | subtle |
| Watermark | bottom-right >=4% inset | safe area |

### 9:16 — story layout (1080 × 1920)

| Layer | Proposed normalized bounding box (x,y,w,h) | Notes |
|---|---|---|
| Photo | (0,0,1,1) | independent tall crop; may require separate focal point |
| Overlay | (0,0,1,0.65) | upper gradient |
| Headline | (0.07,0.18,0.80,0.17) | large serif, 2 lines |
| Tagline | (0.075,0.37,0.78,0.10) | up to 3 lines |
| Upper ornament | (0.60,0.30,0.18,0.09) | avoid text |
| Lower ornament | (0.06,0.75,0.19,0.10) | near lower-left |
| Watermark | inside 9:16 story safe area | keep away from top/bottom platform overlays; conservative >= 250px top and >= 300px bottom for critical content |

**All three ratios must use distinct layout definitions and potentially distinct image focal points.** Exact typographic positions require visual QA with both sample and user-uploaded photos.

## 5. Image crop and text overflow

- Image fills full canvas with cover crop. Store crop settings per ratio: `focalPoint`, `zoom`, optional `offset`.
- Preserve original upload for export; use downscaled previews for thumbnails.
- If the user photo is bright behind text, adjust an independent gradient overlay (never bake a gradient into the uploaded photo).
- Headline text: compute fitted font size within bounded rectangle; preserve max lines; minimum legible size; show an actionable validation warning if it cannot fit.
- Tagline: explicit letter spacing, max lines; if blank, hide without leaving an awkward gap.
- Decorative SVGs are not part of text measurement; implement collision/safe-area checks.
- Fonts must finish loading before rendering/capture; export must use identical font files and layout parameters.

## 6. Asset manifest

| File / component | Required? | Source / action |
|---|---|---|
| `sushi-template-0.webp` | reference only | supplied flattened 362×333 screenshot; never render as runtime photo |
| `hero` clean sushi photo | required for demo sample | obtain clean licensed photo or use user-uploaded photo; cannot losslessly extract from reference |
| `botanical-top.svg` | yes | redraw transparent vector from reference |
| `botanical-bottom.svg` | yes | redraw transparent vector from reference |
| `template-overlay.css` | yes | code-defined left-side gradient |
| `headline` and `tagline` | yes | actual DOM text slots |
| `TemplateSelectionBadge` | Page 03 UI only | do not include in template or export |
| `PoStoryWatermark` | free export only | shared Nail/Sushi component |

Do not use `sushi-photo.webp` if it contains a close icon or other UI chrome; provide a clean source. Check any existing `sushi-texture.webp`, `sushi-promo.webp`, and `sushi-restaurant.webp` before reusing them as decoration.

## 7. Rendering and reuse architecture

```
IndustryConfig (Nail / Sushi)
  -> Template Registry (ID + version)
  -> Slot validation and binding
  -> Ratio-specific Layout Resolver
  -> Shared TemplateRenderer (DOM/CSS/SVG)
      -> thumbnail (scaled logical canvas)
      -> edit preview (same layout)
      -> final preview (same layout)
      -> export (same layout, target pixels + watermark)
```

Do not use `styleIndex` as template identity. Persist `{templateId, version, ratio, content, imageBindings, cropByRatio}`. Keep the current DOM rasterization approach for V1, but render a dedicated **target-ratio logical DOM** before capture rather than scaling an unrelated preview. Thumbnail can be visually downscaled; text wrapping and crop must be computed against the same logical layout. Page 03 selection checkmark is outside the renderer.

Suggested components: `FullBleedEditorialFamily`, `PhotoSlot`, `FittedHeadline`, `UppercaseTagline`, `BotanicalDecoration`, `GradientOverlay`, `WatermarkLayer`, `TemplateRenderer`. Reuse the same family with Nail variants by swapping tokens, content and decorations; do not duplicate the renderer.

## 8. Implementation sequence for development branch

1. Audit existing template registry and the six `styleIndex`/`Artwork` branches; do not remove old templates yet.
2. Register `sushi-signature-editorial-01@1.0.0` with `hero`, `headline`, `tagline` and three layouts.
3. Create or obtain a clean photo; redraw two botanical SVGs. Do not bake any headline into the photo.
4. Implement shared `FullBleedEditorialFamily` using DOM/CSS/SVG and a common ratio layout resolver.
5. Bind Page 02 photo and Page 04 text into the new template; store template ID/version in draft.
6. Render pilot thumbnail, edit preview and final preview with the same renderer. Remove the selection badge from the artwork layer.
7. Export PNG at 1080×1080, 1080×1350 and 1080×1920 with actual embedded watermark.
8. Add schema tests, overflow tests, ratio tests and visual snapshots. Only after pilot passes, migrate remaining styles.

## 9. Acceptance checklist

- [ ] Pilot registered by real template ID and immutable version, not `styleIndex`.
- [ ] Original `Fresh Sushi` text does not remain baked under editable headline.
- [ ] User-uploaded photo can replace hero and adjust focal point.
- [ ] Headline/tagline editable and reflected immediately in preview.
- [ ] Thumbnail, editor, final preview and export use same component/layout rules.
- [ ] Selection badge appears only on Page 03 template card, never in exported PNG.
- [ ] 1:1, 4:5, 9:16 have separate layout definitions and correct pixel dimensions.
- [ ] Free exported PNG contains PoStory watermark within safe area.
- [ ] Long text and optional empty tagline behave predictably.
- [ ] Nail rendering remains unchanged; shared engine tests pass.
- [ ] Visual QA compares screenshot with original 362×333 reference, allowing explicit differences caused by aspect-ratio adaptation and clean replacement photography.

## 10. Outstanding design decisions

1. Confirm exact font family and licensing; current choices are approximations.
2. Obtain clean original photo if exact photographic match is required. Otherwise use uploaded user photo, which is the actual product goal.
3. Approve the two botanical SVG redraws against reference.
4. Confirm 4:5 master adaptation and story safe-area conventions; original screenshot itself is near-square, **not** 4:5.
5. Confirm whether tagline should support arbitrary Chinese/English copy; fit behavior must be tested in both scripts.

**Do not treat this document as a layered reconstruction of hidden pixels.** The original is flattened; layer bounds and adapted layouts are explicit implementation estimates, not source design measurements.
