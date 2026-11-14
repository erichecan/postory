# Skills and Research Notes

Research and source review captured in the November 2026 conversation. Repository claims describe author-provided implementations and should be validated against PoStory's own representative footage before adoption.

## What was actually used

- The local Codex skill named video2text was read and used to transcribe each source video locally.
- ffprobe and FFmpeg were used directly to inspect media metadata and sample frames.
- No third-party auto-editing repository or editing Skill was installed or used to render the sample video.

## Candidate Skills and projects

### Media analysis and general editing

- The local video2text Skill used in this conversation — supports local-file transcription and frame inspection. Its public source repository was not established during this research, so do not install from an assumed URL.
- [codex-video-use](https://github.com/AxelkHellberg/codex-video-use) — Codex-oriented local editing toolkit for subtitles, timing-aware cuts, overlays, and verification. Useful to study for a reproducible source-folder-to-preview workflow. It is transcript/timing oriented, so PoStory needs a visual-first route for silent product footage.
- [Ripple](https://github.com/conmeara/ripple) — combines a video-editing skill, CLI, timeline sheet, and a VIDEO.md style guide. Useful design reference for time-aligned visual/audio evidence and reusable taste rules.
- [naive-video-skill](https://github.com/naive-kun/naive-video-skill) — fuller guided workflow for talking-head production with project state, preview, quality gates, and user approval. Better suited to narrated footage than this sample.

### Specialized modules

- [Video Editing Skill by social-media-skills](https://github.com/social-media-skills/video-editing-skill) — MIT, Python + FFmpeg + Pillow, cross-platform per its README; focuses on talking-head pauses, filler words, retakes, punch-ins, captions, loudness, and cut review. Useful as a future talking-head route, not as the editor for silent product showcases.
- [Agentic video editing](https://github.com/real-simple-labs/agentic-video-editing) — useful review-loop pattern: timestamped notes, apply-notes, QA, and creative variations. The reviewed README targets Claude Code, Apple Silicon/macOS, and sub-minute performance ads. It is not directly a ready-to-install Codex Skill. Its README says most first cuts still need one or two notes; treat it as a design reference rather than proven general production reliability.
- [video-shotcraft](https://github.com/Vincentwei1021/video-shotcraft) — Remotion-based motion-graphics/product promo workbench. Consider for title cards, animation, or product explainer graphics; it does not replace understanding and selecting the client's raw footage.
- [XHS video package Skill](https://github.com/muximxc/xhs-video-package-skill) — packages a completed video and SRT with a cover, chapter bar, and post copy. It is a post-production/publishing-packaging step, not the raw-footage editor.

Before reusing code, inspect dependencies, operating-system assumptions, network/API behavior, and each repository's license. Prefer learning the workflow and writing a small PoStory adapter over copying an entire agent prompt stack.

## Codex Skills usage

OpenAI documents a Skill as a directory with a required SKILL.md and optional scripts, references, and assets. Codex can invoke a Skill explicitly with $skill-name or select it based on its description. Project Skills are discoverable from .agents/skills; user Skills live in ~/.agents/skills. See [official Skills documentation](https://learn.chatgpt.com/docs/build-skills).

Recommended structure for PoStory:

- One clear PoStory orchestration Skill that identifies media type, runs the right workflow, and enforces review/approval boundaries.
- Separate scripts/modules for media inspection, ASR/OCR, visual analysis, content-plan generation, EDL creation, rendering, and QA.
- Explicit specialist routes rather than one undifferentiated “video skill”: talking head, product showcase, project case/before-after, and tutorial/screen recording.
- A JSON edit decision list / timeline artifact so an edit can be reviewed, reproduced, and corrected.
- Reuse third-party libraries selectively; do not make a Claude-only workflow appear Codex compatible without adapting and verifying it.

## Platform evidence and limits

- [Meta: Rewarding Original Creators on Facebook](https://about.fb.com/news/2026/03/rewarding-original-creators-on-facebook/) says Facebook is prioritizing original content in Feed and Reels. It supports the value of original client footage, not a guarantee of reach.
- [TikTok recommendation signals](https://support.tiktok.com/en/using-tiktok/exploring-videos/how-tiktok-recommends-content) include user interactions such as watch/skip, likes, shares, and comments, plus content and user information. These are ranking signals, not a public formula for virality.
- [TikTok ad testing guide](https://ads.tiktok.com/business/en-US/guides/ad-testing-guide) recommends defined goals, controlled tests, and relevant metrics. Paid ad learning must be kept distinct from organic performance.
- [TikTok creative guide](https://ads.tiktok.com/business/en/guides/what-is-ad-creative-guide) recommends testing multiple ad versions and tracking engagement, CTR, and watch time. This is advertising guidance and should not be presented as a promise for organic recommendations.
- Social posts and Reddit creator reports found during research are anecdotal. They show emerging workflows but do not establish production reliability or broad benchmark performance.

## Product principles carried forward

1. Optimize for qualified local business outcomes, not vanity reach alone.
2. Do not label an internal heuristic as “viral probability.”
3. Test a small number of meaningfully different creative hypotheses.
4. Track organic reach/retention/saves/shares separately from paid spend/CPL/conversions.
5. Keep material facts traceable to client input or a source timestamp.
6. Use a human review loop before final export or publication.
