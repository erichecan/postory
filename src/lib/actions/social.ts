"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getTranslations } from "next-intl/server";
import { assertUser } from "@/lib/auth/session";
import { getAyrshareGateway, isAyrshareSupported, isInvalidAyrshareProfileError } from "@/lib/ayrshare";
import { appUrl } from "@/lib/app-url";
import { disconnectSocialAccount, ensureAyrshareProfile, getAyrshareProfileKey, replaceInvalidAyrshareProfile } from "@/lib/db/social";
import type { PublishPlatformId } from "@/lib/platforms";

export async function connectSocialAction(platform: string): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const user = await assertUser();
  const t = await getTranslations("profile.social");
  const parsedPlatform = z.string().max(32).parse(platform);
  if (!isAyrshareSupported(parsedPlatform)) return { ok: false, error: t("unsupported") };
  try {
    let { profileKey } = await ensureAyrshareProfile(user.id, user.name);
    const redirectUrl = `${appUrl()}/api/social/callback?platform=${encodeURIComponent(parsedPlatform)}`;
    const gateway = getAyrshareGateway();
    let url: string;
    try {
      ({ url } = await gateway.createConnectLink(profileKey, redirectUrl, parsedPlatform));
    } catch (error) {
      if (!isInvalidAyrshareProfileError(error) || gateway.mode !== "live") throw error;
      ({ profileKey } = await replaceInvalidAyrshareProfile(user.id, user.name, profileKey));
      ({ url } = await gateway.createConnectLink(profileKey, redirectUrl, parsedPlatform));
    }
    return { ok: true, url };
  } catch (error) {
    console.error("Social account connection failed", error);
    return { ok: false, error: t("connectionFailed") };
  }
}

export async function disconnectSocialAction(platform: string): Promise<{ ok: boolean; error?: string }> {
  const user = await assertUser();
  const t = await getTranslations("profile.social");
  const parsedPlatform = z.string().max(32).parse(platform);
  if (!isAyrshareSupported(parsedPlatform)) return { ok: false, error: t("unsupported") };
  try {
    const profileKey = await getAyrshareProfileKey(user.id);
    if (profileKey) await getAyrshareGateway().disconnectAccount(profileKey, parsedPlatform as PublishPlatformId);
    await disconnectSocialAccount(user.id, parsedPlatform);
  } catch (error) {
    console.error("Social account disconnection failed", error);
    return { ok: false, error: t("disconnectionFailed") };
  }
  revalidatePath("/profile");
  revalidatePath("/my-brand");
  return { ok: true };
}
