"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function BottomSheet({ trigger, title, description, children }: { trigger: ReactNode; title: string; description: string; children?: ReactNode }) {
  const t = useTranslations("nails");
  return <Dialog>
    <DialogTrigger render={<Button variant="outline" className="min-h-11" />}>{trigger}</DialogTrigger>
    <DialogContent showCloseButton={false} className="nails-sheet top-auto bottom-0 left-0 max-h-[85dvh] max-w-full translate-x-0 translate-y-0 gap-5 overflow-y-auto rounded-b-none rounded-t-3xl p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:top-1/2 sm:bottom-auto sm:left-1/2 sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl">
      <DialogTitle className="text-xl">{title}</DialogTitle>
      <DialogDescription className="leading-7">{description}</DialogDescription>
      {children}
      <DialogClose render={<Button variant="outline" className="min-h-11" />}>{t("close")}</DialogClose>
    </DialogContent>
  </Dialog>;
}
