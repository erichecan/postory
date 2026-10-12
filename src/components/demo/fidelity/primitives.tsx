"use client";

import type { CSSProperties, ReactNode } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Check, Heart, MessageCircle, Bookmark, Send, Home, Image as ImageIcon, CalendarDays, UserRound, Bell } from "lucide-react";

export const unit = (v: number) => `calc(${v / 8.53}cqw * var(--fd-reference-scale, 1))`;
export function position(x: number, y: number, w: number, h?: number): CSSProperties {
  return { position: "absolute", left: unit(x), top: unit(y), width: unit(w), ...(h === undefined ? {} : { height: unit(h) }) };
}
export function Box({ x, y, w, h, children, className = "", style }: { x: number; y: number; w: number; h?: number; children?: ReactNode; className?: string; style?: CSSProperties }) {
  return <div className={className} style={{ ...position(x, y, w, h), ...style }}>{children}</div>;
}
export function Text({ x, y, w, size = 26, weight = 400, color, center = false, children, style }: { x: number; y: number; w: number; size?: number; weight?: number; color?: string; center?: boolean; children: ReactNode; style?: CSSProperties }) {
  return <Box x={x} y={y} w={w} style={{ fontSize: unit(size), fontWeight: weight, color, textAlign: center ? "center" : "left", lineHeight: 1.38, whiteSpace: "pre-line", ...style }}>{children}</Box>;
}
export function Photo({ name, src, x, y, w, h, radius = 20, style, alt = "" }: { name?: string; src?: string; x: number; y: number; w: number; h: number; radius?: number; style?: CSSProperties; alt?: string }) {
  // Reference artwork and photography are assets; all surrounding UI is live DOM.
  // eslint-disable-next-line @next/next/no-img-element
  return <img alt={alt} src={src ?? `/demo/fidelity/${name}.webp`} draggable={false} style={{ ...position(x, y, w, h), objectFit: "cover", borderRadius: unit(radius), ...style }} />;
}
export function Button({ x, y, w, h = 94, children, onClick, secondary = false, small = false, disabled = false, ariaLabel, style }: { x: number; y: number; w: number; h?: number; children: ReactNode; onClick?: () => void; secondary?: boolean; small?: boolean; disabled?: boolean; ariaLabel?: string; style?: CSSProperties }) {
  return <button type="button" aria-label={ariaLabel} disabled={disabled} onClick={onClick} className={`fd-button ${secondary ? "fd-secondary" : ""} ${small ? "fd-small" : ""}`} style={{ ...position(x, y, w, h), ...style }}>{children}</button>;
}
export function Panel({ x, y, w, h, children, tint = false, style }: { x: number; y: number; w: number; h: number; children?: ReactNode; tint?: boolean; style?: CSSProperties }) {
  return <Box x={x} y={y} w={w} h={h} className={`fd-panel ${tint ? "fd-tint" : ""}`} style={style}>{children}</Box>;
}
export function Platform({ index = 0, size = 46 }: { index?: number; size?: number }) {
  return <span className={`fd-platform fd-platform-${index}`} style={{ width: unit(size), height: unit(size), background: "transparent", overflow: "hidden" }}>
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={`/demo/fidelity/platform-${index}.webp`} alt={["Instagram", "Facebook", "TikTok", "小红书"][index]} style={{width:"100%",height:"100%",objectFit:"fill",borderRadius:index===1?"50%":"25%"}} />
  </span>;
}
export function HeartDoodle({ x, y, w = 65, color = "var(--fd-primary)" }: { x: number; y: number; w?: number; color?: string }) {
  return <Box x={x} y={y} w={w} h={w * 1.3}><svg viewBox="0 0 70 90" fill="none" aria-hidden="true"><path d="M17 70C11 51 5 21 16 8C29-7 39 23 30 45C44 26 66 12 64 28C62 46 30 67 8 82" stroke={color} strokeWidth="4" strokeLinecap="round" /></svg></Box>;
}
export function Header({ industry, landing = false, workspace = false, back, menu }: { industry: "nails" | "sushi"; landing?: boolean; workspace?: boolean; back: () => void; menu: () => void }) {
  const sushi = industry === "sushi";
  const logoX = sushi ? 68 : 38;
  const logoY = 43;
  const logoWidth = sushi ? 240 : 205;
  const logoHeight = logoWidth * 258 / 959;
  return <>
    {!landing && !workspace && <Button x={34} y={110} w={45} h={58} secondary small ariaLabel="返回" onClick={back} style={{ border: 0, background: "transparent", color: "#111" }}><ChevronLeft style={{width:unit(36),height:unit(36)}} /></Button>}
    <Image src="/brand/postory-wordmark-v2.png" alt="PoStory" width={959} height={258} priority unoptimized style={{ ...position(logoX, logoY, logoWidth, logoHeight), objectFit: "contain" }} />
    {workspace && <><Button x={491} y={89} w={58} h={56} small secondary onClick={menu} ariaLabel="通知" style={{ background: "transparent", border: 0, color: "#111" }}><Bell /></Button><Box x={570} y={84} w={61} h={61} className="fd-avatar">L</Box><Button x={642} y={91} w={177} h={49} secondary small onClick={menu} style={{ border: 0, background: "transparent", color: "#111", fontSize: unit(20) }}>Lumi Nail Studio⌄</Button></>}
  </>;
}
export function Steps({ current, onNavigate }: { current: number; onNavigate: (page: string) => void }) {
  const pages = ["upload", "edit", "export"];
  const labels = ["上传作品", "预约与文案", "导出成品"];
  return <>{labels.map((label, i) => {
    const circleX = 151 + 270 * i;
    const labelX = circleX - 31;
    return <span key={label}>
      {i < labels.length - 1 && <Box x={circleX + 42} y={129} w={228} h={3} style={{ background: i < current ? "var(--fd-primary)" : "#e5e1e3" }} />}
      <button type="button" onClick={() => onNavigate(pages[i])} aria-label={`前往步骤：${label}`} aria-current={i === current ? "step" : undefined} style={{ ...position(labelX, 110, 105, 78), border: 0, padding: 0, background: "transparent", color: i <= current ? "var(--fd-primary)" : "#999", font: "inherit", cursor: "pointer" }}>
        <span className={`fd-step ${i <= current ? "fd-active" : ""}`} style={{ position: "absolute", left: unit(31), top: 0, width: unit(42), height: unit(42) }}>{i < current ? <Check /> : i + 1}</span>
        <span style={{ position: "absolute", insetInline: 0, top: unit(47), fontSize: unit(21), lineHeight: 1.38, textAlign: "center", whiteSpace: "nowrap" }}>{label}</span>
      </button>
    </span>;
  })}</>;
}
export function BottomNav({ active, go }: { active: number; go: (page: string) => void }) {
  const icons = [Home, ImageIcon, CalendarDays, UserRound];
  return <><Panel x={0} y={1680} w={853} h={164} style={{ borderRadius: `${unit(32)} ${unit(32)} 0 0`, background: "#ffffffc9" }} />{["首页", "我的内容", "发布日历", "我的"].map((label, i) => { const Icon = icons[i]; return <Button key={label} x={36 + i * 212} y={1692} w={147} h={88} secondary small onClick={() => go(["dashboard", "content", "calendar", "accounts"][i])} style={{ border: 0, background: "transparent", color: active === i ? "var(--fd-primary)" : "#6d747c", flexDirection: "column", gap: unit(5), fontSize: unit(21) }}><Icon style={{ width: unit(42), height: unit(42) }} />{label}</Button>; })}</>;
}
export function SocialActions({ x, y, w, count = "542", color = "#101018" }: { x: number; y: number; w: number; count?: string; color?: string }) {
  return <Box x={x} y={y} w={w} h={39} className="fd-social-actions" style={{ color }}><Heart fill="#ff2859" color="#ff2859" /><span>{count}</span><MessageCircle /><span>28</span><Send /><Bookmark style={{ marginLeft: "auto" }} /></Box>;
}
export { ArrowLeft, ArrowRight, Check, ChevronLeft, ChevronRight };
