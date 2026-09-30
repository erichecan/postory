import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/admin/accounts", key: "accounts" },
  { href: "/admin/tiers", key: "tiers" },
  { href: "/admin/generations", key: "generations" },
] as const;

export async function AdminSubnav({ active }: { active: (typeof TABS)[number]["key"] }) {
  const t = await getTranslations("admin.nav");
  return (
    <nav className="flex gap-1 rounded-lg bg-muted p-[3px] text-sm">
      {TABS.map((tab) => (
        <Link key={tab.key} href={tab.href} className={cn("rounded-md px-3 py-1.5", active === tab.key ? "bg-background font-medium dark:bg-input/40" : "text-muted-foreground hover:text-foreground")}>
          {t(tab.key)}
        </Link>
      ))}
    </nav>
  );
}
