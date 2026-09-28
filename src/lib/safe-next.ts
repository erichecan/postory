const LOCAL_ORIGIN = "http://local.invalid";
export const DUMMY_HASH = "$2b$10$CwTycUXWue0Thq9StjUM0uJ8i0p3dJxHkq4oVbkdzGKuVZIXWxCAe";

export function safeNext(next: unknown) {
  if (typeof next !== "string" || !next.startsWith("/")) return "/templates";
  try {
    const url = new URL(next, LOCAL_ORIGIN);
    return url.origin === LOCAL_ORIGIN ? url.pathname + url.search : "/templates";
  } catch {
    return "/templates";
  }
}
