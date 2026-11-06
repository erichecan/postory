# GCP Cloud Run deployment — Internal Content Studio

Status: **runbook prepared; not deployed**. The currently known PoStory Cloud Run origin is `https://postory-dfd7b2qpra-ew.a.run.app/`. It is an existing production website; do not redeploy or overwrite it merely to test a feature branch.

## Requirements

1. An operator authenticated in **the same GCP project that hosts PoStory**, with Cloud Run deployment permissions and Cloud Build / Artifact Registry permissions.
2. The actual GCP **project ID** and **region** from the live service. The public hostname alone is insufficient to identify a secure deployment target and service dependencies.
3. A PostgreSQL instance/environment matching the current Prisma schema; existing `DATABASE_URL`, session signing keys, storage settings and required authentication secrets from the live Cloud Run configuration. Do not copy secret values into GitHub.
4. A server-side OpenAI API key, preferably from Secret Manager as `OPENAI_API_KEY`. Without it the app can perform local sampling/manual crop but not AI product recognition.
5. Successful compilation/typecheck of branch `feat/internal-content-studio-mvp`.

## Preferred isolation strategy

**Safer:** deploy the reviewed branch to a **separate staging Cloud Run service** (e.g. `postory-content-studio-test`) with test authorization/DB and a restricted audience. Keep `postory` production service unchanged.

Because this app uses session authentication, the staging service must have its own working login environment, database access and signing keys. `requireAdmin()` gates `/internal/content-studio`; `assertAdmin()` gates the analysis API. A URL alone is not sufficient for authorization.

## Manual deployment sequence for an authorized GCP operator

Obtain existing deployment configuration first:

```bash
gcloud auth login
gcloud config set project YOUR_EXISTING_GCP_PROJECT_ID
gcloud run services list --region YOUR_EXISTING_REGION
gcloud run services describe YOUR_EXISTING_SERVICE_NAME --region YOUR_EXISTING_REGION
```

Inspect the service account, env/secret bindings, Cloud SQL connection, network, ingress and authentication configuration **without copying secret payloads**. Do not run schema migrations against production automatically.

From the reviewed GitHub branch:

```bash
git clone https://github.com/erichecan/postory.git
cd postory
git checkout feat/internal-content-studio-mvp
npm ci
npm run typecheck
npm run build
```

Only after the tests pass and the operator has configured staging **database/auth/storage bindings** and secrets, build and deploy to a **new** test service (the repo's Dockerfile is supported by Cloud Run source deployment):

```bash
gcloud run deploy postory-content-studio-test \
  --source . \
  --project YOUR_EXISTING_GCP_PROJECT_ID \
  --region YOUR_EXISTING_REGION \
  --no-allow-unauthenticated
```

The command above is a **template**, not a complete runnable deployment command: required Cloud SQL connectivity, runtime variables, secrets, service account and ingress settings must match the actual GCP environment. Be careful: `--no-allow-unauthenticated` requires Cloud Run IAM access **in addition** to the application's admin login; choose authentication policy intentionally. To allow browsing with the existing web-app login, an authorized operator may need to permit public invocation while keeping app-level admin authentication enforced; do not change the production service's invocation policy casually.

For Secret Manager integration, use `--update-secrets=OPENAI_API_KEY=YOUR_SECRET_NAME:latest` or the Cloud Run console's "Reference a secret" setting after granting the staging service identity appropriate Secret Manager access. Never embed keys in build args, Dockerfile, JavaScript or commits.

Once deployed, get the **actual URL** from Cloud Run output:

```bash
gcloud run services describe postory-content-studio-test \
  --project YOUR_EXISTING_GCP_PROJECT_ID \
  --region YOUR_EXISTING_REGION \
  --format='value(status.url)'
```

Open `ACTUAL_URL/internal/content-studio` and sign in with an authorized admin identity. Do not invent a service URL from a name before Cloud Run reports it.

## Smoke tests

- [ ] Staging service Ready and page resolves with correct admin login
- [ ] Non-admin sees no studio; unauthenticated POST cannot call API
- [ ] Video (MP4/H.264) produces keyframes locally on desktop/mobile
- [ ] OpenAI product recognition identifies actual products with unverified facts flagged
- [ ] Product bounding box overlay and exported 1:1 / 4:5 / 16:9 crops are aligned
- [ ] No raw client media or API secrets published to the public GitHub repository
- [ ] Production existing site works unchanged

## Current blockers in this ChatGPT session

- No authenticated GCP Cloud Run deploy action or GCP runtime credentials available.
- No `gcloud` binary nor access to the user's GCP project in the current environment.
- No known GCP project ID/region and no verified staging database/auth/secret bindings.
- This branch is not yet build-tested, and real-video QA still needs to be run.

Therefore do not mark the feature as publicly deployed or supply a fabricated `.run.app` link.
