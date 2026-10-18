import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import type { AgencyClientOverview } from "@/lib/db/agency-access";

export async function PartnerClientsList({ clients }: { clients: AgencyClientOverview[] }) {
  const [t, format] = await Promise.all([getTranslations("partners.clients"), getFormatter()]);

  if (clients.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border bg-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-muted-foreground">
            <th className="py-2 px-3">{t("colClient")}</th>
            <th className="py-2 px-3">{t("colShop")}</th>
            <th className="py-2 px-3">{t("colPlatforms")}</th>
            <th className="py-2 px-3">{t("colContentThisMonth")}</th>
            <th className="py-2 px-3">{t("colGrantedAt")}</th>
            <th className="py-2 px-3" />
          </tr>
        </thead>
        <tbody>
          {clients.map((c) => (
            <tr key={c.clientUserId} className="border-t">
              <td className="py-2 px-3 font-medium">{c.clientName}</td>
              <td className="py-2 px-3">{c.shopName ?? t("noShop")}</td>
              <td className="py-2 px-3">{c.platforms.length > 0 ? c.platforms.join(", ") : t("noPlatforms")}</td>
              <td className="py-2 px-3">{c.contentCountThisMonth}</td>
              <td className="py-2 px-3 whitespace-nowrap">
                {format.dateTime(c.grantedAt, { year: "numeric", month: "short", day: "numeric" })}
              </td>
              <td className="py-2 px-3">
                <Link className="text-primary underline" href={`/partners/clients/${c.clientUserId}`}>
                  {t("view")}
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
