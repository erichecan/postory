# Integrated media-to-content and video delivery workflow

Purpose: turn existing PoStory content-engine and editing research into **one agency-safe sequence** without replacing specialized workflows. This is a design/implementation handoff, **not a declaration that all steps currently run in production**.

See [PRODUCT_SPEC.md](PRODUCT_SPEC.md) for the underlying discovery specification, [SKILLS_AND_RESEARCH.md](SKILLS_AND_RESEARCH.md) for third-party candidates, [WORKFLOW_DESIGN_PRINCIPLES.md](WORKFLOW_DESIGN_PRINCIPLES.md) for review/storage lessons, and [AGENCY_DISCOVERY_2026-11-05.md](AGENCY_DISCOVERY_2026-11-05.md) for confirmed commercial boundaries.

## 1. High-level pipeline

```text
Agency client brief + verified product facts + existing photos/video + platform authorization
                  |
          Onboard client / style profile
                  |
          Ingest & preserve originals
                  |
       Inspect metadata + shot changes + ASR + visual keyframes
                  |
           Evidence-backed asset inventory
                  |
       Triage usable / missing facts / not usable
                  |
         Creative hypotheses + content pillars
                  |
        30-day calendar (20 content units)
                  |
           +------+---------------------+
           |                            |
      Graphics / copy               Video route selector
           |                            |
  original-photo design          interview / multicam /
  promotional layouts           product / project / tutorial
           |                            |
           |                     EDL + preview render
           +-------------+--------------+
                         |
                 Factual + media QA
                         |
              Agency review / 2 rounds
                         |
           Explicitly approve each deliverable
                         |
             Schedule / platform publishing
                         |
           Actual platform metrics + month-end report
                         |
        Client-specific learning / next month's planning
```

## 2. Unified entities to introduce or map to existing models
Check the actual codebase before creating tables or APIs. Proposed entities:

| Entity | Required minimum fields | Why |
| --- | --- | --- |
| ClientBrandProfile | client ID, agency owner, tone, approved colors/logo, service area, language, approved/prohibited claims, approver | consistent content, agency isolation |
| MediaAsset | source ID/hash, owner/permissions, immutable URI, type, dimensions/duration, consent/status | safe source lifecycle |
| MediaObservation | source ID, timestamps/keyframes, transcript confidence, visible product/action, evidence links, unknowns | verifiable facts |
| CreativeHypothesis | intended audience/goal, angle, hook, proof sources, CTA, rubric notes | truly distinct variants |
| ContentUnit | monthly plan ID, pillar, source IDs, platform variants, state, current version | count 20 distinct content units |
| EditDecisionList | source ranges, ordered tracks, overlays, audio, captions, export preset, revision lineage | reproducible video |
| ReviewBundle | versions, comments/timecodes, agency approvals, included revision round | manageable feedback |
| PublicationRecord | destination, planned/actual time, permission and API status, retries, ID, metric provenance | report what actually shipped |
| PerformanceObservation | platform, time window, organic/paid type, spend when applicable, definitions and data source | no metric conflation |
| OpsCostRecord | minutes by activity, tool/render cost, revisions, blocked causes | validate C$599 economics |

All end-client data must remain scoped to the owning agency; no account/password sharing. Existing OAuth and publishing systems should be reused where functional.

## 3. Content types and different editing routes
A generic “one-click video edit” should select a route based on **what material contains**, not the user's desired hype level:

- **Product showcase / store walkthrough**: keyframe/shot selection, real product details, motion, supported offer info; speech optional. Ideal first vertical slice for windows/doors, appliances, furniture.
- **Project case / before-after**: chronology and comparable genuine before/after visuals; no invented transformation, performance claims or location.
- **Talking head / interview**: timestamped ASR, optional filler/retake cuts, subtitle and names verification, pacing.
- **Multicamera interview**: source grouping/sync, camera IDs, speaker turns, scene switching, approved lower-thirds, optional color match; retain editable camera selection.
- **Screen demo/tutorial**: UI/OCR landmarks, correct sequence, readable overlays, no invented actions.

Route-specific outputs should all converge on the **same EDL, preview, timecoded review and QA contract**.

