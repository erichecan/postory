"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function RestaurantRequestStatusActions({ copyLabel, copiedLabel, refreshLabel, refreshingLabel }: { copyLabel: string; copiedLabel: string; refreshLabel: string; refreshingLabel: string }) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2200);
  }

  return <div className="mt-4 flex flex-wrap gap-2">
    <button type="button" onClick={() => void copyLink()} className="rounded-lg border border-primary/30 bg-background px-3 py-2 text-sm font-medium text-primary">{copied ? copiedLabel : copyLabel}</button>
    <button type="button" onClick={() => startTransition(() => router.refresh())} disabled={pending} className="rounded-lg border bg-background px-3 py-2 text-sm font-medium disabled:opacity-60">{pending ? refreshingLabel : refreshLabel}</button>
  </div>;
}
