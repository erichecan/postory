import { getLocale, getTranslations } from "next-intl/server";
import { CreateStudio } from "@/components/create/create-studio";
import { requireUser } from "@/lib/auth/session";
import { getBrandProfile } from "@/lib/db/profiles";
import { DEMO_PHONE } from "@/lib/demo";
import { mockBalance, mockPlan, type MockPlanState } from "@/lib/mock/commerce";

export default async function CreatePage({ searchParams }: PageProps<"/create">) {
  const user = await requireUser();
  const sp = await searchParams;
  const state: MockPlanState = sp.state === "none" ? "none" : "active";
  const [t, profile, locale] = await Promise.all([getTranslations("create.page"), getBrandProfile(user.id), getLocale()]);
  const plan = mockPlan(locale, state);
  const balance = mockBalance(state, sp.empty === "1");

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
        isDemo={user.phone === DEMO_PHONE && sp.demo !== "0"}
        topup={plan ? { currency: plan.currency, unitPrice: plan.topupUnitPrice } : null}
      />
    </div>
  );
}
