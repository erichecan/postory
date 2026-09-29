"use client";

import { useState } from "react";
import { Copy, MessageCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CONTACT_WECHAT, CONTACT_WECHAT_QR } from "@/lib/brand";
import { cn } from "@/lib/utils";

export function ContactButton({ label, variant = "default", size = "default", className }: { label: string; variant?: "default" | "outline" | "link"; size?: "default" | "lg"; className?: string }) {
  const t = useTranslations("billing.contact");
  const [open, setOpen] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(CONTACT_WECHAT);
      toast.success(t("copied"));
    } catch {
      toast.error(CONTACT_WECHAT);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant={variant} size={size} className={cn(variant === "link" && "h-auto p-0", className)} />}>{label}</DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><MessageCircle className="size-5 text-emerald-400" /> {t("title")}</DialogTitle>
          <DialogDescription>{t("body")}</DialogDescription>
        </DialogHeader>
        {CONTACT_WECHAT_QR && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={CONTACT_WECHAT_QR} alt={t("qrAlt")} className="mx-auto size-48 rounded-lg bg-white p-2" />
        )}
        {CONTACT_WECHAT ? (
          <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/40 px-3 py-2.5">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">{t("idLabel")}</span>
              <span className="font-mono text-base">{CONTACT_WECHAT}</span>
            </div>
            <Button variant="outline" onClick={copy} className="gap-1.5"><Copy className="size-3.5" /> {t("copy")}</Button>
          </div>
        ) : (
          <p className="rounded-md bg-muted/50 px-3 py-2 text-sm text-muted-foreground">{t("missing")}</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
