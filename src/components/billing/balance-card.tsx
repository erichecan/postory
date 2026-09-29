"use client";

import { useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { BalanceView, Currency } from "@/types/commerce";
import { TopupDialog } from "./topup-dialog";

function Meter({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function BalanceCard({ balance, topup, blocked = "noPlan" }: { balance: BalanceView; topup: { currency: Currency; unitPrice: number } | null; blocked?: "demo" | "noPlan" | null }) {
  const t = useTranslations("billing.balance");
  const tt = useTranslations("billing.topup");
  const format = useFormatter();
  const [open, setOpen] = useState(false);

  return (
    <section className="flex flex-col gap-5 rounded-xl border bg-card p-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">{t("title")}</p>
          <p className="mt-1 text-4xl font-semibold tabular-nums">
            {balance.total} <span className="text-base font-normal text-muted-foreground">{t("unit")}</span>
          </p>
        </div>
        {topup ? (
          <Button size="lg" onClick={() => setOpen(true)}>{t("topup")}</Button>
        ) : (
          <span className="max-w-40 text-right text-xs text-muted-foreground">{tt(blocked === "demo" ? "demoNoTopup" : "needPlan")}</span>
        )}
      </div>

      <div className="flex flex-col gap-4 text-sm">
        {balance.monthly && (
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between">
              <span>{t("monthly")}</span>
              <span className="tabular-nums">{balance.monthly.remaining} / {balance.monthly.amount}</span>
            </div>
            <Meter value={balance.monthly.remaining} max={balance.monthly.amount} />
            {balance.monthly.expiresAt && (
              <span className="text-xs text-muted-foreground">{t("monthlyExpires", { date: format.dateTime(balance.monthly.expiresAt, { dateStyle: "medium" }) })}</span>
            )}
          </div>
        )}
        {balance.templateOnly > 0 && (
          <div className="flex justify-between"><span className="text-muted-foreground">{t("templateOnly")}</span><span className="tabular-nums">{balance.templateOnly}</span></div>
        )}
        {balance.lasting > 0 && (
          <div className="flex justify-between"><span className="text-muted-foreground">{t("lasting")}</span><span className="tabular-nums">{balance.lasting}</span></div>
        )}
        {balance.videos && (
          <div className="flex flex-col gap-1.5 border-t pt-4">
            <div className="flex justify-between">
              <span>{t("videos")}</span>
              <span className="tabular-nums">{t("videosUnit", { remaining: balance.videos.remaining, amount: balance.videos.amount })}</span>
            </div>
            <Meter value={balance.videos.remaining} max={balance.videos.amount} />
          </div>
        )}
      </div>

      {topup && (
        <TopupDialog
          open={open}
          onOpenChange={setOpen}
          currency={topup.currency}
          unitPrice={topup.unitPrice}
          onSubmit={(q) => {
            setOpen(false);
            toast.info(`Stripe Checkout · ${q}`);
          }}
        />
      )}
    </section>
  );
}
