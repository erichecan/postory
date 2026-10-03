import "server-only";
import { prisma } from "./client";
import { getWhatsAppGateway } from "@/lib/whatsapp";
import { publishDesignToAyrshare } from "./ayrshare-publish";
import type { PublishPlatformId } from "@/lib/platforms";

const APPROVE_WINDOW_MS = 24 * 3600 * 1000;

export async function maybeCreateApprovalRequest(input: {
  userId: string;
  calendarSlotId: string;
  caption: string;
  imageUrl: string;
}): Promise<void> {
  const profile = await prisma.brandProfile.findUnique({ where: { userId: input.userId }, select: { whatsappNumber: true } });
  if (!profile?.whatsappNumber) return;
  const sentAt = new Date();
  const { providerMessageId } = await getWhatsAppGateway().sendApprovalRequest({
    to: profile.whatsappNumber,
    caption: input.caption,
    imageUrl: input.imageUrl,
  });
  await prisma.approvalRequest.create({
    data: {
      calendarSlotId: input.calendarSlotId,
      userId: input.userId,
      channel: "WHATSAPP",
      sentAt,
      autoApproveAt: new Date(sentAt.getTime() + APPROVE_WINDOW_MS),
      providerMessageId,
    },
  });
}

// 乐观锁：UPDATE ... WHERE status='PENDING' 只有一次调用能真的把行抢到手，
// 并发的 webhook 回复和 cron 超时同时触发也不会对同一条审核请求发两次。
async function claim(approvalId: string, nextStatus: "APPROVED" | "AUTO_APPROVED"): Promise<boolean> {
  const result = await prisma.approvalRequest.updateMany({
    where: { id: approvalId, status: "PENDING" },
    data: { status: nextStatus, respondedAt: new Date() },
  });
  return result.count > 0;
}

async function resolveAndPublish(approvalId: string, nextStatus: "APPROVED" | "AUTO_APPROVED") {
  const claimed = await claim(approvalId, nextStatus);
  if (!claimed) return { published: false, reason: "already-resolved" as const };

  const approval = await prisma.approvalRequest.findUniqueOrThrow({
    where: { id: approvalId },
    select: { userId: true, calendarSlot: { select: { id: true, designId: true } } },
  });
  const designId = approval.calendarSlot.designId;
  if (!designId) return { published: false, reason: "no-design" as const };

  const design = await prisma.design.findUniqueOrThrow({
    where: { id: designId },
    select: { caption: true, exportedImageUrl: true, platforms: true, scheduledAt: true },
  });
  if (!design.caption || !design.exportedImageUrl || !design.scheduledAt) return { published: false, reason: "design-incomplete" as const };

  const outcome = await publishDesignToAyrshare({
    userId: approval.userId,
    caption: design.caption,
    mediaUrl: design.exportedImageUrl,
    platforms: design.platforms as PublishPlatformId[],
    scheduledAt: design.scheduledAt,
  });

  await prisma.design.update({
    where: { id: designId },
    data: { publishStatus: outcome.publishStatus, publishError: outcome.publishError, ayrsharePostId: outcome.ayrsharePostId },
  });
  await prisma.calendarSlot.update({
    where: { id: approval.calendarSlot.id },
    data: { status: outcome.publishStatus === "SUCCESS" ? "PUBLISHED" : "CONFIRMED" },
  });
  return { published: true, outcome };
}

export async function approveByReply(whatsappFrom: string): Promise<{ approvedId: string | null }> {
  const profile = await prisma.brandProfile.findFirst({ where: { whatsappNumber: whatsappFrom }, select: { userId: true } });
  if (!profile) return { approvedId: null };
  const pending = await prisma.approvalRequest.findFirst({
    where: { userId: profile.userId, status: "PENDING" },
    orderBy: { sentAt: "desc" },
    select: { id: true },
  });
  if (!pending) return { approvedId: null };
  await resolveAndPublish(pending.id, "APPROVED");
  return { approvedId: pending.id };
}

export async function autoApproveDueRequests(): Promise<{ processed: number }> {
  const due = await prisma.approvalRequest.findMany({
    where: { status: "PENDING", autoApproveAt: { lte: new Date() } },
    select: { id: true },
  });
  let processed = 0;
  for (const req of due) {
    const r = await resolveAndPublish(req.id, "AUTO_APPROVED");
    if (r.published) processed++;
  }
  return { processed };
}
