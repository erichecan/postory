import Link from "next/link";
import { BRAND } from "@/lib/brand";

export function Logo({ href = "/calendar" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 text-[17px] font-semibold tracking-tight">
      <span className="grid size-7 place-items-center rounded-lg bg-white text-[15px] font-black italic text-black">P</span>
      <span>{BRAND.name}</span>
    </Link>
  );
}
