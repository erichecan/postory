# Image generation prompt recipes

Build the prompts from the user's single brief. Replace every bracketed value yourself; do not ask the user to repeat their brief as multiple prompts. Generate one image per call. Before generating, write (a) a visual-anchor spec covering subject, pose/orientation, camera angle, focal region, crop, lighting, palette, background, and copy-safe area; and (b) an art-direction spec covering audience, premium cues, type character, composition device, material/texture cues, contrast strategy, and 3–5 supporting visual layers. Reuse those decisions in implementation. The production preview must come from the actual shared React renderer.

## 1. Production visual reference

Do not independently generate a flattened poster concept and a separate clean hero photo as if they will depict the same scene. Independent generations routinely shift the subject pose, camera, crop, lighting, or negative space. For a code-rendered template, generate the clean hero photo first, implement the layers around it, then capture the exact production preview from `TemplateRenderer`. Use a flattened concept only as an exploratory visual direction, clearly labeled as such. If the user supplied or approved a flattened reference, treat it as the desired composition and recreate editable layers around its anchored photo.

If an exploratory poster concept is specifically useful before implementation, use this prompt only after the clean hero exists. Include the hero photo as the image reference and instruct the model to preserve the photo composition and pixels; do not use the resulting concept as the production preview. The final comparison image must still be captured from `TemplateRenderer`.

```text
Create one exploratory social media poster direction for [INDUSTRY / BUSINESS TYPE] promoting [CAMPAIGN / SUBJECT]. Use the supplied clean hero photo as the exact underlying photograph. Preserve its subject, pose/orientation, camera angle, focal placement, crop, lighting, and color appearance; do not regenerate, move, replace, or repaint the photographed subject. Portrait 4:5 composition, premium [VISUAL STYLE / MOOD], designed for a real small business rather than an app mockup.

Composition: [DESCRIBE SUBJECT PLACEMENT, CAMERA AND CROP, LIGHTING, PALETTE, NEGATIVE SPACE, COPY AREA, AND A DISTINCTIVE COMPOSITION DEVICE]. Use [TYPE CHARACTER / SCALE CONTRAST] and [MATERIAL / TEXTURE CUES]. Add 3–5 purposeful, visually distinct supporting elements from this set as appropriate: an editorial overline, shaped color panel, precise keyline/frame, cropped seal, fine-print metadata, layered paper or fabric edge, foil/emboss effect, hand-drawn accent, or small supporting motif. Place each so it reinforces hierarchy and never competes with the subject. Avoid default centered layouts, plain large text on a gradient, generic stock-poster styling, sparse empty space without intent, and random ornament. Include the following exact copy as part of this concept only: headline “[HEADLINE]”; supporting line “[SUPPORTING COPY]”. If text rendering is unreliable, preserve clear, deliberately shaped type areas in the intended positions so editable typesetting can be recreated later.

Use specific art direction, realistic material detail, intentional asymmetry, strong foreground-to-background separation, considered typography, and a rich but controlled layer hierarchy. The design must feel art-directed for a premium independent business and visually compelling at phone size; it must not look like a plain text card. Keep the photograph visually prominent and match the supplied hero exactly. No phone frame, app UI, template-selection badge, fake interface, fake brand mark, watermark, or unrelated text. Show exactly one finished poster, straight-on and edge-to-edge, with no presentation mockup or surrounding collage. This is an exploratory concept only; the authoritative production preview will be rendered from the code template.
```

For an already approved reference, skip concept regeneration unless asked. Study its composition, palette, typography character, and layer placement; do not assume its flattened pixels can be recovered as separate layers.

## 2. Clean replaceable hero photo

Generate this before any optional concept image. Set `transparent_background: false`. This asset anchors the final composition and should visually match the visual-anchor spec. Keep it free of design elements so users can replace the image without losing typography or decoration.

```text
Create one high-resolution, photorealistic editorial photograph to be used as the replaceable hero photo layer in a [INDUSTRY / BUSINESS TYPE] social marketing template. Show [SPECIFIC SUBJECT / PRODUCT / SERVICE SCENE] in [LIGHTING, CAMERA, MATERIAL, AND MOOD]. Match this fixed visual anchor exactly: subject [POSE / ORIENTATION], camera [ANGLE / DISTANCE], focal region [FOCAL REGION], portrait 4:5 crop, copy-safe region [COPY REGION], palette [PALETTE], background [BACKGROUND]. Keep enough image beyond the subject to support separately art-directed 1:1 and 9:16 layouts without changing the subject identity or pose.

Authentic professional photography, natural detail, realistic anatomy and objects, intentional depth of field, clean image quality, [INDUSTRY-SPECIFIC VISUAL REQUIREMENTS]. The image itself only: no typography, letters, menu text, labels, packaging text, logo, watermark, border, frame, graphic decoration, gradients, UI, collage, or poster layout. Do not bake in any design layer.
```

Substitute concrete industry details. Examples: for Nail, describe a natural hand pose, exactly five anatomically plausible fingers per visible hand, polished manicure detail, believable skin, and nail art that matches the brief; for Sushi, specify the dish, ingredients, plate, and restaurant lighting. For another industry, research or infer the real materials, tools, setting, and visual conventions instead of carrying over food or beauty cues.

## 3. One transparent decorative asset per file

Use one prompt and one generation for each individual decoration (for example, one botanical sprig, one sparkle group, or one brush stroke). Set `transparent_background: true` when using image generation. Prefer hand-authored SVG instead if a crisp, geometric, single-color, or easily recolorable mark is needed.

```text
Create exactly one isolated [DECORATIVE ELEMENT] for a premium [INDUSTRY / CAMPAIGN STYLE] social poster. The element should be [SHAPE, DIRECTION, LINE WEIGHT, COLOR, TEXTURE, AND DETAIL], with a graceful silhouette designed to sit at [INTENDED POSITION] without obscuring the photo subject or editable copy.

Output only this single asset on a genuinely transparent background with clean alpha edges. Keep the entire ornament inside the canvas with comfortable transparent padding. No background color, checkerboard pattern, glow, halo, cast shadow, light bloom, extra objects, alternate options, text, logo, watermark, frame, canvas mockup, or contact sheet. Preserve thin details without clipping.
```

If the model returns a glow, opaque pixels, checkerboard, multiple objects, or dirty alpha edges, do not ship that result as transparent artwork. Prefer a simple SVG redraw or regenerate with a narrower prompt. Keep every decoration as its own file and give it an explicit layer ID and `zIndex` in the JSON definition.

## 4. Per-asset handoff

For every prompt, decide a descriptive filename, intended role, aspect ratio/resolution, alpha requirement, and target directory before generating. The clean hero photo and each decoration must be independently addressable files. Do not composite assets to make a sprite sheet. Keep concept art in a reference/docs location; keep runtime assets under `public/demo/templates/<industry>/assets/`.
