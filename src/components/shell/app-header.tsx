import Link from "next/link";
import { LogOut } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { logoutAction } from "@/lib/actions/auth";
import type { CurrentUser } from "@/lib/auth/session";
import { NavLinks } from "./nav-links";

export function AppHeader({ user }: { user: CurrentUser }) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1080px] items-center gap-4 px-4">
        <Logo />
        <div className="flex min-w-0 flex-1 justify-center">
          <NavLinks isAdmin={user.role === "ADMIN"} />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link href="/profile" className="hidden items-center gap-2 rounded-lg px-2 py-1 text-sm text-foreground/80 hover:text-foreground sm:flex">
            <span className="grid size-7 place-items-center rounded-full bg-primary/20 text-xs font-medium text-primary">{user.name.slice(0, 1)}</span>
            <span className="max-w-24 truncate">{user.name}</span>
          </Link>
          <form action={logoutAction}>
            <button type="submit" title="退出登录" className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground">
              <LogOut className="size-4" />
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
