import { ProviderError, type SupportedPlatform } from './types'

const AYRSHARE_BASE_URL = 'https://api.ayrshare.com/api'

function getApiKey(): string {
  const key = process.env.AYRSHARE_API_KEY
  if (!key) throw new ProviderError('AYRSHARE_API_KEY 未配置', 'ayrshare')
  return key
}

/**
 * 内部平台枚举 -> Ayrshare 的平台标识字符串。
 * 注意 X(Twitter)在 Ayrshare 里的 slug 是 "twitter",不是 "x",容易记错。
 * Google Business Profile 是 "gmb"。
 */
const PLATFORM_TO_AYRSHARE: Record<SupportedPlatform, string> = {
  INSTAGRAM: 'instagram',
  FACEBOOK: 'facebook',
  LINKEDIN: 'linkedin',
  TIKTOK: 'tiktok',
  YOUTUBE: 'youtube',
  PINTEREST: 'pinterest',
  X: 'twitter',
  GOOGLE_BUSINESS: 'gmb',
}

const AYRSHARE_TO_PLATFORM: Record<string, SupportedPlatform> = Object.fromEntries(
  Object.entries(PLATFORM_TO_AYRSHARE).map(([k, v]) => [v, k as SupportedPlatform])
)

async function ayrshareFetch<T>(
  path: string,
  options: { method?: string; body?: unknown; profileKey?: string }
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getApiKey()}`,
  }
  if (options.profileKey) headers['Profile-Key'] = options.profileKey

  const res = await fetch(`${AYRSHARE_BASE_URL}${path}`, {
    method: options.method ?? 'POST',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  const json = await res.json().catch(() => null)

  if (!res.ok || (json && typeof json === 'object' && (json as { status?: string }).status === 'error')) {
    const message =
      (json && typeof json === 'object' && 'message' in json && String(json.message)) ||
      `Ayrshare 请求失败,HTTP ${res.status}`
    const code = json && typeof json === 'object' && 'code' in json ? (json as { code: number }).code : res.status
    throw new ProviderError(message, 'ayrshare', code, json)
  }

  return json as T
}

export type CreateProfileResult = {
  profileKey: string
  refId: string
  title: string
}

/**
 * 给一个新商家客户在 Ayrshare 那边建一个 Profile。
 * 对应 docs/20260927-详细设计.md M3 的 ensureAyrshareProfile。
 */
export async function createProfile(title: string): Promise<CreateProfileResult> {
  return ayrshareFetch<CreateProfileResult>('/profiles', { body: { title } })
}

export type ConnectLinkResult = {
  url: string
  sessionId: string
  expiresAt: string
}

/**
 * 生成一个连接链接,发给商家客户自己去浏览器里点开、授权连接社交账号。
 *
 * 重要限制(2026-09-27 查证):不带 network 参数时,Ayrshare 返回的是"一个链接、
 * 里面列出全部支持的平台"的托管页(grid mode),不是"每个平台单独一个连接按钮"。
 * 要做到单平台直连(direct mode),需要额外开通 Ayrshare 的付费 Max Pack,
 * 否则会收到 code 504 的错误。本项目 MVP 阶段按 grid mode 设计:
 * 一个客户只需要点一次"连接社交账号",在 Ayrshare 的托管页上一次性连完所有平台。
 */
export async function createConnectLink(
  profileKey: string,
  expiresInMinutes = 60
): Promise<ConnectLinkResult> {
  return ayrshareFetch<ConnectLinkResult>('/profiles/link-sessions', {
    profileKey,
    body: { expiresIn: expiresInMinutes },
  })
}

export type ConnectedAccountsResult = {
  activeSocialAccounts: SupportedPlatform[]
  raw: unknown
}

/**
 * 回读某个商家客户当前实际连接了哪些平台。
 * Ayrshare 返回的是它自己的平台字符串数组,这里转换成内部枚举,
 * 未识别的平台字符串(比如客户连了本项目暂不支持的网络)直接丢弃,不报错。
 */
export async function getConnectedAccounts(profileKey: string): Promise<ConnectedAccountsResult> {
  const json = await ayrshareFetch<{ activeSocialAccounts: string[] }>('/user', {
    method: 'GET',
    profileKey,
  })

  const activeSocialAccounts = json.activeSocialAccounts
    .map((slug) => AYRSHARE_TO_PLATFORM[slug])
    .filter((p): p is SupportedPlatform => Boolean(p))

  return { activeSocialAccounts, raw: json }
}

export type PublishInput = {
  profileKey: string
  text: string
  mediaUrls: string[]
  platforms: SupportedPlatform[]
  scheduleDate?: Date
}

export type PublishResult = {
  ayrsharePostId: string
  perPlatformResults: Array<{ platform: SupportedPlatform; status: string; postUrl?: string; error?: string }>
}

/**
 * 发布或排期。不传 scheduleDate 就是立即发布,传了就是排期
 * ——排期这件事由 Ayrshare 自己的服务器到点触发,本项目不需要自己维护一个"到点发布"的队列。
 */
export async function publish(input: PublishInput): Promise<PublishResult> {
  const json = await ayrshareFetch<{
    status: string
    errors: unknown[]
    postIds: Array<{ status: string; platform: string; id?: string; postUrl?: string }>
    id?: string
  }>('/post', {
    profileKey: input.profileKey,
    body: {
      post: input.text,
      mediaUrls: input.mediaUrls,
      platforms: input.platforms.map((p) => PLATFORM_TO_AYRSHARE[p]),
      ...(input.scheduleDate ? { scheduleDate: input.scheduleDate.toISOString() } : {}),
    },
  })

  const perPlatformResults = json.postIds.map((p) => ({
    platform: AYRSHARE_TO_PLATFORM[p.platform] ?? (p.platform as SupportedPlatform),
    status: p.status,
    postUrl: p.postUrl,
    error: p.status !== 'success' ? p.status : undefined,
  }))

  return {
    ayrsharePostId: json.id ?? json.postIds[0]?.id ?? '',
    perPlatformResults,
  }
}
