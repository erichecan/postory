import "server-only";

export type TurnstileDiagnostic = {
  stage: "configuration" | "token" | "siteverify" | "response" | "validation";
  httpStatus?: number;
  success?: boolean | null;
  errorCodes?: string[];
  actualHostname?: string;
  hostnameMatches?: boolean;
  actualAction?: string;
  actionMatches?: boolean;
  latencyMs?: number;
};

type TurnstileResult =
  | { ok: true; localBypass: boolean; diagnostic?: TurnstileDiagnostic }
  | { ok: false; reason: "notConfigured" | "invalid" | "unavailable"; diagnostic: TurnstileDiagnostic };

export async function verifyDemoTurnstile(token: string, hostname: string): Promise<TurnstileResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    return process.env.NODE_ENV !== "production"
      ? { ok: true, localBypass: true, diagnostic: { stage: "configuration" } }
      : { ok: false, reason: "notConfigured", diagnostic: { stage: "configuration" } };
  }
  if (!token || token.length > 2048) {
    return { ok: false, reason: "invalid", diagnostic: { stage: "token" } };
  }

  const body = new URLSearchParams({ secret, response: token });
  const startedAt = Date.now();
  let response: Response;
  try {
    response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });
  } catch {
    return {
      ok: false,
      reason: "unavailable",
      diagnostic: { stage: "siteverify", latencyMs: Date.now() - startedAt },
    };
  }

  const latencyMs = Date.now() - startedAt;
  if (!response.ok) {
    return {
      ok: false,
      reason: "unavailable",
      diagnostic: { stage: "siteverify", httpStatus: response.status, latencyMs },
    };
  }

  const result = (await response.json().catch(() => null)) as {
    success?: boolean;
    hostname?: string;
    action?: string;
    "error-codes"?: unknown;
  } | null;
  if (!result) {
    return { ok: false, reason: "unavailable", diagnostic: { stage: "response", httpStatus: response.status, latencyMs } };
  }

  const actualHostname = typeof result.hostname === "string" ? result.hostname.slice(0, 253) : "";
  const actualAction = typeof result.action === "string" ? result.action.slice(0, 64) : "";
  const diagnostic: TurnstileDiagnostic = {
    stage: "validation",
    httpStatus: response.status,
    success: result.success === true,
    errorCodes: Array.isArray(result["error-codes"])
      ? result["error-codes"].filter((code): code is string => typeof code === "string").slice(0, 10)
      : [],
    actualHostname,
    hostnameMatches: actualHostname === hostname,
    actualAction,
    actionMatches: actualAction === "demo_generate",
    latencyMs,
  };

  if (!result.success || !diagnostic.hostnameMatches || !diagnostic.actionMatches) {
    return { ok: false, reason: "invalid", diagnostic };
  }
  return { ok: true, localBypass: false, diagnostic };
}
