# PoStory marketing workflow V2 — contextual selection UI

## Purpose

Replace the old large selection cards / small labels on the **existing** self-service marketing workflow with contextual, Apple-inspired choices. **Do not change the business workflow** and do not turn the app into a media-library-first experience.

Existing live flow on GitHub `main`:

1. Select marketing objective.
2. Enter store details.
3. Select marketing approach (everyday content vs. optional actual promotion).
4. Provide product facts and photos.
5. Select platforms and dates, then generate, edit and review the marketing calendar.

## Implemented on this feature branch

- New `MarketingGoalPicker` with large readable copy, seven existing business objectives, compact radio-style selection, an immediate visual example, and a modal with specific content ideas.
- Demo images are existing `/public/demo/photos/` assets, and are explicitly labeled as **illustrations, not proven customer case studies or performance results**.
- Selecting a goal **does not auto-advance**; user can inspect the sample and then explicitly continue.
- Marketing-approach selection is visually simplified, with concise selection rows, a contextual image and an explanation; existing promotion types, dates, rules and validation remain intact.
- More readable typography, focus states and small-screen layout for relevant form fields.
- Follow-on visual refinement: store-information fields, products, scheduling form and calendar action typography.
- Marketing case dialog supports Escape, focus trap, focus restoration and body scroll lock.
- Added `.github/workflows/postory-v2-interface.yml` to run TypeScript and targeted ESLint on pull requests. No passing run has yet been observed.
- Preserves the current data model, localStorage draft recovery, product entry, marketing-calendar API, content editing and scheduling logic.

## Review boundaries and test plan

- [ ] Run `npm ci` and `npm run typecheck`.
- [ ] Run `npm run build`.
- [ ] Open marketing workflow on desktop; test all seven goals, preview, case detail dialog, Continue/Back.
- [ ] Keyboard: tab to buttons, activate using keyboard, close case dialog with Escape.
- [ ] Check responsive layout on iPhone-size (375–430px) and desktop sizes; avoid horizontal clipping.
- [ ] Choose everyday-content approach, finish store/product information, generate a calendar.
- [ ] Choose promotion approach, verify required promotion type, dates and accurate promotion details, then generate.
- [ ] Revisit previously completed steps; preserve entered data and previously generated plan.
- [ ] Verify account permissions and real publishing flows before using the feature branch in production.

Current changes are code only; no successful build, functional browser QA, GCP deployment, or live publish test has been observed. The environment used for this change cannot clone the repo from GitHub for an independent local build. CI job is configured but not yet observed passing. Existing `main` and the production Cloud Run service remain unchanged.

## Future polish

The current store-information and product forms, generated calendar, and content-review panel retain their pre-existing behavior. They can receive a separate visual polish after the two core selection steps pass functional QA. No unsupported claim that every page is fully redesigned.
