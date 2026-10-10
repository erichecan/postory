"use client";

import type { IndustryId } from "@/lib/demo/contracts";

export function Artwork({ industry, variant = "export", custom = false, photo, title, caption, styleIndex = 0 }: { industry: IndustryId; variant?: string; custom?: boolean; photo?: string; title: string; caption: string; styleIndex?: number }) {
  const name = `${industry}-art-${variant}`;
  const template = `${industry}-template-${styleIndex}`;
  return <div className={`fd-artwork fd-art-${industry}`} style={{ background: industry === "sushi" ? "#21130b" : "#f8e6df" }}>
    {!custom ? <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/demo/fidelity/${styleIndex === 0 ? name : template}.webp`} alt={`${industry === "nails" ? "美甲" : "寿司"}示例海报`} />
    </> : industry === "nails" ? <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="fd-custom-photo" src={photo} alt="你的美甲照片" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="fd-custom-photo-small" src={photo} alt="" />
      <div className="fd-live-title">{["Autumn\nNail Inspo", "Nail\nAppointment", "Autumn\nNail Inspo", "New\nDesigns", "Halloween\nNail Ideas", "Special\nOffer"][styleIndex]}</div>
      <div style={{ position: "absolute", top: "39%", left: "5%", width: "40%", color: "#fff", background: "#b26d6a", borderRadius: "8cqw", padding: "2% 3%", fontSize: "4cqw", textAlign: "center" }}>{title}</div>
      <div style={{ position: "absolute", top: "50%", left: "6%", color: "#7c443f", lineHeight: 1.7, fontSize: "4cqw" }}>♡ 温柔显白<br />♡ 精致百搭<br />♡ 预约从速</div>
      <div className="fd-live-subtitle" style={{fontSize:"3.6cqw",lineHeight:1.75}}>本周可预约时间 ♡<br/>10/24 周五　14:00<br/>10/25 周六　11:00<br/>10/26 周日　16:00</div>
    </> : <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photo} alt="你的寿司照片" />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(130deg,#130a05bf,transparent 65%)" }} />
      <div className="fd-live-title" style={{ color: styleIndex === 2 ? "#ff9a4b" : "#fff" }}>{title}</div>
      <div className="fd-live-subtitle">{caption}</div>
      <svg viewBox="0 0 100 20" style={{position:"absolute",bottom:0,left:0,width:"45%",height:"17%",opacity:.7}} fill="none" stroke="#e7aa67" strokeWidth=".5"><path d="M0 20Q10 0 20 20Q30 0 40 20Q50 0 60 20Q70 0 80 20M0 15Q10 -5 20 15Q30 -5 40 15Q50 -5 60 15Q70 -5 80 15M0 10Q10 -10 20 10Q30 -10 40 10Q50 -10 60 10Q70 -10 80 10" /></svg>
    </>}
  </div>;
}
