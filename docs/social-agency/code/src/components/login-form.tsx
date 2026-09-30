'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { LoginActionState } from '@/lib/actions/auth-actions'

export function LoginForm({
  action,
  title,
  description,
}: {
  action: (state: LoginActionState, formData: FormData) => Promise<LoginActionState>
  title: string
  description: string
}) {
  const [state, formAction, pending] = useActionState<LoginActionState, FormData>(action, {
    error: null,
  })

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <form action={formAction} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">邮箱</Label>
          <Input id="email" name="email" type="email" required autoComplete="email" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">密码</Label>
          <Input id="password" name="password" type="password" required autoComplete="current-password" />
        </div>
        {state.error ? (
          <p className="text-sm text-destructive" data-testid="login-error">
            {state.error}
          </p>
        ) : null}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? '登录中…' : '登录'}
        </Button>
      </form>
    </div>
  )
}
