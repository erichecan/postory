import Link from "next/link";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import type { CustomerListItem } from "@/lib/db/admin-customers";
import { tierName } from "@/lib/db/admin-customers";
import { cn } from "@/lib/utils";
import { ToggleUserButton } from "./toggle-user-button";

const STATUS_STYLE: Record<string, string> = {
  ACTIVE: "text-emerald-400",
  PENDING_PAYMENT: "text-amber-300",
  PAST_DUE: "text-destructive",
};

export async function CustomerTable({ items }: { items: CustomerListItem[] }) {
  const [t, tb, format, locale] = await Promise.all([getTranslations("admin"), getTranslations("billing.plan.status"), getFormatter(), getLocale()]);
  const columns = [t("columns.name"), t("columns.contact"), t("columns.plan"), t("columns.balance"), t("columns.designs"), t("columns.createdAt"), t("columns.status"), ""];
  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full min-w-[860px] text-sm">
        <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
          <tr>{columns.map((h, i) => <th key={i} className="px-4 py-2.5 font-medium">{h}</th>)}</tr>
        </thead>
        <tbody>
          {items.map((u) => (
            <tr key={u.id} className="border-t">
              <td className="px-4 py-3">
                <Link href={`/admin/accounts/${u.id}`} className="hover:text-primary hover:underline">{u.name}</Link>
                {u.role === "ADMIN" && <span className="ml-2 rounded bg-primary/15 px-1.5 py-0.5 text-[11px] text-primary">{t("adminBadge")}</span>}
              </td>
              <td className="px-4 py-3 text-muted-foreground">{u.email ?? u.phone}</td>
              <td className="px-4 py-3">
                {u.plan ? (
                  <span className="flex flex-col">
                    <span>{tierName(u.plan.tier, locale)}</span>
                    <span className={cn("text-xs", STATUS_STYLE[u.plan.status] ?? "text-muted-foreground")}>{tb(u.plan.status)}</span>
                  </span>
                ) : (
                  <span className="text-muted-foreground">{t("planNone")}</span>
                )}
              </td>
              <td className="px-4 py-3 tabular-nums">{u.balance}</td>
              <td className="px-4 py-3 tabular-nums">{u._count.designs}</td>
              <td className="px-4 py-3 text-muted-foreground">{format.dateTime(u.createdAt, { dateStyle: "medium" })}</td>
              <td className="px-4 py-3">{u.disabled ? <span className="text-destructive">{t("status.disabled")}</span> : <span className="text-emerald-400">{t("status.active")}</span>}</td>
              <td className="px-4 py-3 text-right whitespace-nowrap">
                <Link href={`/admin/accounts/${u.id}`} className="mr-2 rounded-md border px-2.5 py-1 text-xs hover:bg-accent">{t("detail")}</Link>
                {u.role !== "ADMIN" && <ToggleUserButton id={u.id} disabled={u.disabled} />}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
