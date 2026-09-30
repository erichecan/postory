import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderTemplate } from '../orshot'
import { ProviderError } from '../types'

describe('orshot.renderTemplate', () => {
  beforeEach(() => {
    process.env.ORSHOT_API_KEY = 'test-key'
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    delete process.env.ORSHOT_API_KEY
  })

  it('成功时返回 assetUrl', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ data: { content: 'https://cdn.orshot.com/x.png' } }),
      })
    )

    const result = await renderTemplate({ templateId: 123, modifications: { title: 'hi' } })
    expect(result.assetUrl).toBe('https://cdn.orshot.com/x.png')
  })

  it('多页模板时取第一页的 content', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ data: [{ content: 'https://cdn.orshot.com/p1.png' }, { content: 'p2' }] }),
      })
    )

    const result = await renderTemplate({ templateId: 123, modifications: {} })
    expect(result.assetUrl).toBe('https://cdn.orshot.com/p1.png')
  })

  it('HTTP 失败时抛出 ProviderError,并带上状态码', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 402,
        json: async () => ({ message: 'INSUFFICIENT_CREDITS' }),
      })
    )

    await expect(renderTemplate({ templateId: 123, modifications: {} })).rejects.toMatchObject({
      name: 'ProviderError',
      code: 402,
    })
  })

  it('没有配置 API Key 时直接抛错,不发请求', async () => {
    delete process.env.ORSHOT_API_KEY
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)

    await expect(renderTemplate({ templateId: 1, modifications: {} })).rejects.toBeInstanceOf(
      ProviderError
    )
    expect(fetchSpy).not.toHaveBeenCalled()
  })
})
