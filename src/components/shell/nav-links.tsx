"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/templates", label: "模板库" },
  { href: "/designs", label: "我的作品" },
  { href: "/profile", label: "商家资料" },
];

export function NavLinks({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const links = isAdmin ? [...LINKS, { href: "/admin/accounts", label: "账号管理" }] : LINKS;
  return (
    <nav className="flex items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {links.map(({ href, label }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "relative shrink-0 px-3 py-2 text-sm text-foreground/80 transition-colors hover:text-foreground",
              active && "text-foreground after:absolute after:inset-x-3 after:-bottom-px after:h-0.5 after:rounded-full after:bg-primary",
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