## 4. “One click” quality gates (no silent publishing)
1. Upload sources + brief.
2. Identify material route; show source map and low-confidence spots.
3. Suggest 1–3 **evidence-backed** story directions, with available clips and material gaps.
4. Select one approved creative, generate EDL and proxy preview. Do not overwrite original media.
5. Run deterministic checks: dimensions, duration, timestamp bounds, black frames, duplicate shots, audio peaks/sync, subtitle bounds and brand safe area; run factual/source-evidence validation.
6. Collect agency timecoded comments; apply local revisions and preserve version history. Two *consolidated* rounds belong to the bespoke package for agreed content work; complex editing still needs a separately agreed scope.
7. After agency approval, export final, then publish **only if the appropriate account is authorized and publication is explicitly approved**.
8. Capture actual reach/engagement and publish records; attribute paid spend/lead results separately if an optional ads service is enabled.

Fallback for insufficient footage: draft a factual static post or ask for one concrete missing image/fact. Do not invent a testimonial, sale price, warranty, inventory, technical specification, or before/after image.

## 5. Agency-safe user experience
Avoid a client-facing “poor filming score”. Display instead:
- “Available from your current material”: short product showcase, demonstration, photo post, FAQs.
- “Additional content possible with”: one clear product closeup, confirmed stock/price, completion scene, etc.
- “Review alternatives”: **Original**, **Product/project story**, **Inquiry-led variant**.
- Give the agency the final selection and client-facing communication. This is managed service support, **not a SaaS product sold to the end customer**.

## 6. Candidate component mapping (research, not installation)
| Function | Existing research candidates | Adoption posture |
| --- | --- | --- |
| Shot/keyframe extraction | ffprobe/FFmpeg, PySceneDetect | validate on shaky phone footage |
| ASR / word timing | local video2text; faster-whisper, WhisperX | benchmark multilingual speech, names, confidence |
| Rough cuts and filler removal | Auto-Editor; social-media-skills/video-editing-skill | talking-head route only where suitable |
| Agentic edit planning | codex-video-use, Ripple, naive-video-skill | borrow patterns, avoid blind copy |
| Review loop | real-simple-labs/agentic-video-editing | adapt timestamp comments and scoped rerender |
| Title cards and motion graphics | FFmpeg; Remotion/video-shotcraft | check commercial license and runtime cost |
| Packaging | xhs-video-package-skill | after editing, not as the editor |
| Delivery | existing PoStory scheduler/publisher/reporting | inspect before replacing |

No third-party video editor was proven by the prior eight-clip test; actual production quality must be measured with authorized agency media.

## 7. Narrow MVP and measurable acceptance
**MVP route:** agency uploads a small batch of windows/doors, appliance or furniture footage with verified product facts.

Expected slice:
- A timecoded list of usable shots and uncertain facts, plus evidence links.
- Three distinct content hypotheses with appropriate format/CTA and material dependencies.
- A 30-day plan with 20 non-identical content units; flag if the source bundle cannot support 20, rather than inventing.
- One **visual-first** 9:16 video draft from chosen clips; editable EDL, low-res preview, safe captions where appropriate.
- Agency timecoded notes and one targeted rerender; user approves before final export.
- An auditable state transition through planned → drafted → reviewed → approved → scheduled → published (when platform authorization is available).
- A report separating real publishing metrics from hypothetical/paid figures.

Measure: first-draft acceptance rate, factual error count, operator minutes, revision rounds, render time, storage, upload/publish failures, and genuine agency willingness to use/rebuy. **Do not use views or a heuristic “viral score” as the only success criterion.**

## 8. Next implementation check
Before writing production code:
1. Check current main branch and all relevant instructions, e.g. `AGENTS.md` and existing module documentation.
2. Compare current image/template renderer, business profile, calendar, account authorization, scheduler, report, video pipeline, and permissions with this design.
3. Create a dependency map and a small implementation branch with testable milestones.
4. Keep existing agency-only commercial copy and pricing separate from owner-facing offers.
5. Never commit real end-client private footage, contracts, account tokens or unapproved client claims to this public repository.
