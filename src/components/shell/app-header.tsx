import Link from "next/link";
import { LogOut } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { CreditBadge } from "@/components/billing/credit-badge";
import { Logo } from "@/components/brand/logo";
import { LocaleSwitcher } from "@/components/i18n/locale-switcher";
import { logoutAction } from "@/lib/actions/auth";
import type { CurrentUser } from "@/lib/auth/session";
import { NavLinks } from "./nav-links";

export async function AppHeader({ user, credits }: { user: CurrentUser; credits: number }) {
  const t = await getTranslations("nav");
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1080px] flex-wrap items-center gap-x-4 px-4">
        <Logo />
        <div className="order-last -mx-4 flex w-[calc(100%+2rem)] min-w-0 border-t border-border px-2 md:order-none md:mx-0 md:w-auto md:flex-1 md:justify-center md:border-0 md:px-0">
          <NavLinks isAdmin={user.role === "ADMIN"} />
        </div>
        <div className="ml-auto flex h-14 shrink-0 items-center gap-2 md:ml-0">
          <CreditBadge count={credits} />
          <LocaleSwitcher />
          <Link href="/profile" className="hidden items-center gap-2 rounded-lg px-2 py-1 text-sm text-foreground/80 hover:text-foreground sm:flex">
            <span className="grid size-7 place-items-center rounded-full bg-primary/20 text-xs font-medium text-primary">{user.name.slice(0, 1)}</span>
            <span className="max-w-24 truncate">{user.name}</span>
          </Link>
          <form action={logoutAction}>
            <button type="submit" title={t("logout")} aria-label={t("logout")} className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground">
              <LogOut className="size-4" />
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
