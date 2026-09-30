import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createProfile, createConnectLink, getConnectedAccounts, publish } from '../ayrshare'

describe('ayrshare provider', () => {
  beforeEach(() => {
    process.env.AYRSHARE_API_KEY = 'test-key'
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    delete process.env.AYRSHARE_API_KEY
  })

  it('createProfile 返回 profileKey', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          status: 'success',
          title: 'Sunrise Bakery',
          refId: 'ref123',
          profileKey: 'PROFILE-KEY-1',
        }),
      })
    )

    const result = await createProfile('Sunrise Bakery')
    expect(result.profileKey).toBe('PROFILE-KEY-1')
  })

  it('createConnectLink 会带上 Profile-Key 请求头', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'success',
        sessionId: 's1',
        url: 'https://profile.ayrshare.com?session=xyz',
        expiresAt: '2026-01-01T00:00:00Z',
      }),
    })
    vi.stubGlobal('fetch', fetchSpy)

    await createConnectLink('PROFILE-KEY-1', 30)

    const [, options] = fetchSpy.mock.calls[0]
    expect(options.headers['Profile-Key']).toBe('PROFILE-KEY-1')
    expect(JSON.parse(options.body)).toEqual({ expiresIn: 30 })
  })

  it('getConnectedAccounts 把 ayrshare 平台字符串转换成内部枚举,twitter -> X', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ activeSocialAccounts: ['instagram', 'twitter', 'gmb', 'unknown-network'] }),
      })
    )

    const result = await getConnectedAccounts('PROFILE-KEY-1')
    expect(result.activeSocialAccounts).toEqual(['INSTAGRAM', 'X', 'GOOGLE_BUSINESS'])
  })

  it('publish 未连接渠道时,单平台错误反映在 perPlatformResults 里', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          status: 'success',
          errors: [],
          id: 'post_1',
          postIds: [
            { status: 'success', platform: 'instagram', id: 'ig1', postUrl: 'https://instagram.com/p/1' },
            { status: 'error', platform: 'facebook' },
          ],
        }),
      })
    )

    const result = await publish({
      profileKey: 'PROFILE-KEY-1',
      text: 'hello',
      mediaUrls: ['https://x.com/a.png'],
      platforms: ['INSTAGRAM', 'FACEBOOK'],
    })

    expect(result.perPlatformResults).toEqual([
      { platform: 'INSTAGRAM', status: 'success', postUrl: 'https://instagram.com/p/1', error: undefined },
      { platform: 'FACEBOOK', status: 'error', postUrl: undefined, error: 'error' },
    ])
  })
})
