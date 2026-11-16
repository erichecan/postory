"use client";

import { useMemo, useState, type PointerEvent as ReactPointerEvent } from "react";
import { GripVertical, ImagePlus, LoaderCircle, RefreshCw, ShieldCheck } from "lucide-react";
import Image from "next/image";

export type MarketingCalendarItem = {
  id: string; date: string; platform: string; headline: string; objective: string;
  copy: string; callToAction: string; visualDirection: string;
  imageDataUrl?: string; imageUrl?: string; imageProvider?: string; imageStatus?: "generating" | "ready" | "failed"; status: "草稿" | "待审核" | "待发布" | "已发布";
};
const platforms = ["Instagram", "Facebook", "TikTok", "小红书"];
const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

export function MarketingCalendar({ items, onMove, onReplace, onGenerateImage, onApprove, busyId }: {
  items: MarketingCalendarItem[]; onMove: (id: string, date: string) => void;
  onReplace: (id: string) => void; onGenerateImage: (id: string) => void;
  onApprove: (id: string) => void; busyId?: string | null;
}) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  function startTouchDrag(event: ReactPointerEvent<HTMLButtonElement>, item: MarketingCalendarItem) {
    if (event.pointerType === "mouse" || item.status === "已发布") return;
    event.preventDefault();
    const startX = event.clientX;
    const startY = event.clientY;
    let moved = false;
    const cleanup = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("pointercancel", cleanup);
    };
    const move = (pointer: PointerEvent) => {
      if (!moved && Math.hypot(pointer.clientX - startX, pointer.clientY - startY) > 8) {
        moved = true;
        setDraggedId(item.id);
      }
    };
    const finish = (pointer: PointerEvent) => {
      if (moved) {
        const destination = document.elementFromPoint(pointer.clientX, pointer.clientY)?.closest<HTMLElement>("[data-calendar-date]")?.dataset.calendarDate;
        if (destination && destination !== item.date) onMove(item.id, destination);
      }
      setDraggedId(null);
      cleanup();
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", finish);
    window.addEventListener("pointercancel", cleanup);
  }
  const months = useMemo(() => {
    const dates = items.map((item) => item.date).filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(date)).sort();
    if (!dates.length) return [];
    const first = new Date(`${dates[0]}T12:00:00`); const last = new Date(`${dates[dates.length - 1]}T12:00:00`);
    const result: Array<{ key: string; label: string; cells: Array<string | null> }> = [];
    const cursor = new Date(first.getFullYear(), first.getMonth(), 1, 12); const lastMonth = new Date(last.getFullYear(), last.getMonth(), 1, 12);
    while (cursor <= lastMonth && result.length < 4) {
      const year = cursor.getFullYear(); const month = cursor.getMonth();
      const cells: Array<string | null> = Array.from({ length: new Date(year, month, 1, 12).getDay() }, () => null);
      const count = new Date(year, month + 1, 0, 12).getDate();
      for (let day = 1; day <= count; day++) cells.push(`${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
      while (cells.length % 7) cells.push(null);
      result.push({ key: `${year}-${month}`, label: new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "long" }).format(cursor), cells });
      cursor.setMonth(cursor.getMonth() + 1);
    }
    return result;
  }, [items]);
  const byDate = useMemo(() => {
    const grouped = new Map<string, MarketingCalendarItem[]>();
    items.forEach((item) => grouped.set(item.date, [...(grouped.get(item.date) ?? []), item]));
    return grouped;
  }, [items]);
  return (
    <div className="ps-marketing-calendar">
      <p className="ps-calendar-queue-note"><ShieldCheck size={15} />拖动内容卡片左上角的把手，到目标日期格即可改期。审核后会进入待发布状态；自动发布仍需连接社媒账号和平台接口。</p>
      {months.map((month) => (
        <section className="ps-month-calendar" key={month.key}>
          <h3>{month.label}</h3>
          <div className="ps-month-grid">
            <div className="ps-month-weekdays">{weekdays.map((day) => <span key={day}>{day}</span>)}</div>
            <div className="ps-month-days">
              {month.cells.map((date, index) => (
                <div key={date ?? `blank-${month.key}-${index}`} className={`ps-month-day ${!date ? "is-empty" : "is-open-drop"}`} data-calendar-date={date ?? undefined} onDragOver={(event) => { if (date) event.preventDefault(); }} onDrop={(event) => { event.preventDefault(); const id = event.dataTransfer.getData("text/plain") || draggedId; if (date && id && (byDate.get(date) ?? []).every((item) => item.id !== id)) onMove(id, date); setDraggedId(null); }}>
                  <span className="ps-month-day-number">{date?.slice(-2).replace(/^0/, "")}</span>
                  {date && (byDate.get(date) ?? []).map((item) => (
                    <article className="ps-calendar-event ps-calendar-actionable" key={item.id} draggable={item.status !== "已发布"} onDragStart={(event) => { if (item.status === "已发布" || (event.target instanceof HTMLElement && event.target.closest(".ps-calendar-actions, .ps-calendar-creative-tools, summary"))) { event.preventDefault(); return; } setDraggedId(item.id); event.dataTransfer.setData("text/plain", item.id); }} onDragEnd={() => setDraggedId(null)}>
                      <div className="ps-calendar-event-head"><button type="button" className="ps-calendar-drag-handle" aria-label="拖动到其他日期" title="拖动到其他日期" disabled={item.status === "已发布"} onPointerDown={(event) => startTouchDrag(event, item)}><GripVertical size={14} /></button><span className={`ps-calendar-platform ${item.platform === "小红书" ? "rednote" : item.platform.toLowerCase()}`}>{item.platform === "Instagram" ? "◎" : item.platform === "Facebook" ? "f" : item.platform === "TikTok" ? "♪" : "RED"}</span><span className="ps-calendar-channel-name">{item.platform}</span><span className="ps-calendar-status">{item.status}</span></div>
                      <div className="ps-calendar-creative-media">
                        {item.imageDataUrl || item.imageUrl ? <div className="ps-calendar-ad-visual"><Image className="ps-calendar-generated-image" src={item.imageUrl || item.imageDataUrl!} alt={`${item.headline}广告配图`} width={480} height={300} unoptimized /><div className="ps-calendar-ad-overlay"><strong>{item.headline}</strong><span>{item.callToAction}</span></div></div> : <div className={`ps-calendar-image-placeholder ${item.imageStatus === "failed" ? "is-failed" : ""}`} aria-live="polite">{item.imageStatus === "generating" ? <><LoaderCircle className="ps-calendar-image-spinner" size={16} />正在生成配图，完成后会自动显示</> : item.imageStatus === "failed" ? "配图生成失败，可点右上角图标重试" : "专属广告配图"}</div>}
                        <div className="ps-calendar-creative-tools">
                          <button type="button" aria-label="换一个营销方案" title="换一个营销方案" disabled={busyId === item.id || item.imageStatus === "generating"} onClick={() => onReplace(item.id)}><RefreshCw size={14} /></button>
                          <button type="button" aria-label={item.imageDataUrl || item.imageUrl ? "重新生成配图" : item.imageStatus === "failed" ? "重试生成配图" : "生成配图"} title={item.imageDataUrl || item.imageUrl ? "重新生成配图" : item.imageStatus === "failed" ? "重试生成配图" : "生成配图"} disabled={busyId === item.id || item.imageStatus === "generating"} onClick={() => onGenerateImage(item.id)}><ImagePlus size={14} /></button>
                        </div>
                      </div>
                      <div className="ps-calendar-event-body">
                        <strong>{item.headline}</strong><small className="ps-calendar-objective">{item.objective}</small>
                        <details><summary>查看可发布文案</summary><p>{item.copy}</p><b>{item.callToAction}</b><small>{item.visualDirection}</small></details>
                        <div className="ps-calendar-actions"><button className="is-approve" disabled={(item.status !== "待审核" && item.status !== "草稿") || item.imageStatus === "generating" || item.imageStatus === "failed"} onClick={() => onApprove(item.id)}>{item.status === "草稿" ? "提交审核" : item.status === "待审核" ? "审核并加入待发布" : item.status}</button></div>
                      </div>
                    </article>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}
      <div className="ps-calendar-platform-note">内容按平台分别生成：{platforms.join(" · ")}</div>
    </div>
  );
}
