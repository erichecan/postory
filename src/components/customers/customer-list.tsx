import { getFormatter, getTranslations } from "next-intl/server";
import type { EndCustomer } from "@/generated/prisma/client";
import { DeleteCustomerButton } from "./delete-customer-button";

export async function CustomerList({ items }: { items: EndCustomer[] }) {
  const [t, format] = await Promise.all([getTranslations("customers"), getFormatter()]);
  const columns = [t("columns.name"), t("columns.contact"), t("columns.birthday"), t("columns.lastVisit"), t("columns.createdAt"), t("columns.actions")];
  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full min-w-[720px] text-sm">
        <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
          <tr>{columns.map((h, i) => <th key={i} className="px-4 py-2.5 font-medium">{h}</th>)}</tr>
        </thead>
        <tbody>
          {items.map((c) => (
            <tr key={c.id} className="border-t">
              <td className="px-4 py-3">{c.name ?? t("noContact")}</td>
              <td className="px-4 py-3 text-muted-foreground">{[c.email, c.phone].filter(Boolean).join(" · ") || t("noContact")}</td>
              <td className="px-4 py-3 text-muted-foreground">{c.birthday ? format.dateTime(c.birthday, { dateStyle: "medium", timeZone: "UTC" }) : t("noContact")}</td>
              <td className="px-4 py-3 text-muted-foreground">{c.lastVisitAt ? format.dateTime(c.lastVisitAt, { dateStyle: "medium" }) : t("never")}</td>
              <td className="px-4 py-3 text-muted-foreground">{format.dateTime(c.createdAt, { dateStyle: "medium" })}</td>
              <td className="px-4 py-3 text-right"><DeleteCustomerButton id={c.id} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
