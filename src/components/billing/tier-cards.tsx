import Link from "next/link";
import { Check } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { cn } from "@/lib/utils";
import { ContactButton } from "./contact-button";
import type { TierView } from "@/types/commerce";

export async function TierCards({ tiers }: { tiers: (TierView & { recommended?: boolean })[] }) {
  const [t, tp] = await Promise.all([getTranslations("billing.tiers"), getTranslations("plans")]);
  return (
    <section className="flex flex-col gap-5">
      <div className="text-center">
        <h2 className="text-xl font-semibold tracking-tight">{t("title")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
        <Link href="/plans" className="mt-2 inline-block text-sm text-primary hover:underline">{tp("compare")} →</Link>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {tiers.map((tier) => (
          <div key={tier.id} className={cn("flex flex-col gap-4 rounded-xl border bg-card p-5", tier.recommended && "border-primary/60 ring-1 ring-primary/30")}>
            <h3 className="text-lg font-semibold">{tier.name}</h3>
            <ul className="flex flex-1 flex-col gap-2 text-sm">
              {tier.benefits.map((b) => (
                <li key={b} className="flex gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span className="text-foreground/85">{b}</span>
                </li>
              ))}
            </ul>
            <ContactButton label={t("cta")} variant={tier.recommended ? "default" : "outline"} size="lg" className="w-full" />
          </div>
        ))}
      </div>
    </section>
  );
}
