# PoStory Template Engine Map

Read this as a starting map, then confirm the current code before each template change.

## Active implementation points

- `src/lib/demo/contracts.ts`: shared industry, output, slot, and layered template Zod schemas. Extend schemas only when the new template needs a reusable capability.
- `src/lib/demo/templates/<template-id>.ts`: schema-validated runtime definition and descriptor.
- `src/lib/demo/templates/component-registry.tsx`: maps stable template IDs to React template-family components.
- `src/lib/demo/templates/layout-resolver.ts`: ratio selection and shared fitted-text helper.
- `src/components/demo/templates/template-renderer.tsx`: common component entry point for registered templates.
- `src/components/demo/templates/families/`: reusable React/CSS/SVG family renderers.
- `src/components/demo/fidelity/page.tsx`: current `/demo/[industry]` experience. Sushi uses `TemplateRenderer` via the `art()` helper; Nail still has legacy `Artwork` branches and flattened template thumbnails. When creating a Nail template, connect the new template card, edit/preview artwork, and export capture to `TemplateRenderer` rather than copying that legacy pattern. Confirm active route wiring before changing components.
- `src/lib/demo/render.ts`: DOM rasterization and shared free-demo watermark. Keep artwork rendering in the template component; add the shared watermark once after rasterization per policy.
- `public/demo/templates/<industry>/`: versioned JSON definition and separate runtime assets.
- `docs/Sushi-Template-01-Design-Handoff.md`: pilot decisions and initial bounds for the Sushi editorial template. Treat measurements based on a flattened reference as estimates, not recovered source geometry.

There are also older components under `src/components/demo/sushi/`. Do not assume they serve the current `/demo/sushi/...` route; inspect the active `src/app/demo/[industry]/...` route wiring first. Do not update both systems just to make them look symmetrical.

## Industry extension

Nail and Sushi configs currently live in `src/lib/demo/industries/nails.ts` and `src/lib/demo/industries/sushi.ts`. Each owns field catalog, categories, copy/locales, media policy, output specs, and capabilities; both consume shared contracts and template rendering. If the requested industry has no config, check `INDUSTRY_IDS` and `industryConfigSchema` in `src/lib/demo/contracts.ts`, then add the smallest coherent shared config and route/category/translation wiring required by the real demo. Do not add `if (industry === ...)` branches to the renderer. Keep all layout/rendering behavior in shared template definitions, reusable families, and the central template registry.

## Shared rendering invariants

- Use a template ID and immutable version as identity; `styleIndex` may remain a UI selection index, not template identity.
- Layout rectangles use normalized top-left coordinates: `(0,0)` is the canvas top-left, and width/height are fractions of that ratio's canvas.
- Current template output IDs are `square` (1080×1080), `portrait-4x5` (1080×1350), and `story-9x16` (1080×1920). The older Nail flow also exposes a `portrait-2x3` output (1080×1620); do not silently confuse it with the requested 4:5 layout. Map user-facing ratios to IDs explicitly and update the new template's industry output list as required.
- Define independent element coordinates and photo focal points per ratio. Keep image crop as `cover` with editable focal point and zoom where the editor supports it.
- Use actual editable DOM text for title and copy. Keep per-field max length, maximum lines, font family/fallback, line height, tracking, color, fit policy, minimum readable size, and warning behavior explicit.
- Keep separate files for the replaceable photo and each decorative asset. Use SVG for line art when it yields cleaner transparent assets; never put copy or logos into the photo.
- Keep selection badges and application UI outside the rendered artwork.
- The same template React component must drive the template thumbnail, live editor, final preview, and the DOM node sent to the PNG rasterizer. Mode may set metadata but must not select a different composition.
- The free-demo watermark is drawn by the existing shared raster export policy after the template DOM is captured. Keep its safe area in the template definition, and do not also bake or render a second watermark into the artwork.
- Wait for document fonts and image assets before exporting. Capture the target-ratio DOM at the requested pixel dimensions, not an unrelated preview shape.

## File and naming conventions

- Template id: lowercase kebab case, e.g. `sushi-signature-editorial-02`.
- JSON definition: `<template-id>.v<major>.json`, with assets and runtime source adjacent in the relevant industry folder.
- Asset URLs are rooted at `/demo/templates/<industry>/assets/`.
- All visible layers have stable IDs and `zIndex` values. Specify each ratio's logical canvas in pixels while storing geometry normalized to that canvas.
- Keep JSON and Zod-parsed TypeScript runtime definitions synchronized. The JSON is useful for design handoff, but it is not automatically loaded at runtime unless code explicitly imports it.
