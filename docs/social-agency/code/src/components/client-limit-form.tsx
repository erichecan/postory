'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { adminUpdateClientLimitAction, type FormState } from '@/lib/actions/client-actions'

export function ClientLimitForm({
  clientId,
  currentLimit,
  currentStatus,
}: {
  clientId: string
  currentLimit: number | null
  currentStatus: 'ACTIVE' | 'SUSPENDED'
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    adminUpdateClientLimitAction,
    { error: null }
  )

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="clientId" value={clientId} />
      <div className="space-y-2">
        <Label htmlFor="creditLimit">月度出图额度(留空 = 不限)</Label>
        <Input
          id="creditLimit"
          name="creditLimit"
          type="number"
          min={0}
          defaultValue={currentLimit ?? ''}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="status">账号状态</Label>
        <Select name="status" defaultValue={currentStatus}>
          <SelectTrigger id="status" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ACTIVE">正常</SelectItem>
            <SelectItem value="SUSPENDED">暂停</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state.ok ? <p className="text-sm text-muted-foreground">已保存</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? '保存中…' : '保存'}
      </Button>
    </form>
  )
}
