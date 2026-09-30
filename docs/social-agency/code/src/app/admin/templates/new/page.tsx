import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { NewTemplateForm } from '@/components/new-template-form'

export default async function NewTemplatePage() {
  const session = await getSession()
  if (!session || session.role !== 'admin') redirect('/admin/login')

  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">新建模板</h1>
        <Link href="/admin/templates" className={buttonVariants({ variant: 'outline' })}>
          返回模板库
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>模板信息</CardTitle>
        </CardHeader>
        <CardContent>
          <NewTemplateForm />
        </CardContent>
      </Card>
    </main>
  )
}
