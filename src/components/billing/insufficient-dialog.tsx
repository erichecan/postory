"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function InsufficientDialog({
  open,
  onOpenChange,
  need,
  have,
  hasPlan,
  templateOnlyExcluded,
  onTopup,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  need: number;
  have: number;
  hasPlan: boolean;
  templateOnlyExcluded: boolean;
  onTopup: () => void;
}) {
  const t = useTranslations("billing.insufficient");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("body", { need, have })}</DialogDescription>
        </DialogHeader>
        {templateOnlyExcluded && <p className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">{t("templateOnlyHint")}</p>}
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>{t("later")}</Button>
          {hasPlan ? (
            <Button onClick={onTopup}>{t("topup")}</Button>
          ) : (
            <Link href="/membership" className={buttonVariants()}>{t("openPlan")}</Link>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
