import "server-only";
import { cache } from "react";
import { forbidden } from "next/navigation";
import { hasAgencyAccess } from "@/lib/db/agency-access";
import { getUserName } from "@/lib/db/users";
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

/**
 * 页面用：未登录走 requireUser() 的 302 到 /login；已登录但没有这个客户的 AgencyAccess 走 forbidden()，
 * 渲染真正的 403（next.config.ts 的 experimental.authInterrupts 已开启），不是重定向糊弄过去。
 * 用 react cache 包一层，同一次请求里 layout 和页面各调一次也只真正查一次库。
 */
export const requireClientAccess = cache(async (clientUserId: string): Promise<{ sessionUser: CurrentUser; clientUserId: string; clientName: string }> => {
  const sessionUser = await requireUser();
  const resolved = await resolveClientUserId(sessionUser, clientUserId);
  if (!resolved) forbidden();
  const clientName = resolved === sessionUser.id ? sessionUser.name : await getUserName(resolved);
  return { sessionUser, clientUserId: resolved, clientName: clientName ?? "" };
});
