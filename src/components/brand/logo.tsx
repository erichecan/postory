import Image from "next/image";
import Link from "next/link";

export function Logo({ href = "/calendar" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2">
      <Image src="/brand/logo-mark.png" alt="" width={28} height={28} className="size-7 shrink-0" priority />
      <span className="text-[19px] font-bold tracking-tight">
        <span style={{ color: "var(--brand-pink)" }}>Po</span>
        <span style={{ color: "var(--brand-orange)" }}>Story</span>
      </span>
    </Link>
  );
}
