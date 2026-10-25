import Link from "next/link";
import { ClaimRestaurantAccount } from "@/components/restaurant/claim-restaurant-account";
import { requireUser } from "@/lib/auth/session";
import { getRestaurantBriefForClaim } from "@/lib/db/restaurant-campaigns";
import { getTranslations } from "next-intl/server";

export default async function ClaimRestaurantPage({ params }: { params: Promise<{ token: string }> }) {
  const t = await getTranslations("restaurantRequest.claimPage");
  const { token } = await params;
  await requireUser();
  if (!/^[a-f0-9]{48}$/.test(token)) return <main className="mx-auto w-full max-w-xl flex-1 px-4 py-16"><h1 className="text-2xl font-semibold">{t("invalidLink")}</h1></main>;
  const brief = await getRestaurantBriefForClaim(token);
  if (!brief) return <main className="mx-auto w-full max-w-xl flex-1 px-4 py-16"><h1 className="text-2xl font-semibold">{t("notFound")}</h1></main>;
  return <main className="mx-auto w-full max-w-xl flex-1 px-4 py-16"><p className="text-sm font-semibold uppercase tracking-widest text-primary">{t("eyebrow")}</p><h1 className="mt-3 text-3xl font-semibold">{t("title")}</h1><p className="mt-3 text-muted-foreground">{t("description")}</p>{brief.clientUserId && <p className="mt-4 rounded-lg bg-muted p-3 text-sm">{t("alreadyConnected")}</p>}{brief.clientUserId ? <Link className="mt-4 inline-block rounded-lg border px-4 py-2" href="/restaurant/campaigns">{t("openPlans")}</Link> : <ClaimRestaurantAccount token={token}/>}</main>;
}
