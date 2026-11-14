const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

export function isVideoLabLocalAccessEnabled() {
  return process.env.NODE_ENV === "development"
    && process.env.ENABLE_VIDEO_LAB === "true"
    && process.env.VIDEO_LAB_LOCAL_ACCESS === "true";
}

export function isLoopbackHost(hostHeader: string | null) {
  if (!hostHeader) return false;
  try {
    const hostname = new URL(`http://${hostHeader}`).hostname.replace(/^\[|\]$/g, "").toLowerCase();
    return LOOPBACK_HOSTS.has(hostname);
  } catch {
    return false;
  }
}
