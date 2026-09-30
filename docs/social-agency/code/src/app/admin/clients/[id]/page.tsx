import { notFound, redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ClientLimitForm } from '@/components/client-limit-form'

export default async function AdminClientDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tempPassword?: string }>
}) {
  const session = await getSession()
  if (!session || session.role !== 'admin') redirect('/admin/login')

  const { id } = await params
  const { tempPassword } = await searchParams

  const client = await prisma.client.findUnique({
    where: { id },
    include: { channels: true },
  })
  if (!client) notFound()

  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)

  const monthlyUsed = await prisma.submission.aggregate({
    where: { clientId: client.id, createdAt: { gte: monthStart } },
    _sum: { orshotCreditsUsed: true },
  })

  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold">{client.businessName}</h1>
        <p className="text-sm text-muted-foreground">{client.contactEmail}</p>
      </div>

      {tempPassword ? (
        <Card className="border-amber-500/50">
          <CardHeader>
            <CardTitle className="text-amber-600">初始密码(只显示这一次)</CardTitle>
          </CardHeader>
          <CardContent>
            <code className="rounded bg-muted px-2 py-1 text-sm">{tempPassword}</code>
            <p className="mt-2 text-sm text-muted-foreground">
              请把这个密码通过线下渠道告知客户,刷新页面后不会再显示。
            </p>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>本月用量</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold">
            {monthlyUsed._sum.orshotCreditsUsed ?? 0}
            {client.creditLimit != null ? ` / ${client.creditLimit}` : ''}
            <span className="ml-2 text-sm font-normal text-muted-foreground">credit</span>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>额度与状态</CardTitle>
        </CardHeader>
        <CardContent>
          <ClientLimitForm
            clientId={client.id}
            currentLimit={client.creditLimit}
            currentStatus={client.status}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>已连接渠道</CardTitle>
        </CardHeader>
        <CardContent>
          {client.channels.length === 0 ? (
            <p className="text-sm text-muted-foreground">还没有连接任何渠道</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {client.channels.map((c) => (
                <Badge key={c.id} variant={c.connected ? 'default' : 'secondary'}>
                  {c.platform}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
