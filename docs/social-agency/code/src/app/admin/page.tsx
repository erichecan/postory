import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logoutAction } from '@/lib/actions/auth-actions'
import Link from 'next/link'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function AdminHomePage() {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    redirect('/admin/login')
  }

  const [clientCount, activeClientCount, templateCount, pendingSubmissions] = await Promise.all([
    prisma.client.count(),
    prisma.client.count({ where: { status: 'ACTIVE' } }),
    prisma.template.count({ where: { isActive: true } }),
    prisma.submission.count({
      where: { status: { in: ['GENERATING_CAPTION', 'GENERATING_ASSET', 'PENDING_REVIEW'] } },
    }),
  ])

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">运营方总览</h1>
          <p className="text-sm text-muted-foreground">{session.email}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/clients" className={buttonVariants({ variant: 'outline' })}>
            客户列表
          </Link>
          <Link href="/admin/templates" className={buttonVariants({ variant: 'outline' })}>
            模板库
          </Link>
          <form action={logoutAction}>
            <Button variant="outline" type="submit">
              退出登录
            </Button>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">客户总数</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{clientCount}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">活跃客户</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{activeClientCount}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">上架模板</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{templateCount}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">处理中任务</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{pendingSubmissions}</CardContent>
        </Card>
      </div>
    </main>
  )
}
