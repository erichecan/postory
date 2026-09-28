"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import type { BrandFields } from "@/components/editor/brand-panel";
import { ProfileForm } from "./profile-form";

export function OnboardingForm({ initial }: { initial: BrandFields | null }) {
  const router = useRouter();
  const done = useCallback(() => router.push("/templates"), [router]);
  return (
    <div className="flex flex-col gap-4">
      <ProfileForm initial={initial} submitLabel="保存，去挑模板" onSaved={done} />
      <Link href="/templates" className="text-sm text-muted-foreground hover:text-foreground">先跳过，稍后再填 →</Link>
    </div>
  );
}
