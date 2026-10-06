import { VerifyBanner } from "@/components/auth/verify-banner";
import { AppFooter } from "@/components/shell/app-footer";
import { AppHeader } from "@/components/shell/app-header";
import { requireUser } from "@/lib/auth/session";
import { getBalance } from "@/lib/db/credits";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();
  const balance = await getBalance(user.id);
  return (
    <div className="ds-legacy flex min-h-screen flex-col">
      <AppHeader user={user} credits={balance.total} />
      {user.email && !user.emailVerifiedAt && <VerifyBanner />}
      <main className="min-w-0 flex-1">{children}</main>
      {user.role === "ADMIN" && <AppFooter />}
    </div>
  );
}
