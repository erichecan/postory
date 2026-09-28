import Link from "next/link";
import { DesignCard, type DesignCardData } from "@/components/designs/design-card";
import { requireUser } from "@/lib/auth/session";
import { listOwnDesigns } from "@/lib/db/designs";

function Group({ title, hint, items }: { title: string; hint: string; items: DesignCardData[] }) {
  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold">{title} <span className="text-sm font-normal text-muted-foreground">{items.length}</span></h2>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed py-10 text-center text-sm text-muted-foreground">暂无</div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
          {items.map((d) => <DesignCard key={d.id} d={d} />)}
        </div>
      )}
    </section>
  );
}

export default async function DesignsPage() {
  const user = await requireUser();
  const designs = await listOwnDesigns(user.id);
  const scheduled = designs
    .filter((d) => d.status === "SCHEDULED")
    .sort((a, b) => (a.scheduledAt?.getTime() ?? 0) - (b.scheduledAt?.getTime() ?? 0));
  const drafts = designs.filter((d) => d.status === "DRAFT");

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-10 px-4 py-8 sm:px-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">我的作品</h1>
        <p className="mt-1 text-sm text-muted-foreground">编辑过的模板都在这里；设定了发布时间的会进入发布计划。</p>
      </header>
      {designs.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-20 text-center">
          <p className="text-muted-foreground">还没有作品。</p>
          <Link href="/templates" className="text-primary hover:underline">去模板库挑一个 →</Link>
        </div>
      ) : (
        <>
          <Group title="发布计划" hint="按发布时间先后排列" items={scheduled} />
          <Group title="草稿" hint="最近编辑的在前" items={drafts} />
        </>
      )}
    </div>
  );
}
