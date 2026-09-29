import Link from "next/link";
import { Gift } from "lucide-react";
import { getTranslations } from "next-intl/server";

export async function VerifyBanner() {
  const t = await getTranslations("auth.banner");
  return (
    <div className="border-b border-primary/20 bg-primary/10">
      <div className="mx-auto flex max-w-[1080px] items-center justify-center gap-3 px-4 py-2 text-sm">
        <Gift className="size-4 shrink-0 text-primary" />
        <span>{t("text")}</span>
        <Link href="/verify-email" className="font-medium text-primary hover:underline">{t("action")} →</Link>
      </div>
    </div>
  );
}
