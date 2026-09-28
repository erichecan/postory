import { LibraryFilters } from "@/components/templates/library-filters";
import { Pagination } from "@/components/templates/pagination";
import { TemplateCard } from "@/components/templates/template-card";
import { countTemplatesByPlatform, listTemplates } from "@/lib/db/templates";
import { isPlatformId } from "@/lib/platforms";

function one(v: string | string[] | undefined) {
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

export default async function TemplatesPage({ searchParams }: PageProps<"/templates">) {
  const sp = await searchParams;
  const rawPlatform = one(sp.platform);
  const platform = isPlatformId(rawPlatform) ? rawPlatform : undefined;
  const q = one(sp.q)?.slice(0, 64);
  const page = Math.max(1, Number.parseInt(one(sp.page) ?? "1", 10) || 1);

  const [{ items, total, pageCount }, counts] = await Promise.all([listTemplates({ platform, q, page }), countTemplatesByPlatform()]);
  const allCount = Object.values(counts).reduce((a, b) => a + b, 0);

  const makeHref = (p: number) => {
    const u = new URLSearchParams();
    if (platform) u.set("platform", platform);
    if (q) u.set("q", q);
    if (p > 1) u.set("page", String(p));
    const s = u.toString();
    return s ? `/templates?${s}` : "/templates";
  };

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6 px-4 py-8 sm:px-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">模板库</h1>
        <p className="mt-1 text-sm text-muted-foreground">挑一个喜欢的模板，换上你的店名、活动和微信，马上就能发。</p>
      </header>
      <LibraryFilters platform={platform} q={q} counts={counts} total={allCount} />
      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed py-20 text-center text-muted-foreground">没有找到匹配的模板，换个关键词试试。</div>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">共 {total} 个模板</p>
          <div className="columns-2 gap-5 sm:columns-3 lg:columns-4 xl:columns-5">
            {items.map((t, i) => (
              <TemplateCard key={t.id} t={t} priority={i < 5} />
            ))}
          </div>
          <Pagination page={page} pageCount={pageCount} makeHref={makeHref} />
        </>
      )}
    </div>
  );
}
