import { describe, it, expect } from 'vitest'
import { parseFieldSchema, buildDummyModifications, TemplateFieldSchemaError } from '../template-field-schema'

describe('template-field-schema', () => {
  it('解析合法的字段配置', () => {
    const fields = parseFieldSchema(
      JSON.stringify([
        { paramId: 'title', label: '标题', type: 'text', maxLength: 40, required: true },
        { paramId: 'logo', label: 'Logo', type: 'image', source: 'client.logoUrl' },
        { paramId: 'subtitle', label: '副标题', type: 'ai_generated' },
      ])
    )
    expect(fields).toEqual([
      { paramId: 'title', label: '标题', type: 'text', maxLength: 40, required: true },
      { paramId: 'logo', label: 'Logo', type: 'image', source: 'client.logoUrl' },
      { paramId: 'subtitle', label: '副标题', type: 'ai_generated' },
    ])
  })

  it('不是合法 JSON 时报错', () => {
    expect(() => parseFieldSchema('not json')).toThrow(TemplateFieldSchemaError)
  })

  it('空数组时报错(至少需要 1 个字段)', () => {
    expect(() => parseFieldSchema('[]')).toThrow('至少需要配置 1 个字段')
  })

  it('paramId 重复时报错', () => {
    expect(() =>
      parseFieldSchema(
        JSON.stringify([
          { paramId: 'title', label: '标题', type: 'text' },
          { paramId: 'title', label: '标题2', type: 'text' },
        ])
      )
    ).toThrow('重复')
  })

  it('缺少 label 时报错', () => {
    expect(() => parseFieldSchema(JSON.stringify([{ paramId: 'title', type: 'text' }]))).toThrow(
      '缺少显示名称'
    )
  })

  it('type 不合法时报错', () => {
    expect(() =>
      parseFieldSchema(JSON.stringify([{ paramId: 'title', label: '标题', type: 'video' }]))
    ).toThrow('类型不合法')
  })

  it('buildDummyModifications 给 image 字段填占位图,text 字段按 maxLength 截断', () => {
    const modifications = buildDummyModifications([
      { paramId: 'logo', label: 'Logo', type: 'image' },
      { paramId: 'title', label: '一个很长的标题字段', type: 'text', maxLength: 4 },
    ])
    expect(modifications.logo).toBe('https://placehold.co/600x400.png')
    expect(modifications.title.length).toBeLessThanOrEqual(4)
  })
})
