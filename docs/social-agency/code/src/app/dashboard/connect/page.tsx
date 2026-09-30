import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { ConnectChannelsPanel } from '@/components/connect-channels-panel'
import { SUPPORTED_PLATFORMS } from '@/lib/providers/types'

export default async function ConnectPage() {
  const session = await getSession()
  if (!session || session.role !== 'client') {
    redirect('/login')
  }

  const channels = await prisma.connectedChannel.findMany({
    where: { clientId: session.sub },
  })

  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">连接社交账号</h1>
          <p className="text-sm text-muted-foreground">
            点击&ldquo;连接社交账号&rdquo;会打开 Ayrshare 的授权页,一次可以连接下面所有支持的平台。授权完成后回来点&ldquo;同步连接状态&rdquo;刷新结果。
          </p>
        </div>
        <Link href="/dashboard" className={buttonVariants({ variant: 'outline' })}>
          返回首页
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>渠道状态</CardTitle>
        </CardHeader>
        <CardContent>
          <ConnectChannelsPanel
            platforms={SUPPORTED_PLATFORMS}
            channels={channels.map((c) => ({
              platform: c.platform,
              connected: c.connected,
              needsReconnect: c.needsReconnect,
              accountHandle: c.accountHandle,
            }))}
          />
        </CardContent>
      </Card>
    </main>
  )
}
