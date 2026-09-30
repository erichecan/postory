import { prisma } from '@/lib/prisma'

export type LogAuditInput = {
  actorType: 'admin' | 'client' | 'system'
  actorId?: string
  action: string
  clientId?: string
  metadata?: Record<string, unknown>
}

/**
 * 统一的审计日志入口(M13)。所有关键写操作(建客户、连渠道、发布、改额度)都要调这个,
 * 不要各写各的。失败了不应该影响主流程,所以这里吞掉异常只打日志,不 throw。
 */
export async function logAudit(input: LogAuditInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorType: input.actorType,
        actorId: input.actorId,
        action: input.action,
        clientId: input.clientId,
        metadata: input.metadata as never,
      },
    })
  } catch (err) {
    console.error('[audit] 写入审计日志失败', input.action, err)
  }
}
