"use client";

import { useActionState } from "react";
import { claimRestaurantCampaignFormAction } from "@/lib/actions/restaurant-campaigns";

export function ClaimRestaurantAccount({ token }: { token: string }) {
  const [state, action, pending] = useActionState(claimRestaurantCampaignFormAction, undefined);
  return <form action={action} className="mt-6 rounded-xl border bg-card p-5"><input type="hidden" name="token" value={token}/><p className="text-sm text-muted-foreground">We’ll match this request to the verified email address on your PoStory account.</p>{state?.error && <p role="alert" className="mt-3 text-sm text-destructive">{state.error}</p>}<button disabled={pending} className="mt-4 rounded-lg bg-primary px-4 py-2 text-primary-foreground disabled:opacity-60">{pending ? "Connecting…" : "Connect my restaurant to PoStory"}</button></form>;
}
