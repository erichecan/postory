'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { adminCreateClientAction, type FormState } from '@/lib/actions/client-actions'

export function NewClientForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    adminCreateClientAction,
    { error: null }
  )

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="businessName">店名</Label>
        <Input id="businessName" name="businessName" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contactEmail">联系邮箱(客户用来登录)</Label>
        <Input id="contactEmail" name="contactEmail" type="email" required />
      </div>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? '创建中…' : '创建客户'}
      </Button>
    </form>
  )
}
