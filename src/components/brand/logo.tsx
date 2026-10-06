import Link from "next/link";

export function Logo({ href = "/dashboard" }: { href?: string }) {
  return (
    <Link href={href} aria-label="PoStory" className="flex shrink-0 items-center">
      <span
        aria-hidden="true"
        className="block shrink-0 bg-no-repeat"
        style={{
          width: 134.4,
          height: 35,
          backgroundImage: 'url("/brand/postory-logo-source.png")',
          backgroundSize: "248.36px 124.18px",
          backgroundPosition: "-16.8px -41.16px",
        }}
      />
    </Link>
  );
}
