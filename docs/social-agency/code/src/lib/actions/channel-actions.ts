'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireSession } from '@/lib/auth'
import { encryptSecret, decryptSecret } from '@/lib/crypto'
import { logAudit } from '@/lib/audit'
import { SUPPORTED_PLATFORMS, ProviderError } from '@/lib/providers/types'
import { createProfile, createConnectLink, getConnectedAccounts } from '@/lib/providers/ayrshare'

export type ChannelActionState = { error: string | null; connectUrl?: string }

/**
 * 对应 docs/20260927-详细设计.md M3 的 ensureAyrshareProfile。
 * 一个商家客户只建一个 Ayrshare Profile,覆盖 TA 之后连接的所有平台。
 */
async function ensureAyrshareProfile(clientId: string): Promise<string> {
  const client = await prisma.client.findUniqueOrThrow({ where: { id: clientId } })
  if (client.ayrshareProfileKeyEncrypted) {
    return decryptSecret(client.ayrshareProfileKeyEncrypted)
  }

  const result = await createProfile(client.businessName)
  await prisma.client.update({
    where: { id: clientId },
    data: {
      ayrshareProfileKeyEncrypted: encryptSecret(result.profileKey),
      ayrshareRefId: result.refId,
    },
  })
  return result.profileKey
}

/**
 * 商家点"连接社交账号",生成 Ayrshare 托管的授权链接(grid mode,一个链接连所有平台,
 * 见 lib/providers/ayrshare.ts 里 createConnectLink 的注释)。
 */
export async function requestConnectLinkAction(
  _prevState: ChannelActionState,
  _formData: FormData
): Promise<ChannelActionState> {
  const session = await requireSession('client')

  try {
    const profileKey = await ensureAyrshareProfile(session.sub)
    const link = await createConnectLink(profileKey)

    await logAudit({
      actorType: 'client',
      actorId: session.sub,
      action: 'channel.connect_link_requested',
      clientId: session.sub,
    })

    return { error: null, connectUrl: link.url }
  } catch (err) {
    if (err instanceof ProviderError) return { error: err.message }
    throw err
  }
}

/**
 * 商家在 Ayrshare 托管页完成授权后回来点"同步连接状态"。
 * 对应 M3 的 syncChannelStatus:回读 Ayrshare 实际连接的平台,更新本地 ConnectedChannel。
 * 之前已连接、现在读不到的平台标记 needsReconnect,不是静默失败(见详细设计 M3 异常处理)。
 */
export async function syncChannelStatusAction(
  _prevState: ChannelActionState,
  _formData: FormData
): Promise<ChannelActionState> {
  const session = await requireSession('client')

  const client = await prisma.client.findUniqueOrThrow({ where: { id: session.sub } })
  if (!client.ayrshareProfileKeyEncrypted) {
    return { error: '还没有连接过任何渠道,请先点击"连接社交账号"' }
  }

  try {
    const profileKey = decryptSecret(client.ayrshareProfileKeyEncrypted)
    const { activeSocialAccounts } = await getConnectedAccounts(profileKey)
    const activeSet = new Set(activeSocialAccounts)

    const existing = await prisma.connectedChannel.findMany({ where: { clientId: session.sub } })
    const existingByPlatform = new Map(existing.map((c) => [c.platform, c]))

    const ops = SUPPORTED_PLATFORMS.flatMap((platform) => {
      const isActive = activeSet.has(platform)
      const row = existingByPlatform.get(platform)
      if (!row && !isActive) return []

      return [
        prisma.connectedChannel.upsert({
          where: { clientId_platform: { clientId: session.sub, platform } },
          create: {
            clientId: session.sub,
            platform,
            connected: isActive,
            connectedAt: isActive ? new Date() : null,
            needsReconnect: false,
          },
          update: {
            connected: isActive,
            ...(isActive && !row?.connected ? { connectedAt: new Date() } : {}),
            needsReconnect: !isActive && Boolean(row?.connected),
          },
        }),
      ]
    })

    if (ops.length > 0) await prisma.$transaction(ops)

    await logAudit({
      actorType: 'client',
      actorId: session.sub,
      action: 'channel.status_synced',
      clientId: session.sub,
      metadata: { connectedPlatforms: activeSocialAccounts },
    })

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/connect')
    return { error: null }
  } catch (err) {
    if (err instanceof ProviderError) return { error: err.message }
    throw err
  }
}
