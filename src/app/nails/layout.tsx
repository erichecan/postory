import type { Metadata, Viewport } from "next";
import { getTranslations } from "next-intl/server";
import { Logo } from "@/components/brand/logo";
import { LocaleSwitcher } from "@/components/i18n/locale-switcher";
import "./nails.css";

export const metadata: Metadata = { title: "PoStory for Nails", robots: { index: false, follow: false } };
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#f6f8fc" };

export default async function NailsLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations("nails");
  return <div className="nails-app min-h-dvh bg-[var(--ds-canvas)] text-foreground">
    <header className="border-b border-border bg-background px-5 pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex min-h-20 max-w-4xl items-center justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1 py-3"><Logo href="/nails" /><span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{t("product")}</span></div>
        <LocaleSwitcher />
      </div>
    </header>
    {children}
  </div>;
}
