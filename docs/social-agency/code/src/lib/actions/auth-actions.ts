'use server'

import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { createSession, destroySession, verifyPassword } from '@/lib/auth'

export type LoginActionState = { error: string | null }

export async function adminLoginAction(
  _prevState: LoginActionState,
  formData: FormData
): Promise<LoginActionState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')

  if (!email || !password) {
    return { error: '请输入邮箱和密码' }
  }

  const admin = await prisma.adminUser.findUnique({ where: { email } })
  // 统一返回"邮箱或密码错误",不区分邮箱是否存在,防止枚举攻击
  if (!admin || !(await verifyPassword(password, admin.passwordHash))) {
    return { error: '邮箱或密码错误' }
  }

  await createSession({ sub: admin.id, role: 'admin', email: admin.email })
  redirect('/admin')
}

export async function clientLoginAction(
  _prevState: LoginActionState,
  formData: FormData
): Promise<LoginActionState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')

  if (!email || !password) {
    return { error: '请输入邮箱和密码' }
  }

  const client = await prisma.client.findUnique({ where: { contactEmail: email } })
  if (!client || !(await verifyPassword(password, client.passwordHash))) {
    return { error: '邮箱或密码错误' }
  }

  if (client.status === 'SUSPENDED') {
    return { error: '账号已被暂停,请联系客服' }
  }

  await createSession({ sub: client.id, role: 'client', email: client.contactEmail })
  redirect('/dashboard')
}

export async function logoutAction(): Promise<void> {
  await destroySession()
  redirect('/login')
}
