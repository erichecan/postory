"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getTranslations } from "next-intl/server";
import { assertUser } from "@/lib/auth/session";
import { getAyrshareGateway, isAyrshareSupported } from "@/lib/ayrshare";
import { appUrl } from "@/lib/app-url";
import { disconnectSocialAccount, ensureAyrshareProfile } from "@/lib/db/social";

export async function connectSocialAction(platform: string): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const user = await assertUser();
  const t = await getTranslations("profile.social");
  if (!isAyrshareSupported(z.string().max(32).parse(platform))) return { ok: false, error: t("unsupported") };
  const { profileKey } = await ensureAyrshareProfile(user.id, user.name);
  const redirectUrl = `${appUrl()}/api/social/callback?platform=${encodeURIComponent(platform)}`;
  const { url } = await getAyrshareGateway().createConnectLink(profileKey, redirectUrl);
  return { ok: true, url };
}

export async function disconnectSocialAction(platform: string): Promise<{ ok: boolean }> {
  const user = await assertUser();
  await disconnectSocialAccount(user.id, z.string().max(32).parse(platform));
  revalidatePath("/profile");
  revalidatePath("/my-brand");
  return { ok: true };
}
