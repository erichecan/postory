'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireSession } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { renderTemplate } from '@/lib/providers/orshot'
import { ProviderError } from '@/lib/providers/types'
import {
  parseFieldSchema,
  buildDummyModifications,
  TemplateFieldSchemaError,
  type TemplateField,
} from '@/lib/template-field-schema'

export type FormState = { error: string | null; ok?: boolean }

/**
 * 运营方录入一个新模板。对应 docs/20260927-详细设计.md M4 的 createTemplate。
 */
export async function adminCreateTemplateAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const admin = await requireSession('admin')

  const orshotTemplateIdRaw = String(formData.get('orshotTemplateId') ?? '').trim()
  const name = String(formData.get('name') ?? '').trim()
  const category = String(formData.get('category') ?? '').trim()
  const thumbnailUrl = String(formData.get('thumbnailUrl') ?? '').trim()
  const fieldSchemaRaw = String(formData.get('fieldSchema') ?? '')

  const orshotTemplateId = Number.parseInt(orshotTemplateIdRaw, 10)
  if (!orshotTemplateIdRaw || Number.isNaN(orshotTemplateId) || orshotTemplateId <= 0) {
    return { error: 'Orshot 模板 ID 必须是正整数' }
  }
  if (!name) return { error: '请填写模板名称' }
  if (!category) return { error: '请填写行业分类' }
  if (!thumbnailUrl) return { error: '请填写缩略图地址' }

  let fields: TemplateField[]
  try {
    fields = parseFieldSchema(fieldSchemaRaw)
  } catch (err) {
    if (err instanceof TemplateFieldSchemaError) return { error: err.message }
    throw err
  }

  const template = await prisma.template.create({
    data: {
      orshotTemplateId,
      name,
      category,
      thumbnailUrl,
      fieldSchema: fields as never,
    },
  })

  await logAudit({
    actorType: 'admin',
    actorId: admin.sub,
    action: 'template.create',
    metadata: { templateId: template.id, name, category, orshotTemplateId },
  })

  revalidatePath('/admin/templates')
  redirect('/admin/templates')
}

export async function adminToggleTemplateActiveAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const admin = await requireSession('admin')
  const templateId = String(formData.get('templateId') ?? '')
  const nextActive = String(formData.get('nextActive') ?? '') === 'true'

  if (!templateId) return { error: '缺少模板 ID' }

  await prisma.template.update({
    where: { id: templateId },
    data: { isActive: nextActive },
  })

  await logAudit({
    actorType: 'admin',
    actorId: admin.sub,
    action: nextActive ? 'template.activate' : 'template.deactivate',
    metadata: { templateId },
  })

  revalidatePath('/admin/templates')
  return { error: null, ok: true }
}

export type TestRenderResult = { ok: boolean; message: string }

/**
 * 录入模板时的"测试渲染"按钮:用假数据调一次 Orshot render,确认 fieldSchema 里的
 * paramId 真的对应模板里存在的参数名,避免录错字段名导致商家提交后才报错
 * (见详细设计 M4 异常处理)。直接从客户端组件当函数调用,不走 <form action>。
 */
export async function adminTestRenderTemplateAction(input: {
  orshotTemplateId: number
  fieldSchema: TemplateField[]
}): Promise<TestRenderResult> {
  await requireSession('admin')

  if (!Number.isFinite(input.orshotTemplateId) || input.orshotTemplateId <= 0) {
    return { ok: false, message: '请先填写有效的 Orshot 模板 ID' }
  }
  if (input.fieldSchema.length === 0) {
    return { ok: false, message: '请先至少填好 1 个字段(paramId 和显示名称都不能为空)' }
  }

  try {
    const result = await renderTemplate({
      templateId: input.orshotTemplateId,
      modifications: buildDummyModifications(input.fieldSchema),
    })
    return { ok: true, message: `渲染成功:${result.assetUrl}` }
  } catch (err) {
    if (err instanceof ProviderError) return { ok: false, message: err.message }
    throw err
  }
}
