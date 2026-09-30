import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { generateCaption } from '../llm'
import { ProviderError } from '../types'

describe('llm.generateCaption', () => {
  beforeEach(() => {
    process.env.LLM_API_KEY = 'test-key'
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    delete process.env.LLM_API_KEY
  })

  it('正常解析出 captionText 和 hashtags', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          content: [
            {
              type: 'text',
              text: '{"captionText": "本周新品上市啦", "hashtags": ["新品", "烘焙"]}',
            },
          ],
        }),
      })
    )

    const result = await generateCaption({
      briefText: '本周新品上市',
      toneKeywords: ['温暖'],
      businessName: 'Sunrise Bakery',
      platform: 'instagram',
    })

    expect(result.captionText).toBe('本周新品上市啦')
    expect(result.hashtags).toEqual(['新品', '烘焙'])
  })

  it('返回内容不是 JSON 时抛出 ProviderError,调用方可以据此走降级文案', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ content: [{ type: 'text', text: '这不是 JSON' }] }),
      })
    )

    await expect(
      generateCaption({ briefText: 'x', toneKeywords: [], businessName: 'A', platform: 'instagram' })
    ).rejects.toBeInstanceOf(ProviderError)
  })
})
