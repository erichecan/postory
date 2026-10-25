import Link from "next/link";
import { ClaimRestaurantAccount } from "@/components/restaurant/claim-restaurant-account";
import { requireUser } from "@/lib/auth/session";
import { getRestaurantBriefForClaim } from "@/lib/db/restaurant-campaigns";

export default async function ClaimRestaurantPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  await requireUser();
  if (!/^[a-f0-9]{48}$/.test(token)) return <main className="mx-auto w-full max-w-xl flex-1 px-4 py-16"><h1 className="text-2xl font-semibold">Invalid restaurant request link</h1></main>;
  const brief = await getRestaurantBriefForClaim(token);
  if (!brief) return <main className="mx-auto w-full max-w-xl flex-1 px-4 py-16"><h1 className="text-2xl font-semibold">Restaurant request not found</h1></main>;
  return <main className="mx-auto w-full max-w-xl flex-1 px-4 py-16"><p className="text-sm font-semibold uppercase tracking-widest text-primary">PoStory Restaurant</p><h1 className="mt-3 text-3xl font-semibold">Connect {brief.clientUserId ? "your" : "your restaurant’s"} account</h1><p className="mt-3 text-muted-foreground">Once connected, your team will build and maintain the restaurant marketing plan here, including campaign themes, upcoming content, review steps, and publishing status.</p>{brief.clientUserId && <p className="mt-4 rounded-lg bg-muted p-3 text-sm">This request is already connected to an account. If it is yours, continue to your restaurant plan.</p>}{brief.clientUserId ? <Link className="mt-4 inline-block rounded-lg border px-4 py-2" href="/restaurant/campaigns">Open my restaurant plans</Link> : <ClaimRestaurantAccount token={token}/>}</main>;
}
