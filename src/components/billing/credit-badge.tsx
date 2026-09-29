import Link from "next/link";
import { Coins } from "lucide-react";
import { getTranslations } from "next-intl/server";

export async function CreditBadge({ count }: { count: number }) {
  const t = await getTranslations("billing.badge");
  return (
    <Link
      href="/membership"
      title={t("label", { count })}
      aria-label={t("label", { count })}
      className="flex h-8 items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 text-xs font-medium text-primary tabular-nums hover:bg-primary/20"
    >
      <Coins className="size-3.5" />
      {count}
    </Link>
  );
}
