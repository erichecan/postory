import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, Play, Heart, MessageCircle } from "lucide-react";
import type { ReactNode } from "react";
export function Photo({
  name,
  src,
  alt = "",
  className = "",
  style,
}: {
  name?: string;
  src?: string | null;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  if (!name && !src)
    return (
      <div className={`ps-photo ps-no-photo ${className}`} style={style}>
        Image not provided
      </div>
    );
  return (
    <div className={`ps-photo ${className}`} style={style}>
      <Image
        src={src || `/visual/${name}.webp`}
        alt={alt}
        fill
        loading="eager"
        sizes="(max-width: 600px) 100vw, 50vw"
        unoptimized
      />
    </div>
  );
}
export function Platform({ name, size = 24 }: { name: string; size?: number }) {
  const p = name.toLowerCase();
  return (
    <span
      className={`ps-platform ps-platform-${p}`}
      style={{
        width: size,
        height: size,
        fontSize: p === "rednote" ? size * 0.28 : size * 0.68,
      }}
      title={p}
      aria-label={p}
    >
      {p === "instagram" ? (
        <svg
          width={size * 0.8}
          height={size * 0.8}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
        </svg>
      ) : p === "facebook" ? (
        <span
          style={{
            fontFamily: "Arial",
            fontWeight: 800,
            transform: "translateY(2px)",
          }}
        >
          f
        </span>
      ) : p === "tiktok" ? (
        "♪"
      ) : p === "youtube" ? (
        <Play size={size * 0.6} fill="white" />
      ) : p === "linkedin" ? (
        <span style={{ fontSize: size * 0.6 }}>in</span>
      ) : p === "pinterest" ? (
        "℗"
      ) : (
        "小红书"
      )}
    </span>
  );
}
export function Platforms({
  names = ["instagram", "facebook", "tiktok"],
}: {
  names?: string[];
}) {
  return (
    <div className="ps-platforms">
      {names.map((n) => (
        <Platform key={n} name={n} />
      ))}
    </div>
  );
}
export function CTA({
  children = "Book a Free Assessment",
  href = "/assessment",
  secondary = false,
  className = "",
}: {
  children?: ReactNode;
  href?: string;
  secondary?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`ps-button ${secondary ? "ps-button-secondary" : ""} ${className}`}
    >
      {children}
      <ArrowRight size={16} />
    </Link>
  );
}
export function Tag({ children }: { children: ReactNode }) {
  return <span className="ps-eyebrow">{children}</span>;
}
export function Checks({ items }: { items: string[] }) {
  return (
    <ul className="ps-checks">
      {items.map((s) => (
        <li key={s}>
          <span>
            <Check size={11} />
          </span>
          {s}
        </li>
      ))}
    </ul>
  );
}
export function SectionTitle({
  tag,
  title,
  body,
  action,
}: {
  tag?: string;
  title: ReactNode;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="ps-section-heading">
      <div>
        {tag && <Tag>{tag}</Tag>}
        <h2>{title}</h2>
        {body && <p>{body}</p>}
      </div>
      {action}
    </div>
  );
}
export function PostMockup({
  image = "beauty-1",
  platform = "instagram",
  caption = "Spring is the perfect time to refresh your look ✨",
  className = "",
}: {
  image?: string;
  platform?: string;
  caption?: string;
  className?: string;
}) {
  return (
    <div className={`ps-post-mock ${className}`}>
      <div className="ps-post-top">
        <Platform name={platform} size={22} />
        <span />
        <span>···</span>
      </div>
      <Photo name={image} />
      <div className="ps-post-icons">
        <Heart size={16} fill="#ff0086" stroke="#ff0086" />
        <MessageCircle size={16} />
        <Play size={14} />
      </div>
      <p>{caption}</p>
    </div>
  );
}
export function MonthPlan() {
  return (
    <div className="ps-month-plan">
      <strong>▦ &nbsp; March Content Plan</strong>
      <div className="ps-color-ticks">
        {Array.from({ length: 8 }, (_, i) => (
          <i key={i} />
        ))}
      </div>
      <b>12 posts this month</b>
      {[
        ["instagram", "5 Instagram posts"],
        ["tiktok", "3 TikTok videos"],
        ["facebook", "2 Facebook posts"],
        ["instagram", "2 Stories / Others"],
      ].map(([p, t]) => (
        <div key={t}>
          <Platform name={p} size={17} />
          {t}
        </div>
      ))}
    </div>
  );
}
