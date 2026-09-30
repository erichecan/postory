import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const PAGE_SIZE = 20

export default async function AdminClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ cursor?: string }>
}) {
  const session = await getSession()
  if (!session || session.role !== 'admin') redirect('/admin/login')

  const { cursor } = await searchParams

  // cursor 分页,不做 offset 全表扫描——数据量大了也不会变慢。见 DEV-PLAN.md 风险点第 4 条。
  const clients = await prisma.client.findMany({
    take: PAGE_SIZE + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { createdAt: 'desc' },
  })

  const hasNextPage = clients.length > PAGE_SIZE
  const items = hasNextPage ? clients.slice(0, PAGE_SIZE) : clients
  const nextCursor = hasNextPage ? items[items.length - 1]?.id : null

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">商家客户</h1>
        <Link href="/admin/clients/new" className={buttonVariants()}>
          + 新建客户
        </Link>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>店名</TableHead>
            <TableHead>联系邮箱</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>月度额度</TableHead>
            <TableHead>创建时间</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                还没有客户,点右上角新建一个
              </TableCell>
            </TableRow>
          ) : (
            items.map((c) => (
              <TableRow key={c.id}>
                <TableCell>
                  <Link href={`/admin/clients/${c.id}`} className="underline">
                    {c.businessName}
                  </Link>
                </TableCell>
                <TableCell>{c.contactEmail}</TableCell>
                <TableCell>
                  <Badge variant={c.status === 'ACTIVE' ? 'default' : 'secondary'}>
                    {c.status === 'ACTIVE' ? '正常' : '已暂停'}
                  </Badge>
                </TableCell>
                <TableCell>{c.creditLimit ?? '不限'}</TableCell>
                <TableCell>{c.createdAt.toLocaleDateString('zh-CN')}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {nextCursor ? (
        <div className="flex justify-end">
          <Link
            href={`/admin/clients?cursor=${nextCursor}`}
            className={buttonVariants({ variant: 'outline' })}
          >
            下一页
          </Link>
        </div>
      ) : null}
    </main>
  )
}
