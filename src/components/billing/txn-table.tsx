import { getFormatter, getTranslations } from "next-intl/server";
import { cn } from "@/lib/utils";
import type { TxnView } from "@/types/commerce";

export async function TxnTable({ txns, title }: { txns: TxnView[]; title?: string }) {
  const [t, format] = await Promise.all([getTranslations("billing.txns"), getFormatter()]);

  function label(x: TxnView) {
    if (x.kind === "DEBIT" && x.charge) return t(`charge.${x.charge}`);
    if (x.kind === "REFUND" && x.charge) return t("refund", { item: t(`charge.${x.charge}`) });
    if (x.kind === "GRANT" && x.source) return t(`source.${x.source}`);
    if (x.kind === "EXPIRE") return t("expire");
    return x.note ?? t("adjust");
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-semibold">{title ?? t("title")}</h2>
      {txns.length === 0 ? (
        <div className="rounded-xl border border-dashed py-10 text-center text-sm text-muted-foreground">{t("empty")}</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 font-medium">{t("columns.time")}</th>
                <th className="px-4 py-2.5 font-medium">{t("columns.item")}</th>
                <th className="px-4 py-2.5 text-right font-medium">{t("columns.change")}</th>
              </tr>
            </thead>
            <tbody>
              {txns.map((x) => (
                <tr key={x.id} className="border-t">
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{format.dateTime(x.createdAt, { dateStyle: "short", timeStyle: "short" })}</td>
                  <td className="px-4 py-3">{label(x)}</td>
                  <td className={cn("px-4 py-3 text-right font-medium tabular-nums", x.delta > 0 ? "text-emerald-400" : "text-foreground")}>
                    {x.delta > 0 ? `+${x.delta}` : x.delta}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
