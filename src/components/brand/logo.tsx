import Link from "next/link";

export function Logo({ href = "/templates" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 font-semibold tracking-tight">
      <span className="grid size-7 place-items-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">社</span>
      <span>社媒工坊</span>
    </Link>
  );
}
