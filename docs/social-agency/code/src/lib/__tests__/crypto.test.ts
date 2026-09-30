import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { encryptSecret, decryptSecret } from '../crypto'

describe('crypto', () => {
  beforeEach(() => {
    process.env.ENCRYPTION_KEY = 'wyQTZ0qOAdvcfD/QA0kb1ZxSnkOf6LjTWb7K2aRX8Zw='
  })
  afterEach(() => {
    delete process.env.ENCRYPTION_KEY
  })

  it('加密后解密能拿回原文', () => {
    const cipher = encryptSecret('PROFILE-KEY-abc123')
    expect(decryptSecret(cipher)).toBe('PROFILE-KEY-abc123')
  })

  it('同一明文每次加密结果不同(随机 iv)', () => {
    const a = encryptSecret('same-plain-text')
    const b = encryptSecret('same-plain-text')
    expect(a).not.toBe(b)
    expect(decryptSecret(a)).toBe('same-plain-text')
    expect(decryptSecret(b)).toBe('same-plain-text')
  })

  it('密文被篡改后解密应该抛错(GCM 认证失败),不能静默返回错误数据', () => {
    const cipher = encryptSecret('sensitive-value')
    const tampered = Buffer.from(cipher, 'base64')
    tampered[tampered.length - 1] ^= 0xff
    expect(() => decryptSecret(tampered.toString('base64'))).toThrow()
  })

  it('ENCRYPTION_KEY 未配置时明确报错', () => {
    delete process.env.ENCRYPTION_KEY
    expect(() => encryptSecret('x')).toThrow('ENCRYPTION_KEY')
  })
})
