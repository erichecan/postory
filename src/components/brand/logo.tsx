import Image from "next/image";
import Link from "next/link";

export function Logo({ href = "/dashboard" }: { href?: string }) {
  return (
    <Link href={href} aria-label="PoStory" className="flex shrink-0 items-center">
      <Image
        src="/brand/postory-wordmark-v2.png"
        alt=""
        width={959}
        height={258}
        unoptimized
        className="block h-auto shrink-0"
        style={{ width: "var(--ds-logo-width, 180px)" }}
      />
    </Link>
  );
}
