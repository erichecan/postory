# GCP Cloud Run deployment — Internal Content Studio

Status: **ready for isolated staging deployment**. The production service is `postory` in project `supply-491510`, region `europe-west1`, at `https://postory-dfd7b2qpra-ew.a.run.app/`. Do not redeploy or overwrite it to test this feature branch.

## Verified environment

- The authenticated `gcloud` identity can inspect the existing PoStory Cloud Run service.
- Existing Secret Manager references are available: `postory-database-url`, `postory-auth-secret`, `postory-encryption-key`, `postory-openai-api-key`, `postory-turnstile-secret`, and `postory-demo-trial-hash-secret`.
- The existing runtime identity has Secret Manager access. The production service uses `DATABASE_URL` and `AUTH_SECRET` references for login/session verification.
- `feat/internal-content-studio-mvp` passes `npm run typecheck` and `npm run build`.
- The workbench is responsive and includes a Web App Manifest for phone home-screen installation. Cloud Run hosts the web/PWA service; it does not host a native iOS or Android install package.
- The manifest URL is publicly served so the phone browser can read install metadata before sign-in; the studio and analysis API remain admin-protected.

## Isolation and access

Deploy only to the new `postory-content-studio-test` service in `europe-west1`. It reuses the existing database/login and OpenAI secret references so an existing administrator can sign in and test recognition. It does not run Prisma migrations. Keep AI provider, billing and social publishing modes fake/disabled in staging.

Cloud Run must allow browser invocation for the app's own login flow. The studio page uses `requireAdmin()` and its analysis endpoint uses `assertAdmin()`. The Cloud Run invoker policy is public, as on the existing service, but the workbench and recognition API remain behind PoStory admin authentication. Do not change the production service's IAM policy.

## Deployment

From a checkout of the reviewed branch, first run:

```bash
npm ci
npm run typecheck
npm run build
```

Then deploy to the new service (no database migration):

```bash
gcloud run deploy postory-content-studio-test \
  --source . \
  --project supply-491510 \
  --region europe-west1 \
  --service-account 549968261036-compute@developer.gserviceaccount.com \
  --allow-unauthenticated \
  --set-env-vars STORAGE=gcs,GCS_BUCKET=postory-user-media,AI_PROVIDER=fake,STRIPE_MODE=fake,AYRSHARE_MODE=fake,DEMO_DAILY_GENERATION_LIMIT=10,DEMO_TRUSTED_IP_HEADER=x-forwarded-for \
  --set-secrets DATABASE_URL=postory-database-url:latest,AUTH_SECRET=postory-auth-secret:latest,ENCRYPTION_KEY=postory-encryption-key:latest,OPENAI_API_KEY=postory-openai-api-key:latest,TURNSTILE_SECRET_KEY=postory-turnstile-secret:latest,DEMO_TRIAL_HASH_SECRET=postory-demo-trial-hash-secret:latest
```

After Cloud Run returns the new service URL, set `APP_URL` to that exact URL:

```bash
gcloud run services update postory-content-studio-test \
  --project supply-491510 --region europe-west1 \
  --update-env-vars APP_URL=ACTUAL_CLOUD_RUN_URL
```

Confirm the live URL instead of deriving one from the service name:

```bash
gcloud run services describe postory-content-studio-test \
  --project supply-491510 --region europe-west1 \
  --format='value(status.url)'
```

Open `ACTUAL_CLOUD_RUN_URL/internal/content-studio` and sign in with an existing admin account. No production service configuration is changed by these commands.

## Smoke tests

- [ ] New staging service reports Ready and its sign-in page loads.
- [ ] Existing admin login opens the studio; non-admin users cannot access it.
- [ ] Unauthenticated analysis API requests are rejected.
- [ ] A phone browser can open the workbench and offers Add to Home Screen / Install.
- [ ] MP4/H.264 video yields local keyframes; OpenAI recognition works via Secret Manager.
- [ ] Crop overlay and 1:1, 4:5 and 16:9 PNG exports are aligned.
- [ ] The existing production service remains unchanged.

The code has passed local typecheck and production build. Real-video/mobile behavior still requires user testing with actual agency footage.
