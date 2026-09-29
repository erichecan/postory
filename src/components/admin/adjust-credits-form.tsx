"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AdjustCreditsForm({ balance }: { balance: number }) {
  const t = useTranslations("admin.customer");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const n = Number.parseInt(amount, 10);
  const valid = Number.isInteger(n) && n !== 0 && reason.trim().length > 0;

  return (
    <form
      className="flex flex-col gap-4 rounded-xl border bg-card p-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (!valid) return;
        toast.success(`${n > 0 ? "+" : ""}${n}`);
        setAmount("");
        setReason("");
      }}
    >
      <div className="flex items-baseline justify-between">
        <h2 className="font-semibold">{t("adjustTitle")}</h2>
        <span className="text-sm text-muted-foreground">{t("balance")} <span className="font-semibold text-foreground tabular-nums">{balance}</span></span>
      </div>
      <div className="grid gap-3 sm:grid-cols-[160px_1fr_auto] sm:items-end">
        <div className="flex flex-col gap-1.5"><Label htmlFor="adj-amount">{t("adjustAmount")}</Label><Input id="adj-amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="h-9 tabular-nums" /></div>
        <div className="flex flex-col gap-1.5"><Label htmlFor="adj-reason">{t("adjustReason")}</Label><Input id="adj-reason" value={reason} maxLength={255} onChange={(e) => setReason(e.target.value)} className="h-9" /></div>
        <Button type="submit" size="lg" className="h-9" disabled={!valid}>{t("adjustSubmit")}</Button>
      </div>
    </form>
  );
}
