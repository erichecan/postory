'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { TemplateField } from '@/lib/template-field-schema'

type TemplateEditorMockProps = {
  template: {
    id: string
    name: string
    thumbnailUrl: string
    fieldSchema: TemplateField[]
  }
  clientLogoUrl: string | null
  header: ReactNode
}

const DEBOUNCE_MS = 1500

/**
 * 100% 复刻 orshot.com/templates/2439 详情页的两栏布局(见台账第六/七周期日志)。
 * `header`(标题/描述/功能点)由页面传入,渲染在左栏最上方,让左栏文字起始高度
 * 跟右栏大图对齐,这样两栏才是真的按参考站对齐,不是各自独立排版。
 *
 * 预览是纯前端的示意效果(缩略图 + 文字叠加),不调用真实 Orshot render——
 * 目的只是让用户确认"逐字段填 + 停顿后预览跟着变"这个交互节奏对不对,
 * 真正接入 Orshot 真实渲染在 T7b。"确认使用"按钮先禁用,提交功能也在 T7b 接。
 */
export function TemplateEditorMock({ template, clientLogoUrl, header }: TemplateEditorMockProps) {
  const textFields = template.fieldSchema.filter((f) => f.type === 'text')
  const imageFields = template.fieldSchema.filter((f) => f.type === 'image')
  const aiFields = template.fieldSchema.filter((f) => f.type === 'ai_generated')
  const primaryImageField = imageFields[0]

  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}
    for (const f of textFields) initial[f.paramId] = ''
    for (const f of imageFields) {
      initial[f.paramId] = f.source === 'client.logoUrl' ? (clientLogoUrl ?? '') : ''
    }
    return initial
  })
  const [previewValues, setPreviewValues] = useState(values)
  const rendering = JSON.stringify(values) !== JSON.stringify(previewValues)

  useEffect(() => {
    const timer = setTimeout(() => setPreviewValues(values), DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [values])

  function updateValue(paramId: string, value: string) {
    setValues((prev) => ({ ...prev, [paramId]: value }))
  }

  return (
    <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-start">
      <div className="space-y-6">
        {header}

        <div className="space-y-4">
          {imageFields.map((f) => (
            <div key={f.paramId} className="space-y-2">
              <Label>{f.label}</Label>
              {values[f.paramId] ? (
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element -- 客户 Logo,本地上传路径,不需要 next/image 优化 */}
                  <img src={values[f.paramId]} alt={f.label} className="size-12 rounded border object-contain" />
                  <p className="text-xs text-neutral-500">
                    {f.source === 'client.logoUrl' ? '已自动带入你店铺资料里的 Logo,无需重新上传' : ''}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-neutral-500">还没有 Logo,去店铺资料页上传一个</p>
              )}
            </div>
          ))}

          {textFields.map((f) => (
            <div key={f.paramId} className="space-y-2">
              <Label htmlFor={f.paramId}>
                {f.label}
                {f.required ? <span className="text-destructive"> *</span> : null}
              </Label>
              <Input
                id={f.paramId}
                value={values[f.paramId]}
                maxLength={f.maxLength}
                onChange={(e) => updateValue(f.paramId, e.target.value)}
                placeholder={`填${f.label}…`}
              />
              {f.maxLength ? (
                <p className="text-xs text-neutral-500">
                  {values[f.paramId].length}/{f.maxLength}
                </p>
              ) : null}
            </div>
          ))}

          {aiFields.length > 0 ? (
            <div className="space-y-2 rounded border border-dashed p-3">
              <Label>AI 自动生成的内容</Label>
              <p className="text-xs text-neutral-500">
                {aiFields.map((f) => f.label).join('、')} 不需要你填,确认使用后系统会自动生成。
              </p>
            </div>
          ) : null}

          <Button className="h-11 w-full rounded-lg px-8 text-sm font-medium" disabled>
            确认使用(界面原型,提交功能下一步接入)
          </Button>
        </div>
      </div>

      <div className="lg:sticky lg:top-10">
        <div className="relative overflow-hidden rounded-xl">
          {/* eslint-disable-next-line @next/next/no-img-element -- 缩略图地址是运营方填的任意外部 URL */}
          <img src={template.thumbnailUrl} alt={template.name} className="h-auto w-full" />
          <div className="absolute top-4 left-4 rounded-2xl bg-white p-3 text-base font-medium shadow-sm">
            {rendering ? '刷新中…' : '预览示意'}
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/35 p-6 text-center text-white">
            {primaryImageField && previewValues[primaryImageField.paramId] ? (
              // eslint-disable-next-line @next/next/no-img-element -- 预览叠加层,来源是客户 Logo(本地上传路径)
              <img
                src={previewValues[primaryImageField.paramId]}
                alt={primaryImageField.label}
                className="mb-2 size-12 rounded-full border-2 border-white object-cover"
              />
            ) : null}
            {textFields.map((f, i) => (
              <p key={f.paramId} className={i === 0 ? 'text-2xl font-bold' : 'text-sm'}>
                {previewValues[f.paramId] || `(${f.label})`}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
