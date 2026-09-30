import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Logo } from "@/components/brand/logo";
import { BRAND } from "@/lib/brand";
import { PLATFORMS, platformLabel } from "@/lib/platforms";

export async function AppFooter() {
  const [t, tc, tp, tl] = await Promise.all([getTranslations("nav"), getTranslations("common"), getTranslations("platforms"), getTranslations("legal.nav")]);
  const columns = [
    { title: t("footer.templates"), links: PLATFORMS.map((p) => ({ href: `/templates?platform=${p.id}`, label: platformLabel(tp, p.id) })) },
    {
      title: t("footer.workspace"),
      links: [
        { href: "/designs", label: t("footer.designs") },
        { href: "/designs", label: t("footer.schedule") },
        { href: "/profile", label: t("footer.profile") },
        { href: "/plans", label: t("footer.plans") },
      ],
    },
  ];
  return (
    <footer className="mt-24 border-t border-white/[0.06]">
      <div className="mx-auto grid max-w-[1080px] gap-10 px-4 py-14 sm:grid-cols-[1.4fr_1fr_1fr]">
        <div className="flex flex-col gap-3">
          <Logo />
          <p className="max-w-xs text-sm text-muted-foreground">{tc("brandName")} · {tc("tagline")}</p>
        </div>
        {columns.map((col) => (
          <div key={col.title} className="flex flex-col gap-3">
            <p className="text-xs font-medium uppercase tracking-[0.18em]">{col.title}</p>
            {col.links.map((l) => (
              <Link key={l.label} href={l.href} className="text-sm text-muted-foreground hover:text-foreground">{l.label}</Link>
            ))}
          </div>
        ))}
      </div>
      <div className="border-t border-white/[0.06]">
        <div className="mx-auto flex max-w-[1080px] flex-wrap items-center justify-between gap-3 px-4 py-5 text-xs text-muted-foreground">
          <p>{t("footer.copyright", { brand: BRAND.name })}</p>
          <nav aria-label={tl("label")} className="flex gap-4">
            {(["terms", "privacy", "refund"] as const).map((d) => (
              <Link key={d} href={`/legal/${d}`} className="hover:text-foreground">{tl(d)}</Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
