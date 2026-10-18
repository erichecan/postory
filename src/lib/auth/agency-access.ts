import "server-only";
import { redirect } from "next/navigation";
import { hasAgencyAccess } from "@/lib/db/agency-access";
import { AuthError, requireUser, type CurrentUser } from "./session";

/**
 * 代理商"代替客户操作"的落点：数据归属仍是 clientUserId 自己的 User/Studio，
 * 这里只校验 session 用户是不是这个客户本人，或者在 AgencyAccess 里有这条客户的授权。
 * 通过后返回的 clientUserId 就是后续所有 DAL 调用应该传入的 ownerId。
 */
export async function resolveClientUserId(sessionUser: CurrentUser, clientUserId: string): Promise<string | null> {
  if (sessionUser.id === clientUserId) return clientUserId;
  return (await hasAgencyAccess(sessionUser.id, clientUserId)) ? clientUserId : null;
}

export async function assertClientAccess(clientUserId: string): Promise<{ sessionUser: CurrentUser; clientUserId: string }> {
  const sessionUser = await requireUser();
  const resolved = await resolveClientUserId(sessionUser, clientUserId);
  if (!resolved) throw new AuthError(403);
  return { sessionUser, clientUserId: resolved };
}

export async function requireClientAccess(clientUserId: string, fallback = "/partners/clients"): Promise<{ sessionUser: CurrentUser; clientUserId: string }> {
  const sessionUser = await requireUser();
  const resolved = await resolveClientUserId(sessionUser, clientUserId);
  if (!resolved) redirect(fallback);
  return { sessionUser, clientUserId: resolved };
}
