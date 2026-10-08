"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { CalendarDays, Sparkles, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNavigation({ demoTab, onDemoTab }: { demoTab?: string; onDemoTab?: (tab: string) => void }) {
  const pathname = usePathname();
  const t = useTranslations("nails");
  const items = [
    { key: "create", label: t("navCreate"), icon: Sparkles },
    { key: "appointments", label: t("navAppointments"), icon: CalendarDays },
    { key: "me", label: t("navMe"), icon: UserRound },
  ];
  return <nav aria-label={t("product")} className="nails-nav fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md">
    <div className="mx-auto grid max-w-2xl grid-cols-3 px-4">
      {items.map(({ key, label, icon: Icon }) => {
        const active = demoTab ? demoTab === key : pathname === `/nails/${key}`;
        const className = cn("flex min-h-18 flex-col items-center justify-center gap-1.5 rounded-xl text-xs font-medium outline-none focus-visible:ring-2 focus-visible:ring-primary", active ? "text-primary" : "text-muted-foreground hover:text-foreground");
        const content = <><Icon className="size-5" aria-hidden="true" /><span>{label}</span></>;
        return onDemoTab
          ? <button type="button" key={key} onClick={() => onDemoTab(key)} aria-current={active ? "page" : undefined} className={className}>{content}</button>
          : <Link key={key} href={`/nails/${key}`} aria-current={active ? "page" : undefined} className={className}>{content}</Link>;
      })}
    </div>
  </nav>;
}
