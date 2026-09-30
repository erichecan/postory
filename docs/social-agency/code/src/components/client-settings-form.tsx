'use client'

import { useActionState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { clientUpdateProfileAction, type FormState } from '@/lib/actions/client-actions'

export function ClientSettingsForm({
  businessName,
  toneKeywords,
  logoUrl,
}: {
  businessName: string
  toneKeywords: string[]
  logoUrl: string | null
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    clientUpdateProfileAction,
    { error: null }
  )

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="businessName">店名</Label>
        <Input id="businessName" name="businessName" defaultValue={businessName} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="toneKeywords">品牌语气关键词(用逗号分隔,比如:温暖,手工,家庭感)</Label>
        <Input id="toneKeywords" name="toneKeywords" defaultValue={toneKeywords.join(', ')} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="logo">Logo</Label>
        {logoUrl ? (
          <Image
            src={logoUrl}
            alt="当前 Logo"
            width={64}
            height={64}
            className="rounded border object-contain"
          />
        ) : (
          <p className="text-sm text-muted-foreground">还没有上传 Logo</p>
        )}
        <Input id="logo" name="logo" type="file" accept="image/png,image/jpeg,image/webp" />
      </div>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state.ok ? <p className="text-sm text-muted-foreground">已保存</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? '保存中…' : '保存'}
      </Button>
    </form>
  )
}
