import { AppFooter } from "@/components/shell/app-footer";
import { AppHeader } from "@/components/shell/app-header";
import { requireUser } from "@/lib/auth/session";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader user={user} />
      <main className="min-w-0 flex-1">{children}</main>
      <AppFooter />
    </div>
  );
}
