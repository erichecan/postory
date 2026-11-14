# November 5 discussion — decision and uncertainty log

This is the concise index linking the November 5 ~11:00–18:00 Toronto conversation to the late-night GitHub workflow documents. It is not a verbatim chat transcript.

| Topic | Decision / observation | Status | Where elaborated |
| --- | --- | --- | --- |
| PoStory business model | Done-for-you delivery for agencies; **not SaaS** | Confirmed direction | [Agency discovery](AGENCY_DISCOVERY_2026-11-05.md) |
| Agent/filming relationship | Agency owns client communication and filming; PoStory takes downstream content operations | Confirmed direction | [Agency discovery](AGENCY_DISCOVERY_2026-11-05.md) |
| Bespoke commercial scope | C$599/month/store, 20 content units, full 30-day calendar, approvals, two consolidated revision rounds, month-end report | Confirmed proposed offer; contract not verified | [Agency discovery](AGENCY_DISCOVERY_2026-11-05.md) |
| Video promise | Remove fixed “4 videos / week one / 15–30 seconds” production promise from bespoke package | Confirmed | [Agency discovery](AGENCY_DISCOVERY_2026-11-05.md) |
| Marketing copy | Avoid “AI auto-generated copy”, “white-label report”, and owner/agency cross-copy; use clear service language | Confirmed | [Agency discovery](AGENCY_DISCOVERY_2026-11-05.md) |
| Example industries | Windows and doors, appliance discount retail, furniture sales | Confirmed for bespoke pitch | [Agency discovery](AGENCY_DISCOVERY_2026-11-05.md) |
| Client control | Agency owns relationship and final approval; PoStory does not solicit end customer | Confirmed direction; contracts govern details | [Agency discovery](AGENCY_DISCOVERY_2026-11-05.md) |
| Material reuse | Existing footage is a source for differentiated content, not 20 identical frame grabs | Product requirement | [Product spec](PRODUCT_SPEC.md) |
| AI-looking content | Authentic photos, verified facts, brand-aware layouts and human QC | Product quality requirement | [Integrated workflow](INTEGRATED_DELIVERY_WORKFLOW.md) |
| Virality and leads | No guarantees; use creative hypotheses, organic/paid separation, actual tests | Product requirement | [Product spec](PRODUCT_SPEC.md) |
| Poor raw footage | Analyze privately; offer options and concrete missing material, do not confront agency/client | Business relationship constraint | [Agency discovery](AGENCY_DISCOVERY_2026-11-05.md) |
| One-click editing | Editable EDL, preview, notes, rerender, QA; route by media type | Proposed technical feature | [Integrated workflow](INTEGRATED_DELIVERY_WORKFLOW.md) |
| Interview workflows | Separate talking-head and multicamera editing routes | Overnight repo addition | [Workflow principles](WORKFLOW_DESIGN_PRINCIPLES.md) |
| Eight short clips | Visual-first board product showcase example; original private media not in repository | Sample analysis, not an installed editor | [Media review](MEDIA_SAMPLE_REVIEW.md) |
| Skill candidates | Research inventory; do not claim installation/production validation | Research only | [Skills](SKILLS_AND_RESEARCH.md) |
| 5/10/5 creative cadence and 100-point rubric | Optional uncalibrated experiments, not proven results | Hypotheses | [Product spec](PRODUCT_SPEC.md) |
| Economics of C$599 | Must measure agency feedback burden, revision minutes, video time, operator costs | To validate | [Agency discovery](AGENCY_DISCOVERY_2026-11-05.md) |

## Reconciliation with 23:00-era commits
- Existing `PRODUCT_SPEC.md` already describes media understanding, 20-post planning, EDL editing, quality rubric, and metric separation. Do not duplicate this as a new competing source of truth.
- Existing `WORKFLOW_DESIGN_PRINCIPLES.md` documents iterative style rules, media file lifecycle, token/storage efficiency, long interviews and multicamera edits. Treat those as **specialized** routes, not a requirement that all retail videos pass ASR or an interview editor.
- Existing `SKILLS_AND_RESEARCH.md` is a *candidate assessment*, not proof that the GitHub repos were installed or tested.
- `INTEGRATED_DELIVERY_WORKFLOW.md` adds the glue among those existing components, centered on agency approval and the current package boundaries.
- No product source code, live billing setting, contract, OAuth token, or platform ad budget is modified by this documentation merge.

## Validation gaps / next evidence
1. Reconcile bespoke commercial scope against the signed/approved agency quotation.
2. Use real approved agency media for timed production tests, especially silent product/showroom footage versus talk-heavy recordings.
3. Audit code for actual feature availability, permissions and platform API capabilities before marking workflow steps implemented.
4. Record exact cost, revisions, approval and performance evidence; separate anecdotal screenshots from tracked metrics.
5. Distinguish live product behavior from design proposals in demos and customer materials.
