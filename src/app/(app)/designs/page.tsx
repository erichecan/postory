import Link from "next/link";
import { DesignCard } from "@/components/designs/design-card";
import { Pagination } from "@/components/templates/pagination";
import { requireUser } from "@/lib/auth/session";
import { listOwnDesigns, type DesignListItem } from "@/lib/db/designs";

function Group({ title, hint, total, items, footer }: { title: string; hint: string; total: number; items: DesignListItem[]; footer?: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold">{title} <span className="text-sm font-normal text-muted-foreground">{total}</span></h2>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed py-10 text-center text-sm text-muted-foreground">暂无</div>
      ) : (
        <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
          {items.map((d) => <DesignCard key={d.id} d={d} />)}
        </div>
      )}
      {footer}
    </section>
  );
}

export default async function DesignsPage({ searchParams }: PageProps<"/designs">) {
  const user = await requireUser();
  const { page } = await searchParams;
  const draftPage = Math.max(1, Number.parseInt(typeof page === "string" ? page : "1", 10) || 1);
  const data = await listOwnDesigns(user.id, draftPage);

  return (
    <div className="mx-auto flex max-w-[1080px] flex-col gap-10 px-4 py-10">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">我的作品</h1>
        <p className="mt-1 text-sm text-muted-foreground">编辑过的模板都在这里；设定了发布时间的会进入发布计划。</p>
      </header>
      {data.scheduledTotal + data.draftTotal === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-20 text-center">
          <p className="text-muted-foreground">还没有作品。</p>
          <Link href="/templates" className="text-primary hover:underline">去模板库挑一个 →</Link>
        </div>
      ) : (
        <>
          <Group title="发布计划" hint="按发布时间先后排列，显示最近 24 条" total={data.scheduledTotal} items={data.scheduled} />
          <Group
            title="草稿"
            hint="最近编辑的在前"
            total={data.draftTotal}
            items={data.drafts}
            footer={<Pagination page={draftPage} pageCount={data.draftPageCount} makeHref={(p) => (p > 1 ? `/designs?page=${p}` : "/designs")} />}
          />
        </>
      )}
    </div>
  );
}
