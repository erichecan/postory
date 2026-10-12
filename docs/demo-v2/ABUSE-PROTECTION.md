# Demo image generation protection

The anonymous demo uses a separate server route and does not enable AI for signed-in product generation. The API key stays server-side.

## Enforced limits

- One reserved generation per signed visitor cookie **or source IP** for the lifetime of the trial. Refreshing the page does not reset either limit.
- One output per request, medium quality, with an approximate daily cap of 10 generations across all visitors (`DEMO_DAILY_GENERATION_LIMIT` can lower or raise it, capped at 100).
- A reservation is consumed before calling the image provider. Provider errors and timeouts stay consumed to prevent retry loops from creating more billable requests.
- Cloudflare Turnstile is verified server-side in production. The API also checks same-origin requests, upload sizes, image bytes/MIME, and request idempotency.
- An admin can issue a single-use support code at `/admin/demo-trials`. It expires in 15 minutes and overrides one visitor/IP lock. A fresh code must be issued for each manual release.

MAC addresses, IMEI, and IDFA are not exposed to browser applications. This implementation therefore uses an HttpOnly signed first-party cookie plus IP and Turnstile; it does not claim device-hardware identification or phone/SMS verification. The support-code workflow is the manual release path.

## Required production configuration

- `OPENAI_API_KEY`: the server-side key already present in the local environment; never use a `NEXT_PUBLIC_` name.
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY`: create a Cloudflare Turnstile widget for the production host and configure both halves.
- `DEMO_TRIAL_HASH_SECRET`: at least 32 random characters, stable across all app instances and deployments. Do not rotate casually: existing hashes will no longer match and previously used visitors/IPs could receive a new trial.
- `DEMO_TRUSTED_IP_HEADER`: defaults to `cf-connecting-ip`. Keep that default only when Cloudflare is the trusted edge and the origin cannot be reached while spoofing that header. Otherwise set the exact header supplied by the trusted proxy and block direct-origin traffic.
- Apply the additive Prisma migration before enabling the route.

The repository deploys to Cloud Run at `https://postory-dfd7b2qpra-ew.a.run.app`. The deployment workflow uses these Google Secret Manager entries: `postory-openai-api-key`, `postory-turnstile-secret`, and `postory-demo-trial-hash-secret`; the client site key is a GitHub repository variable named `NEXT_PUBLIC_TURNSTILE_SITE_KEY`. The workflow builds the app and migration images, executes `prisma migrate deploy` as a Cloud Run Job, then deploys the app image.

The Cloud Run service uses Google's `x-forwarded-for` chain for its source-IP trial lock. It discards caller-supplied prefix values and hashes the address immediately before the final forwarding proxy. If traffic later moves behind a Cloudflare-proxied custom domain, change `DEMO_TRUSTED_IP_HEADER` to `cf-connecting-ip` and ensure direct-origin traffic cannot spoof that header.

For a conservative pilot, set `DEMO_DAILY_GENERATION_LIMIT=10`. Alert on provider spend independently; the daily image count is a request cap, not a dollar budget.

## Local development

Turnstile and trusted IP checks have a local-only bypass when their secrets/header are absent. Production fails closed. Local generation still consumes the shared database ledger and can make a real provider request, so avoid clicking Generate during development unless intentionally spending the demo allowance.
