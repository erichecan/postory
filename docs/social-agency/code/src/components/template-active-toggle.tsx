'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { adminToggleTemplateActiveAction, type FormState } from '@/lib/actions/template-actions'

export function TemplateActiveToggle({
  templateId,
  isActive,
}: {
  templateId: string
  isActive: boolean
}) {
  const [, formAction, pending] = useActionState<FormState, FormData>(
    adminToggleTemplateActiveAction,
    { error: null }
  )

  return (
    <form action={formAction}>
      <input type="hidden" name="templateId" value={templateId} />
      <input type="hidden" name="nextActive" value={(!isActive).toString()} />
      <Button type="submit" variant="outline" size="sm" disabled={pending}>
        {pending ? '处理中…' : isActive ? '停用' : '启用'}
      </Button>
    </form>
  )
}
