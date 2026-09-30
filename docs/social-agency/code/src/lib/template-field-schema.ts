export type TemplateFieldType = 'text' | 'image' | 'ai_generated'

export type TemplateField = {
  paramId: string
  label: string
  type: TemplateFieldType
  maxLength?: number
  required?: boolean
  source?: string
}

export class TemplateFieldSchemaError extends Error {}

/**
 * 校验并解析运营方在后台录入的 fieldSchema JSON(见 docs/20260927-详细设计.md M4)。
 * paramId 必须和 Orshot 模板里的参数名完全一致——这里只能做结构校验,
 * 录错字母大小写这种问题要靠"测试渲染"按钮(adminTestRenderTemplateAction)兜底。
 */
export function parseFieldSchema(raw: string): TemplateField[] {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new TemplateFieldSchemaError('字段配置不是合法的 JSON,请刷新页面重新填写')
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new TemplateFieldSchemaError('至少需要配置 1 个字段')
  }

  const seen = new Set<string>()

  return parsed.map((item, index) => {
    if (typeof item !== 'object' || item === null) {
      throw new TemplateFieldSchemaError(`第 ${index + 1} 个字段格式不对`)
    }
    const { paramId, label, type, maxLength, required, source } = item as Record<string, unknown>

    if (typeof paramId !== 'string' || !paramId.trim()) {
      throw new TemplateFieldSchemaError(`第 ${index + 1} 个字段缺少 paramId`)
    }
    const trimmedParamId = paramId.trim()
    if (seen.has(trimmedParamId)) {
      throw new TemplateFieldSchemaError(`paramId "${trimmedParamId}" 重复了,每个字段的 paramId 必须唯一`)
    }
    seen.add(trimmedParamId)

    if (typeof label !== 'string' || !label.trim()) {
      throw new TemplateFieldSchemaError(`字段 "${trimmedParamId}" 缺少显示名称`)
    }
    if (type !== 'text' && type !== 'image' && type !== 'ai_generated') {
      throw new TemplateFieldSchemaError(`字段 "${trimmedParamId}" 的类型不合法`)
    }

    const field: TemplateField = {
      paramId: trimmedParamId,
      label: label.trim(),
      type,
    }
    if (typeof maxLength === 'number' && maxLength > 0) field.maxLength = maxLength
    if (required === true) field.required = true
    if (typeof source === 'string' && source.trim()) field.source = source.trim()

    return field
  })
}

/** 给"测试渲染"拼一份假数据,验证 paramId 真的对应 Orshot 模板里存在的参数名。 */
export function buildDummyModifications(fields: TemplateField[]): Record<string, string> {
  const modifications: Record<string, string> = {}
  for (const field of fields) {
    if (field.type === 'image') {
      modifications[field.paramId] = 'https://placehold.co/600x400.png'
      continue
    }
    const sample = `测试${field.label}`
    modifications[field.paramId] = field.maxLength ? sample.slice(0, field.maxLength) : sample
  }
  return modifications
}
