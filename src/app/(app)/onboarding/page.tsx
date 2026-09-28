import { getTranslations } from "next-intl/server";
import { OnboardingForm } from "@/components/profile/onboarding-form";
import { requireUser } from "@/lib/auth/session";
import { getBrandProfile } from "@/lib/db/profiles";

export default async function OnboardingPage() {
  const user = await requireUser();
  const [profile, t] = await Promise.all([getBrandProfile(user.id), getTranslations("profile.onboarding")]);
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-8">
      <p className="text-sm text-primary">{t("step")}</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">{t("title", { name: user.name })}</h1>
      <p className="mt-1 mb-8 text-sm text-muted-foreground">{t("subtitle")}</p>
      <OnboardingForm initial={profile ? { ...profile, shopName: profile.shopName ?? user.name } : { shopName: user.name, wechat: null, phone: null, address: null, slogan: null, activity: null, logoUrl: null }} />
    </div>
  );
}
