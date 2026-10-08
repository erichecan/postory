"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BottomSheet } from "./bottom-sheet";
import { nailsLogoutAction } from "@/lib/actions/nails-auth";

export function SignOutButton() {
  const t = useTranslations("nails");
  const [pending, startTransition] = useTransition();
  return <BottomSheet trigger={<><LogOut className="size-4" aria-hidden="true" />{t("logout")}</>} title={t("logoutTitle")} description={t("logoutDescription")}>
    <Button disabled={pending} className="min-h-12" onClick={() => startTransition(() => nailsLogoutAction())}>{t(pending ? "working" : "logout")}</Button>
  </BottomSheet>;
}
