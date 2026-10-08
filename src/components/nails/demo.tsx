"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { CalendarDays, Flower2 } from "lucide-react";
import { BottomNavigation } from "./navigation";
import { EmptyState, NailsCard, PageHeading } from "./primitives";
import { Button } from "@/components/ui/button";

// Deliberately contains no DB reads, shared demo account, or mutation actions.
export function NailsDemo() {
  const t = useTranslations("nails");
  const [tab, setTab] = useState("create");
  return <>
    <div className="bg-accent px-5 py-3 text-center text-xs leading-6 text-primary">{t("demoBanner")}</div>
    <main className="nails-main">
      <PageHeading eyebrow={t("demoTitle")} title={t(tab === "create" ? "demoCreateTitle" : tab === "appointments" ? "appointmentsTitle" : "meTitle")} description={t(tab === "create" ? "demoCreateDescription" : tab === "appointments" ? "demoAppointmentsDescription" : "demoMeDescription")} />
      {tab === "me" ? <NailsCard>
        <dl className="space-y-5"><div><dt className="text-xs text-muted-foreground">{t("studioName")}</dt><dd className="mt-2 font-medium">{t("demoTitle")}</dd></div><div><dt className="text-xs text-muted-foreground">{t("timeZone")}</dt><dd className="mt-2 text-sm">America/Toronto</dd></div></dl>
      </NailsCard> : <EmptyState icon={tab === "create" ? <Flower2 className="size-8" /> : <CalendarDays className="size-7" />} title={t(tab === "create" ? "createEmptyTitle" : "appointmentsEmptyTitle")} description={t(tab === "create" ? "createEmptyDescription" : "appointmentsEmptyDescription")} />}
      <Button render={<Link href="/nails/login" />} className="min-h-12 w-full">{t("demoCta")}</Button>
    </main>
    <BottomNavigation demoTab={tab} onDemoTab={setTab} />
  </>;
}
