import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ImageIcon, Sparkles, Send } from 'lucide-react'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { TemplateEditorMock } from '@/components/template-editor-mock'
import type { TemplateField } from '@/lib/template-field-schema'

const FEATURES = [
  { icon: ImageIcon, text: 'Logo 自动带入你的店铺资料,不用重新上传' },
  { icon: Sparkles, text: '文字随你填写实时更新预览,所见即所得' },
  { icon: Send, text: '确认使用后,我们直接帮你发到已连接的社交账号' },
]

/**
 * 100% 复刻 orshot.com/templates/2439 详情页(见台账第六/七周期日志)。
 * 断点/字号/圆角等数值取自实际打开该页面用 getComputedStyle 读出来的真实值。
 * 唯一的功能性偏离:Orshot 的 CTA 按钮在描述文字下方就能点(点了直接进编辑器),
 * 我们的"确认使用"必须等字段填完才有意义,所以按钮放在表单底部而不是复刻它的位置——
 * 这是功能上必须如此,不是随意改视觉。
 */
export default async function TemplateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getSession()
  if (!session || session.role !== 'client') redirect('/login')

  const { id } = await params

  const [template, client] = await Promise.all([
    prisma.template.findUnique({ where: { id } }),
    prisma.client.findUniqueOrThrow({ where: { id: session.sub } }),
  ])

  if (!template || !template.isActive) notFound()

  const header = (
    <div className="space-y-6">
      <div>
        <h1 className="text-[44px] leading-[1.02] font-semibold tracking-[-0.034em]">{template.name}</h1>
        <p className="mt-4 text-lg leading-[1.6] text-neutral-500">
          {template.category} 模板 · 按下面的字段填好你自己的信息,右侧预览会跟着更新。
        </p>
      </div>
      <ul className="space-y-2.5">
        {FEATURES.map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-center gap-2.5 text-[14.5px] text-neutral-700">
            <Icon className="size-[18px] shrink-0 text-neutral-900" />
            {text}
          </li>
        ))}
      </ul>
    </div>
  )

  return (
    <main className="mx-auto w-full max-w-[1080px] px-4 pt-10 pb-14">
      <Link
        href="/dashboard/templates"
        className="inline-flex items-center gap-1 text-[12.5px] font-medium tracking-[0.14em] text-neutral-500 uppercase hover:text-neutral-800"
      >
        <ArrowLeft className="size-3" />
        所有模板
      </Link>

      <div className="mt-6">
        <TemplateEditorMock
          header={header}
          template={{
            id: template.id,
            name: template.name,
            thumbnailUrl: template.thumbnailUrl,
            fieldSchema: template.fieldSchema as unknown as TemplateField[],
          }}
          clientLogoUrl={client.logoUrl}
        />
      </div>
    </main>
  )
}
