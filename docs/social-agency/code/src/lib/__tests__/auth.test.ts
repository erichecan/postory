import { describe, it, expect } from 'vitest'
import { hashPassword, verifyPassword } from '@/lib/auth'

describe('密码哈希', () => {
  it('正确密码校验通过', async () => {
    const hash = await hashPassword('correct-horse-battery-staple')
    await expect(verifyPassword('correct-horse-battery-staple', hash)).resolves.toBe(true)
  })

  it('错误密码校验失败', async () => {
    const hash = await hashPassword('correct-horse-battery-staple')
    await expect(verifyPassword('wrong-password', hash)).resolves.toBe(false)
  })

  it('同一明文两次哈希结果不同(带随机 salt)', async () => {
    const a = await hashPassword('same-password')
    const b = await hashPassword('same-password')
    expect(a).not.toBe(b)
  })
})
