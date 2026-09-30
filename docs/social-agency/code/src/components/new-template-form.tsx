'use client'

import { useActionState, useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  adminCreateTemplateAction,
  adminTestRenderTemplateAction,
  type FormState,
} from '@/lib/actions/template-actions'
import type { TemplateField, TemplateFieldType } from '@/lib/template-field-schema'

function emptyField(): TemplateField {
  return { paramId: '', label: '', type: 'text' }
}

const FIELD_TYPE_LABELS: Record<TemplateFieldType, string> = {
  text: '商家手填',
  image: '图片',
  ai_generated: 'AI 生成',
}

export function NewTemplateForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    adminCreateTemplateAction,
    { error: null }
  )
  const [orshotTemplateId, setOrshotTemplateId] = useState('')
  const [fields, setFields] = useState<TemplateField[]>([emptyField()])
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null)
  const [testPending, startTestTransition] = useTransition()

  function updateField(index: number, patch: Partial<TemplateField>) {
    setFields((prev) => prev.map((f, i) => (i === index ? { ...f, ...patch } : f)))
  }

  function addField() {
    setFields((prev) => [...prev, emptyField()])
  }

  function removeField(index: number) {
    setFields((prev) => prev.filter((_, i) => i !== index))
  }

  function handleTestRender() {
    setTestResult(null)
    startTestTransition(async () => {
      const result = await adminTestRenderTemplateAction({
        orshotTemplateId: Number.parseInt(orshotTemplateId, 10),
        fieldSchema: fields.filter((f) => f.paramId.trim() && f.label.trim()),
      })
      setTestResult(result)
    })
  }

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="orshotTemplateId">Orshot 模板 ID</Label>
          <Input
            id="orshotTemplateId"
            name="orshotTemplateId"
            type="number"
            min={1}
            required
            value={orshotTemplateId}
            onChange={(e) => setOrshotTemplateId(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="name">模板名称</Label>
          <Input id="name" name="name" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">行业分类</Label>
          <Input id="category" name="category" placeholder="烘焙 / 美容 / 地产 / 健身…" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="thumbnailUrl">缩略图地址</Label>
          <Input id="thumbnailUrl" name="thumbnailUrl" placeholder="https://…" required />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>字段配置(商家提交内容时要填 / 自动带入的字段)</Label>
          <Button type="button" variant="outline" size="sm" onClick={addField}>
            + 加一个字段
          </Button>
        </div>

        <div className="space-y-3">
          {fields.map((field, index) => (
            <div
              key={index}
              className="grid grid-cols-1 gap-2 rounded border p-3 sm:grid-cols-12 sm:items-end"
            >
              <div className="space-y-1 sm:col-span-3">
                <Label className="text-xs">paramId(须与 Orshot 模板参数名一致)</Label>
                <Input
                  value={field.paramId}
                  onChange={(e) => updateField(index, { paramId: e.target.value })}
                  placeholder="title"
                />
              </div>
              <div className="space-y-1 sm:col-span-3">
                <Label className="text-xs">显示名称</Label>
                <Input
                  value={field.label}
                  onChange={(e) => updateField(index, { label: e.target.value })}
                  placeholder="标题"
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs">类型</Label>
                <Select
                  value={field.type}
                  onValueChange={(value) => updateField(index, { type: value as TemplateFieldType })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {(value: TemplateFieldType) => FIELD_TYPE_LABELS[value]}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">商家手填</SelectItem>
                    <SelectItem value="image">图片</SelectItem>
                    <SelectItem value="ai_generated">AI 生成</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs">来源(可选,如 client.logoUrl)</Label>
                <Input
                  value={field.source ?? ''}
                  onChange={(e) => updateField(index, { source: e.target.value })}
                  placeholder="client.logoUrl"
                />
              </div>
              <div className="space-y-1 sm:col-span-1">
                <Label className="text-xs">最大长度</Label>
                <Input
                  type="number"
                  min={1}
                  value={field.maxLength ?? ''}
                  onChange={(e) =>
                    updateField(index, {
                      maxLength: e.target.value ? Number.parseInt(e.target.value, 10) : undefined,
                    })
                  }
                />
              </div>
              <div className="flex items-center sm:col-span-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={fields.length <= 1}
                  onClick={() => removeField(index)}
                >
                  删除
                </Button>
              </div>
            </div>
          ))}
        </div>

        <input type="hidden" name="fieldSchema" value={JSON.stringify(fields)} />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="outline" disabled={testPending} onClick={handleTestRender}>
          {testPending ? '渲染中…' : '测试渲染(用假数据验证字段配置)'}
        </Button>
        {testResult ? (
          <p className={testResult.ok ? 'text-sm text-muted-foreground' : 'text-sm text-destructive'}>
            {testResult.message}
          </p>
        ) : null}
      </div>

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

      <Button type="submit" disabled={pending}>
        {pending ? '创建中…' : '创建模板'}
      </Button>
    </form>
  )
}
