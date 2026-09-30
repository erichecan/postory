import { LoginForm } from '@/components/login-form'
import { adminLoginAction } from '@/lib/actions/auth-actions'

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <LoginForm action={adminLoginAction} title="运营方后台登录" description="social-agency Admin" />
    </main>
  )
}
