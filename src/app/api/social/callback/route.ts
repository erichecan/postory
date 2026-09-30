import { revalidatePath } from "next/cache";
import type { NextRequest } from "next/server";
import { getAyrshareGateway, isAyrshareSupported } from "@/lib/ayrshare";
import { appUrl } from "@/lib/app-url";
import { getCurrentUser } from "@/lib/auth/session";
import { markSocialAccountConnected, syncConnectedAccountsFromAyrshare } from "@/lib/db/social";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return Response.redirect(`${appUrl()}/login`, 302);

  const platform = req.nextUrl.searchParams.get("platform") ?? "";
  if (getAyrshareGateway().mode === "fake") {
    if (isAyrshareSupported(platform)) await markSocialAccountConnected(user.id, platform, "demo");
  } else {
    await syncConnectedAccountsFromAyrshare(user.id);
  }
  revalidatePath("/profile");
  return Response.redirect(`${appUrl()}/profile?social=connected`, 302);
}
