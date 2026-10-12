import "server-only";

export async function verifyDemoTurnstile(token: string, hostname: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return process.env.NODE_ENV !== "production" ? { ok: true as const, localBypass: true } : { ok: false as const, reason: "notConfigured" };
  if (!token || token.length > 2048) return { ok: false as const, reason: "invalid" };

  const body = new URLSearchParams({ secret, response: token });
  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
    signal: AbortSignal.timeout(8_000),
  }).catch(() => null);
  if (!response?.ok) return { ok: false as const, reason: "unavailable" };
  const result = (await response.json().catch(() => null)) as { success?: boolean; hostname?: string; action?: string } | null;
  if (!result?.success || result.hostname !== hostname || result.action !== "demo_generate") return { ok: false as const, reason: "invalid" };
  return { ok: true as const, localBypass: false };
}
