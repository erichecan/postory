import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'

export type SessionRole = 'admin' | 'client'

export type SessionPayload = {
  sub: string // AdminUser.id 或 Client.id
  role: SessionRole
  email: string
}

const COOKIE_NAME = 'sa_session'
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7 // 7 天

function getSecretKey() {
  const secret = process.env.AUTH_SECRET
  if (!secret) {
    throw new Error('AUTH_SECRET 未配置,请在 .env.local 里设置(openssl rand -base64 32 生成)')
  }
  return new TextEncoder().encode(secret)
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10)
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash)
}

export async function createSession(payload: SessionPayload): Promise<void> {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getSecretKey())

  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  })
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, getSecretKey())
    return payload as unknown as SessionPayload
  } catch {
    return null
  }
}

/**
 * 每个 Server Action 都必须显式调用这个函数校验身份,不能只依赖 proxy.ts 的路由守卫。
 * 这是 Next.js 16 官方推荐的安全模式:proxy 可能因为 matcher 配置疏漏而漏掉某个 Server Action,
 * 所以 Server Action 内部必须自证。
 */
export async function requireSession(role: SessionRole): Promise<SessionPayload> {
  const session = await getSession()
  if (!session || session.role !== role) {
    throw new Error('UNAUTHORIZED')
  }
  return session
}
