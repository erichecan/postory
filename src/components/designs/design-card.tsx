import Link from "next/link";
import { CalendarClock } from "lucide-react";
import { FitPreview } from "@/components/canvas/fit-preview";
import type { DesignPage } from "@/types/design";
import { DeleteDesignButton } from "./delete-design-button";

export type DesignCardData = {
  id: string;
  title: string;
  status: "DRAFT" | "SCHEDULED";
  platforms: string[];
  scheduledAt: Date | null;
  updatedAt: Date;
  cover: DesignPage;
};

const fmt = new Intl.DateTimeFormat("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Shanghai" });

export function DesignCard({ d }: { d: DesignCardData }) {
  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border bg-card">
      <Link href={`/editor/${d.id}`} className="relative block aspect-[4/3] overflow-hidden bg-black/30">
        <FitPreview page={d.cover} />
        <span className={`absolute left-2.5 top-2.5 rounded-md px-1.5 py-0.5 text-[11px] ${d.status === "SCHEDULED" ? "bg-primary text-primary-foreground" : "bg-black/70 text-white"}`}>
          {d.status === "SCHEDULED" ? "待发布" : "草稿"}
        </span>
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <p className="line-clamp-1 text-sm font-medium">{d.title}</p>
        {d.status === "SCHEDULED" && d.scheduledAt ? (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarClock className="size-3.5" />
            {fmt.format(d.scheduledAt)} · {d.platforms.join("、")}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">最后编辑 {fmt.format(d.updatedAt)}</p>
        )}
        <div className="mt-auto flex items-center justify-between pt-1">
          <Link href={`/editor/${d.id}`} className="text-xs text-primary hover:underline">继续编辑</Link>
          <DeleteDesignButton id={d.id} />
        </div>
      </div>
    </div>
  );
}
