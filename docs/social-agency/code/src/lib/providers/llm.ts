import { ProviderError } from './types'

const ANTHROPIC_BASE_URL = 'https://api.anthropic.com/v1/messages'
const DEFAULT_MODEL = process.env.LLM_MODEL ?? 'claude-sonnet-5'

function getApiKey(): string {
  const key = process.env.LLM_API_KEY
  if (!key) throw new ProviderError('LLM_API_KEY 未配置', 'llm')
  return key
}

export type GenerateCaptionInput = {
  briefText: string
  toneKeywords: string[]
  businessName: string
  platform: string
}

export type GenerateCaptionResult = {
  captionText: string
  hashtags: string[]
}

/**
 * 见 docs/20260927-详细设计.md M6。
 * DEV-PLAN.md 假设清单里写明:文案供应商按 Anthropic Claude API 设计,接口做成可替换——
 * 换供应商(比如换成 OpenAI)只需要重写这个文件,调用方(services/generateContent.ts)不用动。
 *
 * 降级策略:调用失败或返回内容不合规时,由调用方(services 层)接住异常、
 * 换成保底文案继续走流程,不在这一层做兜底——这一层只负责"调用失败就如实抛错"。
 */
export async function generateCaption(input: GenerateCaptionInput): Promise<GenerateCaptionResult> {
  const prompt = buildPrompt(input)

  const res = await fetch(ANTHROPIC_BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': getApiKey(),
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  const json = await res.json().catch(() => null)

  if (!res.ok) {
    const message =
      (json && typeof json === 'object' && 'error' in json
        ? String((json as { error: { message?: string } }).error?.message)
        : null) || `LLM 请求失败,HTTP ${res.status}`
    throw new ProviderError(message, 'llm', res.status, json)
  }

  const text = extractText(json)
  return parseCaptionResponse(text)
}

function buildPrompt(input: GenerateCaptionInput): string {
  return [
    `你在帮 "${input.businessName}" 这家小商家写一条 ${input.platform} 社媒帖子的文案。`,
    `品牌语气关键词:${input.toneKeywords.join('、') || '无特别要求'}`,
    `这次要发的内容简介:${input.briefText}`,
    '',
    '请用下面这个 JSON 格式回复,不要输出任何 JSON 之外的文字:',
    '{"captionText": "正文文案", "hashtags": ["标签1", "标签2"]}',
  ].join('\n')
}

function extractText(json: unknown): string {
  const content = (json as { content?: Array<{ type: string; text?: string }> })?.content
  const textBlock = content?.find((c) => c.type === 'text')
  return textBlock?.text ?? ''
}

function parseCaptionResponse(text: string): GenerateCaptionResult {
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) {
    throw new ProviderError('LLM 返回内容无法解析出 JSON', 'llm', undefined, text)
  }
  try {
    const parsed = JSON.parse(match[0]) as { captionText?: string; hashtags?: string[] }
    if (!parsed.captionText) {
      throw new Error('缺少 captionText 字段')
    }
    return {
      captionText: parsed.captionText,
      hashtags: parsed.hashtags ?? [],
    }
  } catch (err) {
    throw new ProviderError('LLM 返回的 JSON 格式不合法', 'llm', undefined, err)
  }
}
