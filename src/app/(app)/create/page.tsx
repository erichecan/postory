import { getTranslations } from "next-intl/server";
import { CreateStudio } from "@/components/create/create-studio";
import { requireUser } from "@/lib/auth/session";
import { getBalance } from "@/lib/db/credits";
import { getEntitlements } from "@/lib/db/entitlements";
import { getBrandProfile } from "@/lib/db/profiles";
import { DEMO_PHONE } from "@/lib/demo";

export default async function CreatePage() {
  const user = await requireUser();
  const [t, profile, balance, ent] = await Promise.all([getTranslations("create.page"), getBrandProfile(user.id), getBalance(user.id), getEntitlements(user.id)]);
  const isDemo = user.phone === DEMO_PHONE;

  return (
    <div className="mx-auto flex max-w-[1080px] flex-col gap-6 px-4 py-10">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>
      <CreateStudio
        shopName={profile?.shopName ?? null}
        initialBalance={balance.total}
        aiBalance={balance.total - balance.templateOnly}
        isDemo={isDemo}
        topup={ent.topup}
      />
    </div>
  );
}
