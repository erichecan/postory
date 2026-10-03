import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ProfileForm } from "@/components/profile/profile-form";
import { SocialAccountsPanel } from "@/components/profile/social-accounts-panel";
import { requireUser } from "@/lib/auth/session";
import { listEndCustomers } from "@/lib/db/end-customers";
import { getBrandProfile } from "@/lib/db/profiles";
import { listSocialAccounts } from "@/lib/db/social";

export default async function ProfilePage() {
  const user = await requireUser();
  const [profile, accounts, customers, t, tc] = await Promise.all([
    getBrandProfile(user.id),
    listSocialAccounts(user.id),
    listEndCustomers(user.id),
    getTranslations("profile.page"),
    getTranslations("customers"),
  ]);
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
      <p className="mt-1 mb-8 text-sm text-muted-foreground">{t("subtitle")}</p>
      <ProfileForm initial={profile} />
      <div className="my-10 h-px bg-border" />
      <SocialAccountsPanel accounts={accounts.filter((a) => a.connectedAt).map((a) => ({ platform: a.platform, handle: a.handle }))} />
      <div className="my-10 h-px bg-border" />
      <div className="flex items-center justify-between gap-3 rounded-xl border p-4">
        <div>
          <h2 className="font-semibold">{tc("title")}</h2>
          <p className="mt-1 text-xs text-muted-foreground">{tc("subtitle")}</p>
        </div>
        <Link href="/profile/customers" className="shrink-0 rounded-md border px-3 py-1.5 text-sm hover:bg-accent">
          {customers.length}
        </Link>
      </div>
    </div>
  );
}
