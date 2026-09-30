'use server'

import { randomBytes } from 'node:crypto'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireSession, hashPassword } from '@/lib/auth'
import { saveUploadedImage, UploadError } from '@/lib/storage'
import { logAudit } from '@/lib/audit'

export type FormState = { error: string | null; ok?: boolean }

function generateTempPassword(): string {
  return randomBytes(9).toString('base64url')
}

/**
 * 运营方创建商家客户账号。MVP 阶段不开放商家自助注册(见 DEV-PLAN.md 假设清单),
 * 由运营方线下签约后在后台手动开户。
 */
export async function adminCreateClientAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const admin = await requireSession('admin')

  const businessName = String(formData.get('businessName') ?? '').trim()
  const contactEmail = String(formData.get('contactEmail') ?? '').trim().toLowerCase()

  if (!businessName || !contactEmail) {
    return { error: '请填写店名和联系邮箱' }
  }

  const existing = await prisma.client.findUnique({ where: { contactEmail } })
  if (existing) {
    return { error: '这个邮箱已经注册过商家账号了' }
  }

  const tempPassword = generateTempPassword()
  const client = await prisma.client.create({
    data: {
      businessName,
      contactEmail,
      passwordHash: await hashPassword(tempPassword),
      status: 'ACTIVE',
    },
  })

  await logAudit({
    actorType: 'admin',
    actorId: admin.sub,
    action: 'client.create',
    clientId: client.id,
    metadata: { businessName, contactEmail },
  })

  revalidatePath('/admin/clients')
  redirect(`/admin/clients/${client.id}?tempPassword=${encodeURIComponent(tempPassword)}`)
}

export async function adminUpdateClientLimitAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const admin = await requireSession('admin')
  const clientId = String(formData.get('clientId') ?? '')
  const creditLimitRaw = String(formData.get('creditLimit') ?? '').trim()
  const status = String(formData.get('status') ?? '')

  if (!clientId) return { error: '缺少客户 ID' }
  if (status !== 'ACTIVE' && status !== 'SUSPENDED') return { error: '状态参数不合法' }

  const creditLimit = creditLimitRaw === '' ? null : Number.parseInt(creditLimitRaw, 10)
  if (creditLimit !== null && (Number.isNaN(creditLimit) || creditLimit < 0)) {
    return { error: '额度必须是非负整数,留空表示不限' }
  }

  await prisma.client.update({
    where: { id: clientId },
    data: { creditLimit, status },
  })

  await logAudit({
    actorType: 'admin',
    actorId: admin.sub,
    action: 'client.update_limit',
    clientId,
    metadata: { creditLimit, status },
  })

  revalidatePath(`/admin/clients/${clientId}`)
  return { error: null, ok: true }
}

/**
 * 商家客户自己编辑档案(店名、品牌语气关键词、Logo)。
 * 对应 docs/20260927-详细设计.md M2。
 */
export async function clientUpdateProfileAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const session = await requireSession('client')

  const businessName = String(formData.get('businessName') ?? '').trim()
  const toneKeywordsRaw = String(formData.get('toneKeywords') ?? '').trim()
  const toneKeywords = toneKeywordsRaw
    ? toneKeywordsRaw.split(/[,,、\s]+/).filter(Boolean)
    : []

  if (!businessName) {
    return { error: '店名不能为空' }
  }

  let logoUrl: string | undefined
  const logoFile = formData.get('logo')
  if (logoFile instanceof File && logoFile.size > 0) {
    try {
      logoUrl = await saveUploadedImage(logoFile, `logo-${session.sub}`)
    } catch (err) {
      if (err instanceof UploadError) return { error: err.message }
      throw err
    }
  }

  await prisma.client.update({
    where: { id: session.sub },
    data: {
      businessName,
      toneKeywords,
      ...(logoUrl ? { logoUrl } : {}),
    },
  })

  await logAudit({
    actorType: 'client',
    actorId: session.sub,
    action: 'client.update_profile',
    clientId: session.sub,
    metadata: { businessName, toneKeywords, logoUpdated: Boolean(logoUrl) },
  })

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/settings')
  return { error: null, ok: true }
}
