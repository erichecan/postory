import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { BRAND } from "@/lib/brand";
import { PLATFORMS } from "@/lib/platforms";

const COLUMNS = [
  { title: "模板", links: PLATFORMS.map((p) => ({ href: `/templates?platform=${p.id}`, label: p.label })) },
  {
    title: "工作台",
    links: [
      { href: "/designs", label: "我的作品" },
      { href: "/designs", label: "发布计划" },
      { href: "/profile", label: "商家资料" },
    ],
  },
];

export function AppFooter() {
  return (
    <footer className="mt-24 border-t border-white/[0.06]">
      <div className="mx-auto grid max-w-[1080px] gap-10 px-4 py-14 sm:grid-cols-[1.4fr_1fr_1fr]">
        <div className="flex flex-col gap-3">
          <Logo />
          <p className="max-w-xs text-sm text-muted-foreground">{BRAND.nameZh} · {BRAND.tagline}</p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title} className="flex flex-col gap-3">
            <p className="text-xs font-medium uppercase tracking-[0.18em]">{col.title}</p>
            {col.links.map((l) => (
              <Link key={l.label} href={l.href} className="text-sm text-muted-foreground hover:text-foreground">{l.label}</Link>
            ))}
          </div>
        ))}
      </div>
      <div className="border-t border-white/[0.06]">
        <p className="mx-auto max-w-[1080px] px-4 py-5 text-xs text-muted-foreground">© 2026 {BRAND.name} · 保留所有权利</p>
      </div>
    </footer>
  );
}
