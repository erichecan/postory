"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { useTranslations } from "next-intl";
import { ProfileForm, type ProfileFormInitial } from "./profile-form";

export function OnboardingForm({ initial }: { initial: ProfileFormInitial | null }) {
  const router = useRouter();
  const t = useTranslations("profile.onboarding");
  const done = useCallback(() => router.push("/templates"), [router]);
  return (
    <div className="flex flex-col gap-4">
      <ProfileForm initial={initial} submitLabel={t("submit")} onSaved={done} />
      <Link href="/templates" className="text-sm text-muted-foreground hover:text-foreground">{t("skip")}</Link>
    </div>
  );
}
