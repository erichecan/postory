import { AppSidebar } from "@/components/shell/app-sidebar";
import { requireUser } from "@/lib/auth/session";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <AppSidebar user={user} />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
