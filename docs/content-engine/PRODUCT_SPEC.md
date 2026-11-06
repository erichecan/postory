# PoStory Content Engine: Product Specification Draft

Status: product direction captured from a discovery conversation; not yet an implementation commitment.

## User outcome

An agency provides approved photos, videos, product/service facts, brand guidance, service area, and campaign goals. PoStory should help the agency understand the material, create a complete and varied monthly content plan, and turn selected footage into a reviewable short video.

The system must keep the agency in control of client-facing claims, creative approval, publication, and spend.

## Content value dimensions

Use three outcome dimensions when planning and reviewing creative work:

1. **Worth watching:** the opening earns attention and the message sustains interest.
2. **Worth sharing/saving:** the post offers a useful tip, surprising insight, proof, or discussion point.
3. **Worth acting on:** the right local customer can see a relevant next step such as asking about stock, getting a quote, booking, or visiting.

Not every post needs to excel at all three. A practical post with modest reach can be valuable if it generates qualified local inquiries; broad views without relevant action may have little business value.

For one set of appliance-store footage, for example, possible test hypotheses are:
- Price/value: show a real, currently verified offer.
- Buying education: explain what the buyer should check before purchasing a discounted appliance.
- Local inquiry: feature verified local stock or a confirmed in-store service and invite a specific inquiry.

These are genuinely different creative directions only if the opening, information order, visuals, and CTA change. Do not invent price, condition, warranty, delivery, or stock facts.

## Style profile and acceptance standards

A client/project style profile should persist the standards learned from repeated real edits: preferred hook/pacing, cover composition, typography, caption density, safe margins, framing, transitions, logo treatment, music level, and treatments to avoid. Keep examples and reference frames where possible; a verbal note such as “a little bigger” should be converted to a stored rule only after the reviewer confirms it.

Reviewers should be able to leave timecoded notes and classify them (for example: factual claim, crop/framing, caption, pacing, transition, audio, or brand style). Recurring preferences can update the client's profile after confirmation. The system should generate a contact sheet and preview so subjective checks are visible. Machine QA can check factual traceability, text bounds/readability, caption timing, blank frames, audio sync, and export settings; aesthetic approval remains reviewable by a person.

## Workflow A: media understanding

### Inputs

- Photos, video clips, existing captions or transcripts, product/service facts, brand voice, customer profile, location/service area, and campaign objective.
- Optional constraints such as “do not show faces,” approved claims, required disclosures, available offers, and expiry dates.

### Analysis record per asset

Store or derive:

- Asset identifier, original filename, duration, dimensions, frame rate, orientation, and audio presence.
- Speech transcript with timestamps and language, with low-confidence spans marked.
- Representative keyframes and timestamps.
- Visible products, people, actions, setting, before/after states, readable on-screen text, and shot type.
- Usable ranges and possible role in a story: hook, product detail, demonstration, evidence, transition, or CTA background.
- Evidence links back to the source asset and timestamp.
- Confidence and unresolved questions.

Never treat model guesses as approved product facts. For example, recognizing a wheeled board does not establish speed, battery range, safety rating, warranty, age suitability, price, or stock status.

### Human correction

Allow the agency to correct the transcript, asset labels, product identity, and approved facts. Corrections should be reusable within that client's workspace.

## Workflow B: monthly plan for 20 image-and-copy posts

Generate a 30-day plan with 20 post records. Each post should include:

- Planned date or week, platform, format, status, and required reviewer.
- Content pillar and intended local audience.
- Business goal: awareness, education, trust, inquiry, appointment, or store visit.
- Creative hypothesis, hook, key message, and proposed visual treatment.
- Asset references with evidence timestamps where applicable.
- Draft caption/copy, on-image text, CTA, and suggested alt text if supported.
- Required client facts, assumptions, and approval status.
- Suggested success metric aligned to the goal.

The plan should vary useful creative angles (for example: price/value, practical education, product demonstration, local proof, customer story, comparison, seasonal need, and clear inquiry CTA). Do not create 20 near-duplicates to satisfy a count.

### Quality review

Use a transparent checklist for:

- Specific, comprehensible hook.
- Useful or entertaining value for the intended local audience.
- Evidence-backed claims and current offer details.
- A clear reason to save, share, discuss, or act.
- Platform and format fit.
- Readable design and accessibility.
- CTA and tracking plan.

Any numeric score is an internal heuristic until calibrated against real account data. It must not be described as viral probability or a guaranteed performance prediction.

## Workflow C: one-click multi-clip editing

“One click” should mean that, after client preferences and an edit template are set, the agent can run a reproducible pipeline from selected source clips to a reviewable draft. It should not mean skipping factual checks or silently publishing.

