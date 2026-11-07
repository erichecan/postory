# PoStory Internal Content Studio — P0/P1 Test Workbench

Status: **implemented MVP on the feature branch, pending build/deployment and real-video QA**. This is an **internal admin production tool**, not a customer-facing SaaS product.

## Access
- Admin-only route: `/internal/content-studio`; linked from the admin navigation as “内容工作台”.
- The page uses existing `requireAdmin()` and the JSON API uses `assertAdmin()`.
- Run the existing Next.js development server (repository script: `npm run dev`, port 3002) or deploy as usual, and log in as an account with `role=ADMIN`.
- Configure `OPENAI_API_KEY` **only in server-side environment settings** before calling recognition. Optional `POSTORY_VISION_MODEL` (defaults to `gpt-4.1-mini`). Do not add keys to Git, screenshots or client JavaScript.

## What is truly implemented
1. User chooses up to 8 videos and/or images in the browser, 500 MB per file (the device must support decoding). Multiple videos are allowed and decoded one at a time. Files remain in the browser session.
2. Browser video decoding extracts up to six timestamps per video and scales keyframes to max 960 px for this recognition MVP. Images similarly become keyframes. The source video itself is **not uploaded** to the server in this version.
3. Admin clicks “识别画面中的商品”. All sampled JPEG keyframes are analyzed in sequential batches of up to 8, so a full batch of 8 videos can make up to 6 OpenAI requests. Each batch is forwarded to OpenAI Responses API with a grounded product-identification prompt. Response includes product name/category, observable features, source frame index, approximate crop rectangle, unconfirmed facts, and candidate marketing angles. More files take longer and use more API quota/cost.
4. User clicks a product or skips recognition, chooses a source keyframe, adjusts a crop rectangle manually and exports a 1:1, 4:5 or 16:9 white-background PNG.
5. Analysis report may be downloaded as JSON (filenames, timestamps, and model observations; **not** raw video, image contents or source audio).
6. The UI shows which steps actually work and labels later capabilities as **not developed**.

The studio uses the existing PoStory logo and design tokens: white/light canvas, rounded cards, magenta-orange accent, compact left navigation.

## What is NOT implemented yet
- Persistent server-side raw video upload/asset library, video jobs/queue, cloud storage for this new studio.
- Fine object segmentation, transparent background, high-resolution source extraction, generative image editing, restoration/upscaling.
- Exact brand/model verification, OCR product labels, batch deduplication across long videos, product data lookup.
- Automatic 20-post image/copy calendar, scheduler publishing, performance feedback.
- One-click video editing, subtitle alignment, rendered editable timeline, music, and review/approval state.
- No production test with authorized agency footage has been run in this PR. No guarantee of viral reach.

## Privacy and quality rules
- Video/photo originals remain on the device during the test session; after clicking recognition the **sampled frames are transmitted to OpenAI through the server**, subject to the API service's data handling. Do not use media lacking customer permission.
- Site refresh resets local state. Download crops/JSON before leaving.
- Generated boxes are approximate; the user must review and correct crops.
- The PNG export only crops a lower-resolution sample and lays it on a white canvas. It does **not** prove that a genuinely blurred, distorted, hidden, or side-view product has been restored. Do not present exported files as verified catalog photographs or invented angles.
- No third-party Skill was installed; the first vertical slice deliberately uses browser Canvas + the existing Next.js stack + OpenAI Vision. Future specialized skills should integrate behind task/job interfaces and be tested individually.
- Use internal testing with consented images and local test accounts, not private client media committed into this public repository.

## Manual acceptance test

1. `npm install` / `npm run dev`; sign in with an admin account.
2. Visit `http://localhost:3002/internal/content-studio`.
3. Choose two or more short MP4/H.264 videos (optionally with images) and click **提取商品关键帧**. Extraction should progress through each selected file sequentially.
4. Verify that each video contributes up to 2–6 representative frames; switching thumbnails works across all sources.
5. With `OPENAI_API_KEY` present, click **识别画面中的商品** and confirm progress advances through sequential batches when more than 8 frames are selected. Review the detected products, source frames and missing facts. With no key, the API should explain why recognition is unavailable; manual crop must still work.
6. Open **产品精修**; change the source frame and all four crop sliders, select each ratio, export PNG. Confirm that the crop corresponds to the drawn selection, not the surrounding letterbox area.
7. Download JSON, navigate between stages, verify no outside client can view the admin route/API.
8. Verify that 20 posts and one-click video are clearly labeled “尚未开发”, not misrepresented as complete.

### Recommended next milestone
Add **true original-resolution keyframe export** and product segmentation; then versioned product asset storage and OpenAI image-edit review. Only after product fidelity passes manual QA, add the 20-content strategist and creative video editor. See [the integrated workflow](INTEGRATED_DELIVERY_WORKFLOW.md) and [November 5 agency decision log](DECISION_LOG_2026-11-05.md).
