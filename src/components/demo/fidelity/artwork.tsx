"use client";

import type { IndustryId } from "@/lib/demo/contracts";

export function Artwork({ industry, variant = "export", custom = false, photo, title, caption, styleIndex = 0 }: { industry: IndustryId; variant?: string; custom?: boolean; photo?: string; title: string; caption: string; styleIndex?: number }) {
  const name = `${industry}-art-${variant}`;
  const template = `${industry}-template-${styleIndex}`;
  const titles = ["Daily Diary", "Nail Appointment", "Autumn Nail Inspo", "New Designs", "Halloween Nail Ideas", "Special Offer"];
  return <div className={`fd-artwork fd-art-${industry} fd-theme-${styleIndex}`} style={{ background: industry === "sushi" ? "#21130b" : "#f8e6df" }}>
    {!custom ? <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/demo/fidelity/${styleIndex === 0 ? name : template}.webp`} alt={`${industry === "nails" ? "美甲" : "寿司"}示例海报`} />
    </> : industry === "nails" ? <>
      <img className="fd-custom-photo" src={photo} alt="你的美甲照片" />
      {styleIndex === 3 && <img className="fd-custom-photo-small" src={photo} alt="" />}
      {styleIndex === 4 && <div className="fd-nails-shade" />}
      <div className="fd-live-title">{styleIndex === 4 ? "HALLOWEEN" : titles[styleIndex]}</div>
      <div className="fd-nails-heading">{title}</div>
      {styleIndex === 1 ? <div className="fd-nails-dates">本周可预约时间<br/>周五 · 14:00<br/>周六 · 11:00</div> : null}
      {styleIndex === 2 ? <div className="fd-nails-season">AUTUMN · NEW SET</div> : null}
      {styleIndex === 4 ? <div className="fd-nails-holiday">✦　限定节日款　✦</div> : null}
      {styleIndex === 5 ? <div className="fd-nails-offer">新款上线 · 活动详情请咨询</div> : null}
      {styleIndex !== 1 && <div className="fd-live-subtitle">{caption}</div>}
    </> : styleIndex === 2 ? <>
      {/* Keep the selected New Menu artwork intact and replace only its hero photo. */}
      <img src="/demo/fidelity/sushi-template-2.webp" alt="新品上市寿司模板" />
      <img className="fd-sushi-photo fd-sushi-photo-template" src={photo} alt="你的寿司照片" />
      <div className="fd-sushi-mark" aria-hidden="true" />
    </> : <>
      <img className="fd-sushi-photo" src={photo} alt="你的寿司照片" />
      <div className="fd-sushi-shade" />
      {styleIndex === 0 ? <div className="fd-sushi-ornament" aria-hidden="true">✳</div> : null}
      {styleIndex === 1 ? <div className="fd-sushi-badge fd-sushi-badge-round">套餐推荐</div> : null}
      {styleIndex === 2 ? <div className="fd-sushi-badge fd-sushi-badge-new">NEW MENU</div> : null}
      {styleIndex === 3 ? <div className="fd-sushi-badge fd-sushi-badge-party">分享拼盘 · 欢聚时刻</div> : null}
      {styleIndex === 4 ? <div className="fd-sushi-badge fd-sushi-badge-dine">餐厅环境 · 欢迎光临</div> : null}
      {styleIndex > 0 ? <div className="fd-sushi-mark" aria-hidden="true" /> : null}
      <div className="fd-live-title">
        {styleIndex === 5 ? title.split("\n").map((line, index) => <span key={`${index}-${line}`} className={index === 1 ? "fd-sushi-title-accent" : index > 1 ? "fd-sushi-title-muted" : ""}>{line}</span>) : title}
      </div>
      <div className="fd-live-subtitle">{caption}</div>
    </>}
  </div>;
}
