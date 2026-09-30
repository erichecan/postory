import Link from "next/link";
import { History } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { CreateStudio } from "@/components/create/create-studio";
import { RATIO_IDS, type Quality, type RatioId, type Round } from "@/components/create/studio-options";
import { requireUser } from "@/lib/auth/session";
import { getBalance } from "@/lib/db/credits";
import { getEntitlements } from "@/lib/db/entitlements";
import { getOwnGeneration } from "@/lib/db/generations";
import { getBrandProfile } from "@/lib/db/profiles";
import { DEMO_PHONE } from "@/lib/demo";

async function loadRound(userId: string, from: string | string[] | undefined): Promise<Round | null> {
  if (typeof from !== "string" || from.length > 40) return null;
  const gen = await getOwnGeneration(userId, from);
  if (!gen || gen.status !== "SUCCEEDED" || !gen.outputUrl) return null;
  const ratio = (RATIO_IDS as string[]).includes(gen.size) ? (gen.size as RatioId) : "square";
  return { id: gen.id, url: gen.outputUrl, prompt: gen.userPrompt, quality: gen.quality as Quality, ratio };
}

export default async function CreatePage({ searchParams }: PageProps<"/create">) {
  const user = await requireUser();
  const { from } = await searchParams;
  const [t, profile, balance, ent, initialRound] = await Promise.all([getTranslations("create"), getBrandProfile(user.id), getBalance(user.id), getEntitlements(user.id), loadRound(user.id, from)]);

  return (
    <div className="mx-auto flex max-w-[1080px] flex-col gap-6 px-4 py-10">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("page.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("page.subtitle")}</p>
        </div>
        <Link href="/generations" className="inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm hover:bg-muted">
          <History className="size-4" /> {t("history")}
        </Link>
      </header>
      <CreateStudio
        key={initialRound?.id ?? "new"}
        shopName={profile?.shopName ?? null}
        initialBalance={balance.total}
        aiBalance={balance.total - balance.templateOnly}
        isDemo={user.phone === DEMO_PHONE}
        hasPlan={ent.hasActivePlan}
        topup={ent.topup}
        initialRound={initialRound}
      />
    </div>
  );
}
