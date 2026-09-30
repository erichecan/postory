import { getTranslations } from "next-intl/server";
import { AdminSubnav } from "@/components/admin/admin-subnav";
import { GenerationLogTable } from "@/components/admin/generation-log-table";
import { GenerationStats } from "@/components/admin/generation-stats";
import { Pagination } from "@/components/templates/pagination";
import { dailyCostCapMicros } from "@/lib/ai/provider";
import { requireAdmin } from "@/lib/auth/session";
import { dailyGenerationStats, listGenerationLog } from "@/lib/db/admin-generations";

export default async function AdminGenerationsPage({ searchParams }: PageProps<"/admin/generations">) {
  await requireAdmin();
  const { page } = await searchParams;
  const current = Math.max(1, Number.parseInt(typeof page === "string" ? page : "1", 10) || 1);
  const [t, days, log] = await Promise.all([getTranslations("admin.generations"), dailyGenerationStats(), listGenerationLog(current)]);

  return (
    <div className="mx-auto flex max-w-[1080px] flex-col gap-8 px-4 py-10">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <AdminSubnav active="generations" />
      </header>
      <GenerationStats days={days} capMicros={dailyCostCapMicros()} />
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">{t("log.title")}</h2>
        <GenerationLogTable items={log.items} />
        <Pagination page={current} pageCount={log.pageCount} makeHref={(p) => (p > 1 ? `/admin/generations?page=${p}` : "/admin/generations")} />
      </section>
    </div>
  );
}