1. Select clips and the goal/style preset.
2. Inspect metadata, speech, keyframes, visible products/actions, and audio.
3. Propose one or more story directions with referenced clip IDs and ranges.
4. Create an editable timeline/edit decision list (EDL) as structured data.
5. Render a low-resolution or watermarked preview.
6. Accept timecoded review notes and apply targeted changes.
7. Render the final aspect-ratio/export preset, captions, and optional cover.
8. Run media QA: duration, resolution, audio/video sync, blank/black frames, clipping/peak levels, caption timing, spelling, safe margins, and source-to-render traceability.

Keep originals read-only. Every edit should be reproducible from the source asset IDs, time ranges, overlays, audio mix, and export settings.

## Content-type routes

Do not force all media through a talking-head workflow.

- Talking head / interview: ASR, confidence-aware subtitle review, speaker/name validation, candidate quote selection, chapter draft, filler/retake review, natural pause trimming, captions, reframing. Quote clips, lower thirds, and chapter labels require review against their source timestamps.
- Product showcase / store footage: visual shot selection, product/detail/action alternation, optional approved voiceover or text, music/audio cleanup.
- Project case / before-after: preserve chronology, show evidence, identify location and work scope only when verified.
- Screen recording / tutorial: OCR/UI landmarks, step order, cursor focus, readable captions.

The eight sample clips in the conversation should use the product-showcase route, not a transcript-led talking-head editor.

## Learning loop and metrics

Keep separate views for:

- Organic distribution: reach, qualified/local reach when available, watch time/retention, completion, saves, shares, comments, profile visits.
- Paid acquisition: spend, click-through, landing-page actions, tracked inquiries, qualified leads, CPL/CPA, and conversions.

Metrics vary by platform and access. Record platform, date window, audience/placement, budget, and metric definition. Do not infer causality from a single post or uncontrolled organic comparison. Test a small number of meaningfully different variants; change one major variable at a time where possible.

## Proposed monthly testing cycle

A draft operating rhythm discussed in the conversation was:

- Week 1: publish/test about five posts across distinct angles.
- Review available results and decide which themes merit more work.
- Weeks 2–3: produce/publish about ten optimized posts and test selected hooks or formats.
- Week 4: publish the remaining five and record what to carry into next month.

This 5/10/5 split is a hypothesis, not an evidence-backed performance rule. Organic results are noisy and the plan must fit the client's approval cadence and package. Prefer adjusting upcoming topics, titles, covers, order, or publication times within scope. Do not imply the small batch has proven causation or turn it into unlimited revision work.

The earlier conversation also proposed an internal six-dimension creative checklist: hook (25%), useful value (20%), share/save/discussion motivation (20%), visual pace (15%), audience fit (10%), and CTA (10%). Example scores such as 67/100 were illustrative and uncalibrated. If used, explain the concrete issue and recommended change; never present the total as a viral probability or prediction.

## Client learning profile

Over time, a client-specific learning profile may summarize:

- Which themes repeatedly led to watch time, saves, shares, profile visits, or inquiries.
- Which openings retained viewers, when platform analytics make that available.
- Which products/services generated qualified inquiries.
- Which paid creatives generated more qualified leads or a lower CPL under comparable conditions.
- Which claims, visuals, tones, or formats the client approved or rejected.

Store the source and date window for each insight. Do not generalize one client's result to another client, and do not treat correlation from a small uncontrolled sample as proof.

## Resource and iteration efficiency

- Keep originals immutable. Separate source assets, cached analysis, proxy/preview renders, temporary intermediates, and approved finals.
- Check available disk space before long renders. Reuse transcripts, keyframes, and analysis when the source hash and settings have not changed.
- Delete only clearly regenerable intermediates according to a documented retention policy. Never silently remove source assets or approved deliverables.
- Use deterministic scripts for metadata extraction, caching, timeline execution, rendering, and mechanical QA. Use the model for interpretation, story choices, and explaining changes.
- For a small revision, pass only the affected time range and relevant context instead of rereading every source from scratch.
- Track elapsed production/review time, number of preview rounds, and repeated note categories. Use real frequent jobs to judge whether a Skill saves time while maintaining the client’s quality bar.

## Scope and approval boundaries

- C$599/month, 20 pieces, 30-day calendar, two consolidated revision rounds, and monthly reporting are conversation context, not verified commercial terms. Preserve current contract and product settings until checked.
- Weekly learning can inform the remaining schedule through title, cover, order, or topic emphasis within scope. Re-editing already-approved deliverables beyond the included revision rounds should be treated as additional work.
- Do not publish, change ad spend, or make external client commitments without explicit approval.
