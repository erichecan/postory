import { ProviderError } from './types'

const ORSHOT_BASE_URL = 'https://api.orshot.com/v1'

function getApiKey(): string {
  const key = process.env.ORSHOT_API_KEY
  if (!key) throw new ProviderError('ORSHOT_API_KEY 未配置', 'orshot')
  return key
}

export type RenderModifications = Record<string, string | number | boolean>

export type RenderTemplateInput = {
  templateId: number
  modifications: RenderModifications
  format?: 'png' | 'jpg' | 'webp' | 'pdf' | 'mp4'
}

export type RenderTemplateResult = {
  assetUrl: string
  raw: unknown
}

/**
 * 调 Orshot 的 Studio 模板渲染接口。
 * 见 docs/20260927-详细设计.md M7:modifications 的 key 是模板里参数的名字(paramId),
 * 不是随便传的——每个模板具体有哪些参数名,要先在 Orshot Studio 编辑器里打开模板确认。
 *
 * 本项目目前没有对幂等性做特殊处理:Orshot 官方文档没有确认过是否支持 Idempotency-Key 请求头
 * (跟 Taka 那种明确写了幂等支持的 API 不一样),所以幂等性由应用层保证——
 * 调这个函数之前,services 层必须先检查 Submission.status,不要对同一条 Submission 并发/重复调用。
 */
export async function renderTemplate(
  input: RenderTemplateInput
): Promise<RenderTemplateResult> {
  const res = await fetch(`${ORSHOT_BASE_URL}/studio/render`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify({
      templateId: input.templateId,
      modifications: input.modifications,
      response: {
        type: 'url',
        format: input.format ?? 'png',
      },
    }),
  })

  const json = await res.json().catch(() => null)

  if (!res.ok) {
    const message =
      (json && typeof json === 'object' && 'message' in json && String(json.message)) ||
      `Orshot 渲染失败,HTTP ${res.status}`
    throw new ProviderError(message, 'orshot', res.status, json)
  }

  const data = (json as { data?: unknown })?.data
  const content = Array.isArray(data)
    ? (data[0] as { content?: string })?.content
    : (data as { content?: string })?.content

  if (!content) {
    throw new ProviderError('Orshot 返回了成功状态但没有可用的图片地址', 'orshot', undefined, json)
  }

  return { assetUrl: content, raw: json }
}
