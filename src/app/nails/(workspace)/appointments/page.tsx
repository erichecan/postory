import { getTranslations } from "next-intl/server";
import { CalendarDays, Globe2 } from "lucide-react";
import { getNailsWorkspace } from "@/lib/nails/workspace";
import { EmptyState, PageHeading } from "@/components/nails/primitives";

export default async function AppointmentsPage() {
  const { studio } = await getNailsWorkspace();
  const t = await getTranslations("nails");
  return <>
    <PageHeading eyebrow={studio.name} title={t("appointmentsTitle")} description={t("appointmentsDescription")} />
    <p className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground"><Globe2 className="size-4" aria-hidden="true" />{t("timeZoneLabel")} · {studio.timeZone}</p>
    <EmptyState icon={<CalendarDays className="size-7" />} title={t("appointmentsEmptyTitle")} description={t("appointmentsEmptyDescription")}><span className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-primary">{t("comingSoon")}</span></EmptyState>
  </>;
}
