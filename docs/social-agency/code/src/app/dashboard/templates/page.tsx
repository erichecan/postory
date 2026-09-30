import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * 100% 复刻 orshot.com/templates/g/instagram 的列表页(见 2026-09-27 台账第六/七周期日志)。
 * 所有数值(字号/字重/字距/圆角/间距)取自实际打开参考站用 getComputedStyle 读出来的真实值,
 * 不是目测截图猜的——猜的那版被用户否决过一次。
 */
export default async function DashboardTemplatesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const session = await getSession()
  if (!session || session.role !== 'client') redirect('/login')

  const { category } = await searchParams

  const allTemplates = await prisma.template.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
  })

  const categories = Array.from(new Set(allTemplates.map((t) => t.category))).sort()
  const templates = category ? allTemplates.filter((t) => t.category === category) : allTemplates

  return (
    <main className="mx-auto w-full max-w-[1080px] px-4 pt-10 pb-14">
      <div className="mx-auto max-w-2xl space-y-3 text-center">
        <h1 className="text-[60px] leading-[1.02] font-semibold tracking-[-0.034em]">选一个模板</h1>
        <p className="text-lg text-neutral-500">这些是我们为你筛选好的模板,选好之后可以直接填自己的信息。</p>
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/dashboard" className={buttonVariants({ className: 'h-11 rounded-lg px-8 text-sm font-medium' })}>
          返回首页
        </Link>
        <Link
          href="/dashboard/connect"
          className={buttonVariants({
            variant: 'outline',
            className: 'h-11 rounded-lg border-neutral-200 px-8 text-sm font-medium',
          })}
        >
          先去连接社交账号
        </Link>
      </div>

      {categories.length > 0 ? (
        <div className="mt-10 flex flex-wrap justify-center gap-2">
          <Link
            href="/dashboard/templates"
            className={cn(
              'rounded-lg border px-3.5 py-1 text-sm transition-colors',
              !category ? 'border-neutral-200 bg-neutral-100' : 'border-neutral-200 bg-white hover:bg-neutral-50'
            )}
          >
            全部
          </Link>
          {categories.map((c) => (
            <Link
              key={c}
              href={`/dashboard/templates?category=${encodeURIComponent(c)}`}
              className={cn(
                'rounded-lg border px-3.5 py-1 text-sm transition-colors',
                category === c
                  ? 'border-neutral-200 bg-neutral-100'
                  : 'border-neutral-200 bg-white hover:bg-neutral-50'
              )}
            >
              {c}
            </Link>
          ))}
        </div>
      ) : null}

      {templates.length === 0 ? (
        <p className="mt-16 text-center text-sm text-neutral-500">
          这个分类下还没有模板,换一个看看,或联系我们上新。
        </p>
      ) : (
        <div className="mt-10 columns-2 gap-6 sm:columns-3 lg:columns-4">
          {templates.map((t) => (
            <Link
              key={t.id}
              href={`/dashboard/templates/${t.id}`}
              className="group relative mb-6 flex min-w-0 flex-col break-inside-avoid"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- 缩略图地址是运营方填的任意外部 URL */}
              <img src={t.thumbnailUrl} alt={t.name} className="w-full rounded-[4px]" />
              <p className="mt-2 text-sm font-medium text-neutral-900 group-hover:underline">{t.name}</p>
              <p className="text-xs text-neutral-500">{t.category}</p>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}
