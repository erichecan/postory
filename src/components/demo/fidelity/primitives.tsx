"use client";

import type { CSSProperties, ReactNode } from "react";
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Menu, MoreHorizontal, Check, Heart, MessageCircle, Bookmark, Send, Wifi, BatteryFull, Signal, Home, Image as ImageIcon, CalendarDays, UserRound, Bell } from "lucide-react";

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
  return <>
    <Text x={sushi ? 85 : 68} y={24} w={100} size={28} weight={650}>9:41</Text>
    <Box x={665} y={30} w={144} h={31} className="fd-status"><Signal /><Wifi /><BatteryFull /></Box>
    {!landing && !workspace && <Button x={34} y={84} w={45} h={58} secondary small ariaLabel="返回" onClick={back} style={{ border: 0, background: "transparent", color: "#111" }}><ChevronLeft style={{width:unit(36),height:unit(36)}} /></Button>}
    <Photo name={`${industry}-logo${landing || workspace ? "-full" : ""}`} x={landing ? (sushi ? 68 : 38) : workspace ? 37 : sushi ? 124 : 276} y={landing ? 65 : workspace ? 83 : sushi ? 62 : 88} w={landing ? (sushi ? 423 : 395) : workspace ? 335 : sushi ? 382 : 291} h={landing ? (sushi ? 92 : 80) : workspace ? 65 : sushi ? 87 : 52} radius={0} style={{mixBlendMode:"multiply"}} />
    {workspace ? <><Button x={491} y={89} w={58} h={56} small secondary onClick={menu} ariaLabel="通知" style={{ background: "transparent", border: 0, color: "#111" }}><Bell /></Button><Box x={570} y={84} w={61} h={61} className="fd-avatar">L</Box><Button x={642} y={91} w={177} h={49} secondary small onClick={menu} style={{ border: 0, background: "transparent", color: "#111", fontSize: unit(20) }}>Lumi Nail Studio⌄</Button></> : <Button x={landing ? 770 : 752} y={84} w={60} h={62} secondary small ariaLabel="菜单" onClick={menu} style={{ border: 0, background: "transparent", color: "#111" }}>{sushi || landing ? <Menu style={{width:unit(40),height:unit(40)}} /> : <MoreHorizontal style={{width:unit(36),height:unit(36)}} />}</Button>}
  </>;
}
export function Steps({ industry, current }: { industry: "nails" | "sushi"; current: number }) {
  if (industry === "sushi") return <><Box x={70} y={188} w={565} h={13} className="fd-progress"><div style={{ width: `${current * 16.67 + 16.67}%` }} /></Box><Text x={674} y={179} w={148} size={22} color="#53616b">Step {current + 1} of 6</Text></>;
  return <>{["上传作品", "选择模板", "编辑内容", "导出成品"].map((label, i) => <span key={label}>
    {i < 3 && <Box x={150 + 202 * i} y={188} w={151} h={3} style={{ background: i < current ? "var(--fd-primary)" : "#e5e1e3" }} />}
    <Box x={103 + 202 * i} y={169} w={42} h={42} className={`fd-step ${i <= current ? "fd-active" : ""}`}>{i < current ? <Check /> : i + 1}</Box>
    <Text x={76 + 202 * i} y={219} w={102} size={23} center color={i <= current ? "var(--fd-primary)" : "#999"}>{label}</Text>
  </span>)}</>;
}
export function BottomNav({ active, go }: { active: number; go: (page: string) => void }) {
  const icons = [Home, ImageIcon, CalendarDays, UserRound];
  return <><Panel x={0} y={1680} w={853} h={164} style={{ borderRadius: `${unit(32)} ${unit(32)} 0 0`, background: "#ffffffc9" }} />{["首页", "我的内容", "发布日历", "我的"].map((label, i) => { const Icon = icons[i]; return <Button key={label} x={36 + i * 212} y={1692} w={147} h={88} secondary small onClick={() => go(["dashboard", "content", "calendar", "accounts"][i])} style={{ border: 0, background: "transparent", color: active === i ? "var(--fd-primary)" : "#6d747c", flexDirection: "column", gap: unit(5), fontSize: unit(21) }}><Icon style={{ width: unit(42), height: unit(42) }} />{label}</Button>; })}<Box x={283} y={1819} w={287} h={10} style={{ background: "#0a0a0a", borderRadius: unit(10) }} /></>;
}
export function SocialActions({ x, y, w, count = "542", color = "#101018" }: { x: number; y: number; w: number; count?: string; color?: string }) {
  return <Box x={x} y={y} w={w} h={39} className="fd-social-actions" style={{ color }}><Heart fill="#ff2859" color="#ff2859" /><span>{count}</span><MessageCircle /><span>28</span><Send /><Bookmark style={{ marginLeft: "auto" }} /></Box>;
}
export { ArrowLeft, ArrowRight, Check, ChevronLeft, ChevronRight };
