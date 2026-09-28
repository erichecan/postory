import { LogOut } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { logoutAction } from "@/lib/actions/auth";
import type { CurrentUser } from "@/lib/auth/session";
import { NavLinks } from "./nav-links";

export function AppSidebar({ user }: { user: CurrentUser }) {
  return (
    <aside className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b bg-sidebar px-4 py-3 md:h-screen md:w-56 md:flex-col md:items-stretch md:justify-start md:border-r md:border-b-0 md:py-5">
      <div className="md:px-2 md:pb-6">
        <Logo />
      </div>
      <NavLinks isAdmin={user.role === "ADMIN"} />
      <div className="flex items-center gap-2 md:mt-auto md:border-t md:px-2 md:pt-4">
        <div className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/20 text-sm font-medium text-primary">
          {user.name.slice(0, 1)}
        </div>
        <div className="hidden min-w-0 flex-1 md:block">
          <p className="truncate text-sm font-medium">{user.name}</p>
          <p className="truncate text-xs text-muted-foreground">{user.phone}</p>
        </div>
        <form action={logoutAction}>
          <button type="submit" title="退出登录" className="rounded-md p-1.5 text-muted-foreground hover:bg-sidebar-accent hover:text-foreground">
            <LogOut className="size-4" />
          </button>
        </form>
      </div>
    </aside>
  );
}
