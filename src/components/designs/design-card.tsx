import Link from "next/link";
import { CalendarClock } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { FitPreview } from "@/components/canvas/fit-preview";
import type { DesignListItem } from "@/lib/db/designs";
import { publishPlatformLabel } from "@/lib/platforms";
import { DeleteDesignButton } from "./delete-design-button";

export const DESIGN_CARD_PADDING = 8;
export const DESIGN_CARD_CAPTION = 96;

const DATE_FORMAT = { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" } as const;

export function DesignCard({ d }: { d: DesignListItem }) {
  const t = useTranslations("designs");
  const tp = useTranslations("platforms");
  const format = useFormatter();
  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border bg-card">
      <Link href={`/editor/${d.id}`} className="relative block overflow-hidden bg-white/[0.04]" style={{ aspectRatio: `${d.cover.width + DESIGN_CARD_PADDING * 2} / ${d.cover.height + DESIGN_CARD_PADDING * 2}` }}>
        <FitPreview page={d.cover} padding={DESIGN_CARD_PADDING} />
        <span className={`absolute left-2.5 top-2.5 rounded-md px-1.5 py-0.5 text-[11px] ${d.status === "SCHEDULED" ? "bg-primary text-primary-foreground" : "bg-black/70 text-white"}`}>
          {t(d.status === "SCHEDULED" ? "status.scheduled" : "status.draft")}
        </span>
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <p className="line-clamp-1 text-sm font-medium">{d.title}</p>
        {d.status === "SCHEDULED" && d.scheduledAt ? (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarClock className="size-3.5" />
            {format.dateTime(d.scheduledAt, DATE_FORMAT)} · {format.list(d.platforms.map((p) => publishPlatformLabel(tp, p)))}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">{t("lastEdited", { time: format.dateTime(d.updatedAt, DATE_FORMAT) })}</p>
        )}
        <div className="mt-auto flex items-center justify-between pt-1">
          <Link href={`/editor/${d.id}`} className="text-xs text-primary hover:underline">{t("continueEditing")}</Link>
          <DeleteDesignButton id={d.id} />
        </div>
      </div>
    </div>
  );
}
