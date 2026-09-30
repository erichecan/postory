import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { GenerationCard } from "@/components/generations/generation-card";
import { Pagination } from "@/components/templates/pagination";
import { requireUser } from "@/lib/auth/session";
import { listOwnGenerations, reapStaleGenerations } from "@/lib/db/generations";

export default async function GenerationsPage({ searchParams }: PageProps<"/generations">) {
  const user = await requireUser();
  const { page } = await searchParams;
  const current = Math.max(1, Number.parseInt(typeof page === "string" ? page : "1", 10) || 1);
  await reapStaleGenerations(user.id);
  const [data, t] = await Promise.all([listOwnGenerations(user.id, current), getTranslations("generations")]);

  return (
    <div className="mx-auto flex max-w-[1080px] flex-col gap-6 px-4 py-10">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>
      {data.total === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-20 text-center">
          <p className="text-muted-foreground">{t("empty")}</p>
          <Link href="/create" className="text-primary hover:underline">{t("goCreate")}</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 items-start gap-3 md:grid-cols-3 lg:grid-cols-4">
          {data.items.map((g) => (
            <GenerationCard key={g.id} gen={g} />
          ))}
        </div>
      )}
      <Pagination page={current} pageCount={data.pageCount} makeHref={(p) => (p > 1 ? `/generations?page=${p}` : "/generations")} />
    </div>
  );
}
