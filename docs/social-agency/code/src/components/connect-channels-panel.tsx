'use client'

import { useActionState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  requestConnectLinkAction,
  syncChannelStatusAction,
  type ChannelActionState,
} from '@/lib/actions/channel-actions'

const PLATFORM_LABELS: Record<string, string> = {
  INSTAGRAM: 'Instagram',
  FACEBOOK: 'Facebook',
  LINKEDIN: 'LinkedIn',
  TIKTOK: 'TikTok',
  YOUTUBE: 'YouTube',
  PINTEREST: 'Pinterest',
  X: 'X (Twitter)',
  GOOGLE_BUSINESS: 'Google Business',
}

type ChannelRow = {
  platform: string
  connected: boolean
  needsReconnect: boolean
  accountHandle: string | null
}

const initialState: ChannelActionState = { error: null }

export function ConnectChannelsPanel({
  platforms,
  channels,
}: {
  platforms: string[]
  channels: ChannelRow[]
}) {
  const [connectState, connectFormAction, connectPending] = useActionState(
    requestConnectLinkAction,
    initialState
  )
  const [syncState, syncFormAction, syncPending] = useActionState(syncChannelStatusAction, initialState)

  useEffect(() => {
    if (connectState.connectUrl) {
      window.open(connectState.connectUrl, '_blank', 'noopener,noreferrer')
    }
  }, [connectState.connectUrl])

  const byPlatform = new Map(channels.map((c) => [c.platform, c]))

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <form action={connectFormAction}>
          <Button type="submit" disabled={connectPending}>
            {connectPending ? '生成连接链接…' : '连接社交账号'}
          </Button>
        </form>
        <form action={syncFormAction}>
          <Button type="submit" variant="outline" disabled={syncPending}>
            {syncPending ? '同步中…' : '同步连接状态'}
          </Button>
        </form>
      </div>

      {connectState.error ? <p className="text-sm text-destructive">{connectState.error}</p> : null}
      {syncState.error ? <p className="text-sm text-destructive">{syncState.error}</p> : null}

      {connectState.connectUrl ? (
        <p className="text-sm text-muted-foreground">
          如果没有自动打开新窗口,
          <a
            href={connectState.connectUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            点这里去连接
          </a>
          ,完成后回来点&ldquo;同步连接状态&rdquo;。
        </p>
      ) : null}

      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {platforms.map((platform) => {
          const row = byPlatform.get(platform)
          const status = row?.needsReconnect
            ? { label: '需要重新连接', variant: 'destructive' as const }
            : row?.connected
              ? { label: '已连接', variant: 'default' as const }
              : { label: '未连接', variant: 'secondary' as const }

          return (
            <li key={platform} className="flex items-center justify-between rounded border p-3">
              <div>
                <p className="font-medium">{PLATFORM_LABELS[platform] ?? platform}</p>
                {row?.accountHandle ? (
                  <p className="text-xs text-muted-foreground">{row.accountHandle}</p>
                ) : null}
              </div>
              <Badge variant={status.variant}>{status.label}</Badge>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
