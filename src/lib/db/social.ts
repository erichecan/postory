import "server-only";
import { prisma } from "./client";
import { decryptSecret, encryptSecret } from "@/lib/crypto";
import { getAyrshareGateway } from "@/lib/ayrshare";

export async function listConnectedPlatforms(userId: string): Promise<string[]> {
  const rows = await prisma.socialAccount.findMany({ where: { userId, connectedAt: { not: null } }, select: { platform: true } });
  return rows.map((r) => r.platform);
}

export async function listSocialAccounts(userId: string) {
  return prisma.socialAccount.findMany({ where: { userId }, select: { platform: true, handle: true, connectedAt: true } });
}

export async function ensureAyrshareProfile(userId: string, title: string): Promise<{ profileKey: string }> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { ayrshareProfileKeyEnc: true, ayrshareRefId: true } });
  if (user.ayrshareProfileKeyEnc) return { profileKey: decryptSecret(user.ayrshareProfileKeyEnc) };
  const gateway = getAyrshareGateway();
  const created = await gateway.createProfile({ title });
  // 两个并发请求都可能在这里各自建出一个 Ayrshare Profile；用条件更新只让先写入的那份生效，
  // 后到的直接读回已经写入的 key，不会用自己这份覆盖掉赢家（否则先弹出的连接授权页会指向被丢弃的 Profile）。
  const won = await prisma.user.updateMany({
    where: { id: userId, ayrshareProfileKeyEnc: null },
    data: { ayrshareProfileKeyEnc: encryptSecret(created.profileKey), ayrshareRefId: created.refId },
  });
  if (won.count === 0) {
    const latest = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { ayrshareProfileKeyEnc: true } });
    if (latest.ayrshareProfileKeyEnc) return { profileKey: decryptSecret(latest.ayrshareProfileKeyEnc) };
  }
  return { profileKey: created.profileKey };
}

export async function getAyrshareProfileKey(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { ayrshareProfileKeyEnc: true } });
  return user?.ayrshareProfileKeyEnc ? decryptSecret(user.ayrshareProfileKeyEnc) : null;
}

export async function markSocialAccountConnected(userId: string, platform: string, handle: string | null) {
  await prisma.socialAccount.upsert({
    where: { userId_platform: { userId, platform } },
    create: { userId, platform, handle, connectedAt: new Date() },
    update: { handle, connectedAt: new Date() },
  });
}

export async function disconnectSocialAccount(userId: string, platform: string) {
  await prisma.socialAccount.deleteMany({ where: { userId, platform } });
}

export async function syncConnectedAccountsFromAyrshare(userId: string) {
  const profileKey = await getAyrshareProfileKey(userId);
  if (!profileKey) return [];
  const gateway = getAyrshareGateway();
  const { platforms } = await gateway.getConnectedAccounts(profileKey);
  for (const platform of platforms) await markSocialAccountConnected(userId, platform, null);
  return platforms;
}
