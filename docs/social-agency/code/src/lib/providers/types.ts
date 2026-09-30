/**
 * 三个 Provider 适配层的公共类型。
 * 业务逻辑层(services/*)只依赖这里的类型,不直接感知 Orshot/Ayrshare/LLM 各自的 SDK 细节。
 * 换供应商时只改对应的 provider 文件,这里的类型和调用方都不用动。
 */

export type SupportedPlatform =
  | 'INSTAGRAM'
  | 'FACEBOOK'
  | 'LINKEDIN'
  | 'TIKTOK'
  | 'YOUTUBE'
  | 'PINTEREST'
  | 'X'
  | 'GOOGLE_BUSINESS'

export const SUPPORTED_PLATFORMS: SupportedPlatform[] = [
  'INSTAGRAM',
  'FACEBOOK',
  'LINKEDIN',
  'TIKTOK',
  'YOUTUBE',
  'PINTEREST',
  'X',
  'GOOGLE_BUSINESS',
]

export class ProviderError extends Error {
  constructor(
    message: string,
    public readonly provider: 'orshot' | 'ayrshare' | 'llm',
    public readonly code?: string | number,
    public readonly cause?: unknown
  ) {
    super(message)
    this.name = 'ProviderError'
  }
}
