import { OnboardingForm } from "@/components/profile/onboarding-form";
import { requireUser } from "@/lib/auth/session";
import { getBrandProfile } from "@/lib/db/profiles";

export default async function OnboardingPage() {
  const user = await requireUser();
  const profile = await getBrandProfile(user.id);
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-8">
      <p className="text-sm text-primary">第 1 步 / 共 1 步</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">{user.name}，先告诉我们你的店</h1>
      <p className="mt-1 mb-8 text-sm text-muted-foreground">填一次，以后每个模板都能一键带入店名、微信和活动，不用重复打字。</p>
      <OnboardingForm initial={profile ? { ...profile, shopName: profile.shopName ?? user.name } : { shopName: user.name, wechat: null, phone: null, address: null, slogan: null, activity: null, logoUrl: null }} />
    </div>
  );
}
