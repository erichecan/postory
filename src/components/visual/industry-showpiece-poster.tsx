"use client";

import Image from "next/image";
import type { Showpiece } from "@/lib/verticals/showpieces";

/**
 * Premium 4:5 sample campaign preview. Brand layout differs by real audience
 * and goal; this is deliberately NOT a single universal poster with new text.
 *
 * The photo and headline are DISPLAY concepts only. Unsplash contractor images
 * are not passed off as actual jobs by the fictional roofing agency.
 */
export function IndustryShowpiecePoster({ item, brand, modal = false }: {
  item: Showpiece; brand: string; modal?: boolean;
}) {
  const isRoof = item.industry === "roofing";
  return <div
    className={`isp isp--${item.layout} isp--${item.industry} ${modal ? "isp--modal" : ""}`}
    role="img"
    aria-label={`${brand} 广告创意示例：${item.headline.replace(/\n/g, " ")}；${item.photographyNotice}`}
  >
    <div className="isp-photo">
      <Image src={item.image} alt={item.imageAlt} fill sizes={modal ? "440px" : "360px"}
        unoptimized priority={false} />
    </div>
    <div className="isp-top">
      <span className="isp-logo">{brand}</span>
      <span className="isp-dot" aria-hidden="true">✳</span>
    </div>
    <div className="isp-content">
      <span className="isp-overline">{item.eyebrow}</span>
      <strong className="isp-headline">{item.headline.split("\n").map((line,index) => <span key={index}>{line}</span>)}</strong>
      <p className="isp-subline">{item.subline}</p>
      <span className="isp-cta">{item.cta}<span aria-hidden="true">↗</span></span>
    </div>
    <div className="isp-bottom">
      <span>{isRoof ? "NORTH / 2026" : "STUDIO / EDITION"}</span>
      <span>PoStory · {item.variant === "A" ? "01" : "02"}</span>
    </div>
  </div>;
}
