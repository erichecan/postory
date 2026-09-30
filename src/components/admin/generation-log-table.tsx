import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import type { listGenerationLog } from "@/lib/db/admin-generations";
import { cn } from "@/lib/utils";
import { usd } from "./generation-stats";

type Row = Awaited<ReturnType<typeof listGenerationLog>>["items"][number];

const STATUS_STYLE = { PENDING: "text-amber-300", SUCCEEDED: "text-emerald-300", FAILED: "text-destructive" } as const;

export async function GenerationLogTable({ items }: { items: Row[] }) {
  const [t, tg, format] = await Promise.all([getTranslations("admin.generations.log"), getTranslations("generations"), getFormatter()]);
  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full min-w-[760px] text-sm">
        <thead className="bg-muted/40 text-xs text-muted-foreground">
          <tr>
            {(["time", "user", "type", "status", "credits", "cost", "error"] as const).map((k) => (
              <th key={k} className={cn("px-4 py-2.5 font-medium", k === "credits" || k === "cost" ? "text-right" : "text-left")}>{t(k)}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {items.length === 0 && (
            <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">{t("empty")}</td></tr>
          )}
          {items.map((g) => (
            <tr key={g.id}>
              <td className="px-4 py-2.5 whitespace-nowrap tabular-nums text-muted-foreground">{format.dateTime(g.createdAt, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
              <td className="px-4 py-2.5">
                <Link href={`/admin/accounts/${g.user.id}`} className="hover:underline">{g.user.email ?? g.user.name}</Link>
              </td>
              <td className="px-4 py-2.5 whitespace-nowrap">{tg(`mode.${g.mode}`)} · {g.quality === "hd" ? "HD" : "STD"}</td>
              <td className={cn("px-4 py-2.5 whitespace-nowrap", STATUS_STYLE[g.status])}>{tg(`status.${g.status}`)}</td>
              <td className="px-4 py-2.5 text-right tabular-nums">{g.credits}</td>
              <td className="px-4 py-2.5 text-right tabular-nums">{g.costMicros === null ? "—" : usd(g.costMicros)}</td>
              <td className="max-w-48 truncate px-4 py-2.5 text-xs text-muted-foreground" title={g.error ?? undefined}>{g.error ?? ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
