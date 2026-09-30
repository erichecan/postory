import { LoginForm } from '@/components/login-form'
import { clientLoginAction } from '@/lib/actions/auth-actions'

export default function ClientLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <LoginForm action={clientLoginAction} title="商家客户登录" description="social-agency" />
    </main>
  )
}
