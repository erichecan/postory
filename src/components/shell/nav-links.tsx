"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/calendar", key: "calendar" },
  { href: "/templates", key: "templates" },
  { href: "/create", key: "create" },
  { href: "/designs", key: "designs" },
  { href: "/membership", key: "membership" },
  { href: "/profile", key: "profile" },
] as const;

export function NavLinks({ isAdmin }: { isAdmin: boolean }) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const links = isAdmin
    ? [...LINKS, { href: "/admin/accounts", key: "adminAccounts" } as const]
    : [
        { href: "/dashboard", label: "Dashboard" },
        { href: "/my-campaign", label: "My Campaign" },
        { href: "/calendar", label: "Marketing Calendar" },
        { href: "/my-brand", label: "My Brand" },
      ];
  return (
    <nav className="flex items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {links.map((item) => {
        const { href } = item;
        const label = "label" in item ? item.label : t(item.key);
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "relative shrink-0 px-3 py-2 text-sm text-foreground/80 transition-colors hover:text-foreground",
              active &&
                "text-foreground after:absolute after:inset-x-3 after:-bottom-px after:h-0.5 after:rounded-full after:bg-primary",
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
