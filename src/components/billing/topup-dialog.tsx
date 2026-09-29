"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatMoney, MIN_TOPUP_CREDITS } from "@/lib/billing/plan-math";
import type { Currency } from "@/types/commerce";

const STEP = 10;

export function TopupDialog({
  open,
  onOpenChange,
  currency,
  unitPrice,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currency: Currency;
  unitPrice: number;
  onSubmit: (quantity: number) => void;
}) {
  const t = useTranslations("billing.topup");
  const locale = useLocale();
  const [quantity, setQuantity] = useState(50);
  const money = (cents: number) => formatMoney(cents, currency, locale);
  const clamp = (n: number) => Math.min(10_000, Math.max(MIN_TOPUP_CREDITS, Number.isFinite(n) ? Math.round(n) : MIN_TOPUP_CREDITS));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <span className="text-sm">{t("quantity")}</span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon-lg" aria-label="-" onClick={() => setQuantity((q) => clamp(q - STEP))} disabled={quantity <= MIN_TOPUP_CREDITS}>
                <Minus />
              </Button>
              <input
                type="number"
                inputMode="numeric"
                min={MIN_TOPUP_CREDITS}
                value={quantity}
                onChange={(e) => setQuantity(clamp(Number(e.target.value)))}
                className="h-9 w-24 rounded-lg border bg-input/30 text-center text-base tabular-nums"
              />
              <Button variant="outline" size="icon-lg" aria-label="+" onClick={() => setQuantity((q) => clamp(q + STEP))}>
                <Plus />
              </Button>
              <span className="text-xs text-muted-foreground">{t("min", { count: MIN_TOPUP_CREDITS })}</span>
            </div>
          </div>
          <div className="flex flex-col gap-1.5 rounded-lg bg-muted/40 p-3 text-sm">
            <div className="flex justify-between text-muted-foreground"><span>{t("unitPrice")}</span><span className="tabular-nums">{money(unitPrice)}</span></div>
            <div className="flex justify-between font-semibold"><span>{t("total")}</span><span className="tabular-nums">{money(unitPrice * quantity)}</span></div>
          </div>
        </div>
        <DialogFooter>
          <Button size="lg" className="w-full sm:w-auto" onClick={() => onSubmit(quantity)}>{t("submit")} · {money(unitPrice * quantity)}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
