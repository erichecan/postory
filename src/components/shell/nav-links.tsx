"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Images, Store, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/templates", label: "模板库", icon: LayoutGrid },
  { href: "/designs", label: "我的作品", icon: Images },
  { href: "/profile", label: "商家资料", icon: Store },
];

export function NavLinks({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const links = isAdmin ? [...LINKS, { href: "/admin/accounts", label: "账号管理", icon: Users }] : LINKS;
  return (
    <nav className="flex gap-1 md:flex-col">
      {links.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground",
              active && "bg-sidebar-accent text-foreground",
            )}
          >
            <Icon className="size-4" />
            <span className="hidden sm:inline">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
