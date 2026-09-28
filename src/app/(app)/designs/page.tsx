import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { DesignsMasonry } from "@/components/designs/designs-masonry";
import { Pagination } from "@/components/templates/pagination";
import { requireUser } from "@/lib/auth/session";
import { listOwnDesigns, type DesignListItem } from "@/lib/db/designs";

async function Group({ title, hint, total, items, footer }: { title: string; hint: string; total: number; items: DesignListItem[]; footer?: React.ReactNode }) {
  const t = await getTranslations("designs");
  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold">{title} <span className="text-sm font-normal text-muted-foreground">{total}</span></h2>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed py-10 text-center text-sm text-muted-foreground">{t("empty")}</div>
      ) : (
        <DesignsMasonry items={items} />
      )}
      {footer}
    </section>
  );
}

export default async function DesignsPage({ searchParams }: PageProps<"/designs">) {
  const user = await requireUser();
  const { page } = await searchParams;
  const draftPage = Math.max(1, Number.parseInt(typeof page === "string" ? page : "1", 10) || 1);
  const [data, t] = await Promise.all([listOwnDesigns(user.id, draftPage), getTranslations("designs")]);

  return (
    <div className="mx-auto flex max-w-[1080px] flex-col gap-10 px-4 py-10">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>
      {data.scheduledTotal + data.draftTotal === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-20 text-center">
          <p className="text-muted-foreground">{t("emptyAll")}</p>
          <Link href="/templates" className="text-primary hover:underline">{t("goToTemplates")}</Link>
        </div>
      ) : (
        <>
          <Group title={t("scheduled")} hint={t("scheduledHint")} total={data.scheduledTotal} items={data.scheduled} />
          <Group
            title={t("drafts")}
            hint={t("draftsHint")}
            total={data.draftTotal}
            items={data.drafts}
            footer={<Pagination page={draftPage} pageCount={data.draftPageCount} makeHref={(p) => (p > 1 ? `/designs?page=${p}` : "/designs")} />}
          />
        </>
      )}
    </div>
  );
}
