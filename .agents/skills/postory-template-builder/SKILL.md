---
name: postory-template-builder
description: Create a complete, code-rendered PoStory marketing template for Nail, Sushi, or another industry from one short brief or visual reference, including image-generation prompts, separate assets, responsive layouts, shared rendering, export, and verification.
metadata:
  short-description: Build complete PoStory templates
---

# PoStory Template Builder

Use this skill when the user asks to create, add, or convert a PoStory social-marketing template for Nail, Sushi, or another current or newly requested industry. Complete the template end to end in this repository; do not stop after producing a visual mockup, asset pack, or schema. The user should describe the industry, campaign, and visual direction once and receive a registered, editable template that works in the demo. Compose all required image-generation prompts from that brief yourself; do not ask the user to write separate prompts for the hero photo, decor, or aspect ratios.

## Operating approach

- Infer routine choices from the supplied brief, reference, existing industry config, and current design system. Ask only when a missing choice would materially change the intended template and cannot be inferred.
- Keep the implementation within the existing shared template engine. Use Nail and Sushi as current supported industry configurations; when adding another industry, extend the shared industry/configuration/registry path rather than creating an industry-specific renderer or workflow.
- Treat generated or supplied flattened art as a visual reference. Never use a reference containing embedded copy, badges, UI chrome, or logos as the replaceable photo layer.
- Keep text, photos, decoration, gradients, and brand marks as distinct layers. Never bake editable copy or a watermark into a photo.
- Meet a premium, social-first art-direction bar: give the eye a clear focal point, a deliberate type hierarchy, rich but controlled material/light detail, and a memorable composition that reads in a fast mobile scroll. Avoid generic text-over-photo cards, large empty gradient fields, thin token ornaments, and six templates that differ only by copy or palette. Each template must have a recognizable composition and at least three purposeful supporting visual moves (for example, a crop frame, editorial label, layered shape, material edge, illustrated accent, or typographic device); implement them as editable CSS/SVG/React layers, not as baked pixels.
- Produce the three independent outputs: 1:1 (1080×1080), 4:5 (1080×1350), and 9:16 (1080×1920). Recompose each ratio; do not stretch one layout to the others.
- Use the same registered React template component and ratio-specific layout data for template cards, edit/live preview, final preview, and export capture. Export may rasterize that rendered DOM and apply the shared watermark policy afterward; it must not reconstruct artwork with a second implementation.
- Keep user communication concise while working. Deliver a short completion report with the created template ID, files, and verification result.

## End-to-end workflow

1. Read the repository `AGENTS.md`, the active template handoff/design brief, and the current registry, schema, renderer, and relevant industry configuration. Follow Next.js repository instructions before editing application code. Read [the project engine map](references/template-engine.md) for the current integration points and invariants.
2. Derive a stable `industry-concept-style` template ID and immutable initial version. Preserve the user’s requested visual idea; use project defaults for anything unspecified.
3. Convert the brief or approved reference into a compact visual-anchor spec before generating assets: exact subject, pose/orientation, camera angle, focal region, crop, lighting, palette, background, and reserved copy area. Also write an art-direction spec: audience, premium cues, composition device, type character, material/texture cues, contrast strategy, and 3–5 distinct code-buildable supporting layers. Keep both specs unchanged across asset prompts, JSON layouts, and implementation. A flattened concept image is only a reference; it is not evidence that a separately generated photo will match it.
4. Generate the clean replaceable hero photo first from that visual-anchor spec. Generate each decoration separately afterward. Do not independently ask ImageGen to recreate the same photo once inside a finished poster concept and again as a clean hero: independent generations change the pose, crop, lighting, and subject position. When a user provides a finished reference, preserve its photo composition as the anchor and recreate only the editable layers around it. Prefer authored SVG for crisp vector line art and predictable transparency. Never return a contact sheet or composite sheet as implementation assets. Reject or clean generated decorations that contain halos, checkerboards, stray pixels, or baked backgrounds.
5. Save assets under `public/demo/templates/<industry>/assets/`. Keep source dimensions and formats appropriate to use; reference each by a stable project URL. Do not overwrite unrelated or user-provided assets.
6. Write a versioned JSON template definition beside the assets. Define every visible layer with a stable ID, type, asset/slot binding, `zIndex`, normalized `x/y/width/height`, text style, and edit policy. Document coordinate origin and units. Include image fit and focal point/crop behavior, text defaults and limits, optional/hidden behavior, overflow warnings, lock state, watermark/brand-mark policy, and a separate element map for each of the three export ratios.
7. Register the schema-backed TypeScript definition and template ID with the existing engine. Keep JSON and runtime definitions aligned. Add only necessary schema fields and renderer primitives; share the engine and generic primitives, but do not force visually distinct templates into one composition just to reuse a family. Route this new template's selection card, edit, preview, and export through the shared `TemplateRenderer`, even if the target industry still has older static cards or `Artwork` branches. Avoid migrating unrelated existing templates unless needed to keep the requested flow coherent.
8. Render all layers from the same React component. Pass the actual ratio to the component for thumbnail, editor, preview, and export. Store user content and crop per ratio where supported. Ensure the photo is replaceable, text stays editable, decorative layers remain separate, and the selection badge stays outside artwork.
9. Connect template selection, editing, preview, and export to the registered ID. Capture a production preview from the actual `TemplateRenderer` output at the requested output dimensions; this renderer preview is the authoritative visual reference, not an independently generated concept poster. Capture the same rendered DOM using the existing DOM rasterization pipeline for export. Apply watermark once according to the current policy and safe area. If an exploratory concept image is useful, label it as exploration and never present it as a faithful preview unless it is composed from the exact same photo and layer geometry.
10. Verify JSON parsing, ratio dimensions and layer bounds, type checking, and the focused template tests. Inspect a rendered preview when browser tooling is available. Fix visible issues before reporting completion.

## Completion criteria

- The new template appears through the actual project registry and demo flow for its industry. If that industry is not configured yet, it has a shared `IndustryConfig`, field catalog, media policy, route/category registration, and translation entries as needed; rendering remains shared.
- It has separate clean source assets; replacing the photo does not disturb text or decoration.
- The documented production preview is captured from the registered `TemplateRenderer` and therefore shows the exact composition that template selection and editing use.
- Text fields work within their declared limits, fit or report overflow, and do not clip silently.
- All three layouts have independent geometry and correct output dimensions.
- Thumbnail, live/editor preview, final preview, and export use the same template component and artwork tree.
- Export contains the expected watermark exactly once and does not include template-selection UI.
- Relevant validation passes. State any remaining visual decision or technical limitation plainly.
