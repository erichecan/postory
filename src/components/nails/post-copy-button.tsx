"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { duplicateNailsPostAction } from "@/lib/actions/nails-posts";

export function PostCopyButton({ id, label }: { id: string; label: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return <Button disabled={busy} variant="outline" className="min-h-11" onClick={async (event) => {
    event.preventDefault(); event.stopPropagation(); setBusy(true);
    const result = await duplicateNailsPostAction(id);
    if (result.ok) router.push(`/nails/posts/${result.id}`); else setBusy(false);
  }}>{busy ? "…" : label}</Button>;
}
