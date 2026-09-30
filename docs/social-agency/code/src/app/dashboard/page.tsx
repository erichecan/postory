import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logoutAction } from '@/lib/actions/auth-actions'
import Link from 'next/link'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default async function DashboardPage() {
  const session = await getSession()
  if (!session || session.role !== 'client') {
    redirect('/login')
  }

  const client = await prisma.client.findUniqueOrThrow({
    where: { id: session.sub },
    include: { channels: true },
  })

  const recentSubmissions = await prisma.submission.findMany({
    where: { clientId: client.id },
    orderBy: { createdAt: 'desc' },
    take: 5,
  })

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{client.businessName}</h1>
          <p className="text-sm text-muted-foreground">{client.contactEmail}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/templates" className={buttonVariants({ variant: 'outline' })}>
            浏览模板
          </Link>
          <Link href="/dashboard/settings" className={buttonVariants({ variant: 'outline' })}>
            店铺资料
          </Link>
          <form action={logoutAction}>
            <Button variant="outline" type="submit">
              退出登录
            </Button>
          </form>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>已连接的社交渠道</CardTitle>
        </CardHeader>
        <CardContent>
          {client.channels.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              还没有连接任何社交账号,去{' '}
              <a href="/dashboard/connect" className="underline">
                连接渠道
              </a>{' '}
              开始使用。
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {client.channels.map((c) => (
                <Badge key={c.id} variant={c.connected ? 'default' : 'secondary'}>
                  {c.platform} {c.connected ? '已连接' : '未连接'}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>最近的内容</CardTitle>
        </CardHeader>
        <CardContent>
          {recentSubmissions.length === 0 ? (
            <p className="text-sm text-muted-foreground">还没有提交过内容。</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {recentSubmissions.map((s) => (
                <li key={s.id} className="flex items-center justify-between border-b pb-2">
                  <span>{s.briefText.slice(0, 40)}</span>
                  <Badge variant="outline">{s.status}</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
