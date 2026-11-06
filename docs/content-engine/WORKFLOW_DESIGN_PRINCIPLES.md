# Workflow Refinement: Source Notes

Source supplied in the conversation: [WeChat Channels video by Dr. Xiaohui](https://weixin.qq.com/sph/APQdU5yuLZ), approximately 4:04. The speaker describes repeatedly refining an AI video-editing workflow, translating subjective taste into clear instructions, managing temporary storage and token use, and learning through frequent real deliveries.

This document records a concise summary and PoStory product implications. It does not republish the full transcript.

## Source summary

- A capable AI edit can already save daily time, but a workflow still needs iterative refinement to meet an individual's delivery standard.
- Video is a public-facing result and personal storefront; its visual quality bar is harder to define than many document or slide tasks.
- Cover composition, transitions, and edit rhythm are difficult to specify once and reliably. Small corrections made conversationally may not persist into the next run.
- Storage and process-file cleanup matter: repeated large renders and intermediates can multiply disk use.
- Resource efficiency also includes token use.
- The speaker recommends applying AI workflow-building and agent-direction skills to frequent, real work, then refining the Skill against actual deliverables.

## Implications for PoStory

1. **Turn taste into durable project rules.** Save brand voice, cover hierarchy, caption density, preferred framing, transition rhythm, pacing, logo placement, and prohibited treatments in a client/project style profile. Store concrete reference frames and examples where possible.
2. **Make subjective review actionable.** Let reviewers leave a note at a frame/timecode, categorize it (framing, caption, pacing, transition, fact, audio), and carry recurring rules into that client's preferences only after confirmation.
3. **Use observable acceptance checks.** Produce preview contact sheets and a short rendered preview. Check exact facts, readable safe margins, abrupt cuts, audio balance, caption timing, frame continuity, and export settings. Keep aesthetic review human-guided.
4. **Track iteration, not just final output.** Record the first preview time, number/type of notes, renders, accepted version, and total human review time. Learn whether the workflow actually reduces effort without lowering quality.
5. **Manage media lifecycle explicitly.** Separate immutable sources, reusable analysis artifacts, temporary renders/proxies, previews, and approved final exports. Preflight free disk space. Reuse cached transcripts/keyframes when inputs have not changed. Remove only regenerable intermediates under a documented retention policy; never silently delete source media or approved deliverables.
6. **Use tokens for decisions, scripts for repeatable work.** Ask the model to interpret footage, plan a story, and explain choices. Use deterministic tools for metadata, transcription caching, timeline application, rendering, and validation. On revisions, send the changed region and relevant context rather than asking the model to re-analyze every file.
7. **Refine from high-frequency real work.** Start with one narrow repeat task, gather corrections across representative clients and content types, update style rules, and keep examples of accepted and rejected outputs. Do not optimize a Skill against a single showcase clip.

These principles complement the other documents in this folder: the product spec defines workflow boundaries, while the sample media review provides one concrete product-showcase case.


## Case 2: reusing an AI workflow for long interviews

Source supplied in the conversation: [WeChat Channels video by Dr. Xiaohui](https://weixin.qq.com/sph/AQ1nVjUuGb), approximately 4:15. This is a concise summary of the user-provided transcript, not a republication of the full transcript.

The speaker describes using an AI agent on long-form interviews to draft/correct subtitles, identify candidate golden quotes, prepare large captions, chapters, speaker switches, name labels, and packaging. They spent several days calibrating the workflow against personal taste and then reused it on multiple interviews. The speaker reports that contextual subtitle correction is around 80–90% accurate in their experience and recommends that a person review uncertain spans.

### Product implications

- Store word/segment confidence and flag names, numbers, product terms, overlap, and low-confidence phrases for review. Confidence is a triage aid, not a guarantee of correctness.
- Let the system propose quotable moments with timestamps, the exact supporting transcript, a proposed hook, and a reason. The editor approves before those moments become clips or captions.
- Create chapters from the transcript and let a reviewer rename them; preserve links to exact source timestamps.
- Speaker labels and lower thirds require identity confirmation. Do not infer a person's name from speech unless supplied by approved metadata.
- Save accepted style and correction rules per client/project and reapply them on the next interview. Keep a visible way to review and revise those rules.
- Evaluate on several representative interviews, not one showcase. Measure corrected error rate, accepted quote candidates, review time, and revision rounds.

The 80–90% figure is the speaker's self-reported experience, not an independent benchmark or a PoStory accuracy claim. The described workflow is for long interviews and should complement, not replace, the visual-first product-showcase route used for the sample product clips.
