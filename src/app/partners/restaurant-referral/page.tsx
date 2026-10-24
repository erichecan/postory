import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { createPartnerReferralToken } from "@/lib/partners/referral";
import { appUrl } from "@/lib/app-url";

export default async function RestaurantReferralPage() {
  const user = await requireUser();
  const token = createPartnerReferralToken(user.id);
  const url = `${appUrl()}/our-work/restaurant?ref=${encodeURIComponent(token)}`;
  return <main className="mx-auto max-w-3xl px-4 py-12"><Link href="/partners/clients" className="text-sm text-primary">← Partner clients</Link><h1 className="mt-4 text-2xl font-semibold">Your restaurant introduction link</h1><p className="mt-2 text-muted-foreground">Send this page to a restaurant owner. They can see the restaurant example and submit their own campaign brief. Their social account stays under their control.</p><div className="mt-6 break-all rounded-xl border bg-muted/40 p-4 text-sm">{url}</div><p className="mt-4 text-sm text-muted-foreground">When the customer submits the brief, it appears in the PoStory restaurant request queue with your referral attached.</p></main>;
}
