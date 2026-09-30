import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { TemplateActiveToggle } from '@/components/template-active-toggle'

const PAGE_SIZE = 20

export default async function AdminTemplatesPage({
  searchParams,
}: {
  searchParams: Promise<{ cursor?: string }>
}) {
  const session = await getSession()
  if (!session || session.role !== 'admin') redirect('/admin/login')

  const { cursor } = await searchParams

  // cursor 分页,不做 offset 全表扫描——见 DEV-PLAN.md 风险点第 4 条。
  const templates = await prisma.template.findMany({
    take: PAGE_SIZE + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { createdAt: 'desc' },
  })

  const hasNextPage = templates.length > PAGE_SIZE
  const items = hasNextPage ? templates.slice(0, PAGE_SIZE) : templates
  const nextCursor = hasNextPage ? items[items.length - 1]?.id : null

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">模板库</h1>
        <Link href="/admin/templates/new" className={buttonVariants()}>
          + 新建模板
        </Link>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>缩略图</TableHead>
            <TableHead>名称</TableHead>
            <TableHead>分类</TableHead>
            <TableHead>Orshot ID</TableHead>
            <TableHead>字段数</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground">
                还没有模板,点右上角新建一个
              </TableCell>
            </TableRow>
          ) : (
            items.map((t) => {
              const fieldCount = Array.isArray(t.fieldSchema) ? t.fieldSchema.length : 0
              return (
                <TableRow key={t.id}>
                  <TableCell>
                    {/* eslint-disable-next-line @next/next/no-img-element -- 缩略图地址是运营方自己填的任意外部 URL,不配置 next/image 的域名白名单 */}
                    <img
                      src={t.thumbnailUrl}
                      alt={t.name}
                      width={48}
                      height={48}
                      className="size-12 rounded border object-cover"
                    />
                  </TableCell>
                  <TableCell>{t.name}</TableCell>
                  <TableCell>{t.category}</TableCell>
                  <TableCell>{t.orshotTemplateId}</TableCell>
                  <TableCell>{fieldCount}</TableCell>
                  <TableCell>
                    <Badge variant={t.isActive ? 'default' : 'secondary'}>
                      {t.isActive ? '启用中' : '已停用'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <TemplateActiveToggle templateId={t.id} isActive={t.isActive} />
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>

      {nextCursor ? (
        <div className="flex justify-end">
          <Link
            href={`/admin/templates?cursor=${nextCursor}`}
            className={buttonVariants({ variant: 'outline' })}
          >
            下一页
          </Link>
        </div>
      ) : null}
    </main>
  )
}
