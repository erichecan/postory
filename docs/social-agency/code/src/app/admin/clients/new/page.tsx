import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { NewClientForm } from '@/components/new-client-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function NewClientPage() {
  const session = await getSession()
  if (!session || session.role !== 'admin') redirect('/admin/login')

  return (
    <main className="mx-auto w-full max-w-md space-y-6 p-8">
      <Card>
        <CardHeader>
          <CardTitle>新建商家客户</CardTitle>
        </CardHeader>
        <CardContent>
          <NewClientForm />
        </CardContent>
      </Card>
    </main>
  )
}
