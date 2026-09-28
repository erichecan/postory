import Link from "next/link";
import { cn } from "@/lib/utils";

export function Pagination({ page, pageCount, makeHref }: { page: number; pageCount: number; makeHref: (p: number) => string }) {
  if (pageCount <= 1) return null;
  const pages = Array.from({ length: pageCount }, (_, i) => i + 1);
  const item = "grid h-8 min-w-8 place-items-center rounded-md px-2 text-sm";
  return (
    <nav className="flex flex-wrap items-center justify-center gap-1" aria-label="分页">
      {page > 1 && <Link className={cn(item, "hover:bg-accent")} href={makeHref(page - 1)}>上一页</Link>}
      {pages.map((p) => (
        <Link key={p} href={makeHref(p)} className={cn(item, p === page ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent")}>
          {p}
        </Link>
      ))}
      {page < pageCount && <Link className={cn(item, "hover:bg-accent")} href={makeHref(page + 1)}>下一页</Link>}
    </nav>
  );
}
