import { getTranslations } from "next-intl/server";
import { ProfileForm } from "@/components/profile/profile-form";
import { SocialAccountsPanel } from "@/components/profile/social-accounts-panel";
import { requireUser } from "@/lib/auth/session";
import { getBrandProfile } from "@/lib/db/profiles";
import { listSocialAccounts } from "@/lib/db/social";

export default async function ProfilePage() {
  const user = await requireUser();
  const [profile, accounts, t] = await Promise.all([getBrandProfile(user.id), listSocialAccounts(user.id), getTranslations("profile.page")]);
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
      <p className="mt-1 mb-8 text-sm text-muted-foreground">{t("subtitle")}</p>
      <ProfileForm initial={profile} />
      <div className="my-10 h-px bg-border" />
      <SocialAccountsPanel accounts={accounts.filter((a) => a.connectedAt).map((a) => ({ platform: a.platform, handle: a.handle }))} />
    </div>
  );
}
