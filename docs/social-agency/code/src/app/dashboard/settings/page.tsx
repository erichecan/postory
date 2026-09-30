import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ClientSettingsForm } from '@/components/client-settings-form'

export default async function DashboardSettingsPage() {
  const session = await getSession()
  if (!session || session.role !== 'client') redirect('/login')

  const client = await prisma.client.findUniqueOrThrow({ where: { id: session.sub } })

  return (
    <main className="mx-auto w-full max-w-md space-y-6 p-8">
      <h1 className="text-2xl font-semibold">店铺资料</h1>
      <Card>
        <CardHeader>
          <CardTitle>基本信息</CardTitle>
        </CardHeader>
        <CardContent>
          <ClientSettingsForm
            businessName={client.businessName}
            toneKeywords={client.toneKeywords}
            logoUrl={client.logoUrl}
          />
        </CardContent>
      </Card>
    </main>
  )
}
