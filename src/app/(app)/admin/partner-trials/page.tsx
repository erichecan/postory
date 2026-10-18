import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { AdminSubnav } from "@/components/admin/admin-subnav";
import { requireAdmin } from "@/lib/auth/session";
import { listTrialRequests } from "@/lib/db/partner-trials";

export default async function PartnerTrialsPage() {
  await requireAdmin();
  const [t, tv, format, items] = await Promise.all([
    getTranslations("admin.partnerTrials"),
    getTranslations("partners.view"),
    getFormatter(),
    listTrialRequests(),
  ]);

  return (
    <div className="mx-auto flex max-w-[1080px] flex-col gap-8 px-4 py-10">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("subtitle", { count: items.length })}</p>
        </div>
        <AdminSubnav active="partnerTrials" />
      </header>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 font-medium">{t("colClient")}</th>
                <th className="px-4 py-2.5 font-medium">{t("colAgency")}</th>
                <th className="px-4 py-2.5 font-medium">{t("colStatus")}</th>
                <th className="px-4 py-2.5 font-medium">{t("colCreatedAt")}</th>
                <th className="px-4 py-2.5 font-medium" />
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="px-4 py-3 font-medium">{item.clientBrandName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{item.agencyName}</td>
                  <td className="px-4 py-3">{tv(`status.${item.status}`)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    {format.dateTime(item.createdAt, { year: "numeric", month: "short", day: "numeric" })}
                  </td>
                  <td className="px-4 py-3">
                    <Link className="text-primary hover:underline" href={`/admin/partner-trials/${item.id}`}>
                      {t("view")}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
