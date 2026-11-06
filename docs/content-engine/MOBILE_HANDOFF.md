# Mobile Codex Handoff

Open the public PoStory repository and read this folder before implementing:

- Repository: https://github.com/erichecan/postory
- Context index: https://github.com/erichecan/postory/tree/main/docs/content-engine
- Product workflow and requirements: PRODUCT_SPEC.md
- Sample clip analysis: MEDIA_SAMPLE_REVIEW.md
- Skills and source research: SKILLS_AND_RESEARCH.md
- Workflow iteration, style profiles, storage and token efficiency: WORKFLOW_DESIGN_PRINCIPLES.md

## Paste-ready prompt

Continue the PoStory Content Engine work using the product context in docs/content-engine/ as the source of truth. First inspect the existing repository instructions (AGENTS.md and relevant nested instructions), the current code, and existing social-agency/product requirements. Then map which parts of the three desired capabilities already exist and propose an implementation sequence:

1. Analyze agency-provided photos and videos so PoStory can identify what is shown, what is said, usable moments, and evidence-backed facts.
2. Derive a complete 30-day monthly plan of 20 varied image-and-copy posts from the client's approved material and facts, with local audience fit and measurable goals.
3. Provide one-click assembly of multiple video clips into an editable, reviewable short-form draft, followed by timecoded revisions and final rendering.

Do not promise viral reach or fabricate product specifications. Keep organic performance separate from paid-ad results. Use distinct workflows for talking-head videos and visual-first product showcases. Preserve source files and require review before publication. Keep the existing C$599 package and two-revision-round scope as context to verify, not as permission to change contracts or add unlimited rework.

Treat docs/content-engine/ as current discovery context, not a mandate to rewrite the whole app. Inspect actual architecture and existing product decisions first. Identify a narrow end-to-end vertical slice that fits the codebase, then implement it. Preserve user changes already present in the working tree; do not reset, overwrite, or commit unrelated work. Report the files changed, what works, and the remaining steps.

The eight example clips were analyzed in the prior conversation but are not in GitHub. Ask the user to attach or select them again only if a task genuinely needs the original media files.
