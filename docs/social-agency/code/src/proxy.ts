import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

// Next.js 16 把 middleware.ts 重命名为 proxy.ts,行为不变。
// 铁律(见 Next.js 官方 Data Security 指南):这里只做"体验层"的快速拦截/跳转,
// 不能作为唯一防线——每个 Server Action 内部仍然会调用 requireSession() 自证,
// 因为 Server Action 可以被直接 POST 调用,不一定经过这里的 matcher。

const COOKIE_NAME = 'sa_session'

async function readRole(request: NextRequest): Promise<'admin' | 'client' | null> {
  const token = request.cookies.get(COOKIE_NAME)?.value
  if (!token) return null
  const secret = process.env.AUTH_SECRET
  if (!secret) return null
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret))
    return (payload as { role?: 'admin' | 'client' }).role ?? null
  } catch {
    return null
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const role = await readRole(request)

  const isAdminArea = pathname.startsWith('/admin') && pathname !== '/admin/login'
  const isClientArea =
    (pathname.startsWith('/dashboard') || pathname === '/') && pathname !== '/login'

  if (isAdminArea && role !== 'admin') {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  if (isClientArea && pathname.startsWith('/dashboard') && role !== 'client') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*'],
}
