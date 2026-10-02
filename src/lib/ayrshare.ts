import "server-only";
import { randomBytes } from "node:crypto";
import { requiresConnection, type PublishPlatformId } from "@/lib/platforms";

const API_BASE = "https://api.ayrshare.com/api";

/**
 * 本项目平台名 -> Ayrshare 平台字符串。X 是 "twitter" 不是 "x"（2026-09-29 查证 apis/post/post）。
 * 哪些平台需要真实连接见 src/lib/platforms.ts 的 requiresConnection（唯一真相，避免两处列表走偏）。
 */
const AYRSHARE_PLATFORM: Partial<Record<PublishPlatformId, string>> = {
  facebook: "facebook",
  instagram: "instagram",
  tiktok: "tiktok",
  x: "twitter",
  youtube: "youtube",
  pinterest: "pinterest",
  linkedin: "linkedin",
  threads: "threads",
};

export const isAyrshareSupported = requiresConnection;

const FROM_AYRSHARE_PLATFORM: Record<string, PublishPlatformId> = Object.fromEntries(
  Object.entries(AYRSHARE_PLATFORM).map(([k, v]) => [v, k as PublishPlatformId]),
);

export type PublishInput = {
  profileKey: string;
  caption: string;
  mediaUrl: string;
  platforms: PublishPlatformId[];
  scheduleDate?: Date;
};

export type PerPlatformResult = { platform: string; status: "success" | "error"; postUrl?: string; error?: string };
export type PublishResult = { postId: string; overallStatus: "SUCCESS" | "PARTIAL" | "FAILED"; perPlatform: PerPlatformResult[] };

export type AyrshareGateway = {
  mode: "live" | "fake";
  createProfile(input: { title: string }): Promise<{ profileKey: string; refId: string }>;
  createConnectLink(profileKey: string, redirectUrl: string): Promise<{ url: string }>;
  getConnectedAccounts(profileKey: string): Promise<{ platforms: string[] }>;
  publish(input: PublishInput): Promise<PublishResult>;
};

function statusFromResults(results: PerPlatformResult[]): PublishResult["overallStatus"] {
  const ok = results.filter((r) => r.status === "success").length;
  if (ok === results.length) return "SUCCESS";
  if (ok === 0) return "FAILED";
  return "PARTIAL";
}

function liveGateway(apiKey: string): AyrshareGateway {
  async function call<T>(path: string, opts: { method?: string; profileKey?: string; body?: unknown }): Promise<T> {
    const headers: Record<string, string> = { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` };
    if (opts.profileKey) headers["Profile-Key"] = opts.profileKey;
    const res = await fetch(`${API_BASE}${path}`, {
      method: opts.method ?? "POST",
      headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(`ayrshare ${path} failed: HTTP ${res.status} ${JSON.stringify(json)}`);
    return json as T;
  }

  return {
    mode: "live",
    // 接真实模式前需重新核对 https://www.ayrshare.com/docs/apis/profiles/overview 的确切请求/响应字段
    async createProfile({ title }) {
      const json = await call<{ profileKey: string; refId: string }>("/profiles/create-profile", { body: { title } });
      return { profileKey: json.profileKey, refId: json.refId };
    },
    // 接真实模式前需重新核对 https://www.ayrshare.com/docs/multiple-users/api-integration-business 的确切字段名
    async createConnectLink(profileKey, redirectUrl) {
      const json = await call<{ url: string }>("/profiles/link-sessions", { profileKey, body: { redirect: redirectUrl } });
      return { url: json.url };
    },
    async getConnectedAccounts(profileKey) {
      const json = await call<{ activeSocialAccounts: string[] }>("/user", { method: "GET", profileKey });
      // Ayrshare 用它自己的平台字符串（比如 "twitter"），转换回本项目内部 id（"x"）再返回，
      // 否则调用方按内部 id 比对永远匹配不上，X 连了也会一直显示未连接。
      return { platforms: (json.activeSocialAccounts ?? []).map((slug) => FROM_AYRSHARE_PLATFORM[slug]).filter((p): p is PublishPlatformId => Boolean(p)) };
    },
    async publish({ profileKey, caption, mediaUrl, platforms, scheduleDate }) {
      // 真实响应把每条帖子包在 posts[0] 里，顶层没有 postIds（2026-10-02 用生产 key 实测核实，
      // 之前按文档示例误以为 postIds 在顶层）。仅排期（未立即发布）时 posts[0] 连 postIds 都没有，
      // 只有 status:"scheduled"；立即发布成功/失败时才有 postIds（失败时为空数组，改用 errors）。
      const json = await call<{
        posts: {
          status: string;
          id?: string;
          postIds?: { platform: string; status: string; id?: string; postUrl?: string }[];
          errors?: { platform?: string; message?: string }[];
        }[];
      }>("/post", {
        profileKey,
        body: {
          post: caption,
          mediaUrls: [mediaUrl],
          platforms: platforms.map((p) => AYRSHARE_PLATFORM[p]).filter(Boolean),
          ...(scheduleDate ? { scheduleDate: scheduleDate.toISOString() } : {}),
        },
      });
      const entry = json.posts[0];
      if (entry.status === "scheduled") {
        const perPlatform: PerPlatformResult[] = platforms.map((p) => ({ platform: AYRSHARE_PLATFORM[p] ?? p, status: "success" }));
        return { postId: entry.id ?? "", overallStatus: "SUCCESS", perPlatform };
      }
      const postIds = entry.postIds ?? [];
      const perPlatform: PerPlatformResult[] =
        postIds.length > 0
          ? postIds.map((p) => ({
              platform: p.platform,
              status: p.status === "success" ? "success" : "error",
              postUrl: p.postUrl,
              error: p.status !== "success" ? p.status : undefined,
            }))
          : (entry.errors ?? []).map((e) => ({ platform: e.platform ?? "unknown", status: "error", error: e.message ?? entry.status }));
      return { postId: entry.id ?? "", overallStatus: statusFromResults(perPlatform), perPlatform };
    },
  };
}

function fakeGateway(): AyrshareGateway {
  const fakeId = (prefix: string) => `${prefix}_fake_${randomBytes(6).toString("hex")}`;
  return {
    mode: "fake",
    async createProfile() {
      return { profileKey: fakeId("pk"), refId: fakeId("ref") };
    },
    async createConnectLink(_profileKey, redirectUrl) {
      // fake 模式没有真实托管页可跳转，直接指回我们自己的回调路由，
      // 让弹出的新标签页立刻完成“已连接”这一步，UI 交互形状和真实模式一致。
      return { url: `${redirectUrl}${redirectUrl.includes("?") ? "&" : "?"}fake=1` };
    },
    async getConnectedAccounts() {
      return { platforms: [] };
    },
    async publish({ caption, mediaUrl, platforms }) {
      const perPlatform: PerPlatformResult[] = platforms.map((p) => ({ platform: AYRSHARE_PLATFORM[p] ?? p, status: "success" }));
      void caption;
      void mediaUrl;
      return { postId: fakeId("post"), overallStatus: "SUCCESS", perPlatform };
    },
  };
}

export function getAyrshareGateway(): AyrshareGateway {
  const key = process.env.AYRSHARE_API_KEY;
  if (process.env.AYRSHARE_MODE === "fake" || (!key && process.env.NODE_ENV !== "production")) return fakeGateway();
  if (!key) throw new Error("AYRSHARE_API_KEY is required when AYRSHARE_MODE=real");
  return liveGateway(key);
}
