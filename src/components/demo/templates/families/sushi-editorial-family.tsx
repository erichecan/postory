import type { CSSProperties } from "react";
import type { OutputId } from "@/lib/demo/contracts";
import { fitFontSizeCqw } from "@/lib/demo/templates/layout-resolver";
import type { SushiEditorialVariantId } from "@/lib/demo/templates/sushi-editorial-variants";
import { SUSHI_EDITORIAL_VARIANTS } from "@/lib/demo/templates/sushi-editorial-variants";

type Rect = { x: number; y: number; width: number; height: number };
type VariantDefinition = (typeof SUSHI_EDITORIAL_VARIANTS)[SushiEditorialVariantId];

function boxStyle(box: Rect): CSSProperties {
  return { position: "absolute", left: `${box.x * 100}%`, top: `${box.y * 100}%`, width: `${box.width * 100}%`, height: `${box.height * 100}%` };
}

export function SushiEditorialFamily({
  templateId, photoUrl, headline, tagline, availabilityText = "", outputId, focalPoint, zoom = 1, mode,
}: {
  templateId: SushiEditorialVariantId;
  photoUrl: string | null;
  headline: string;
  tagline: string;
  availabilityText?: string;
  outputId: OutputId;
  focalPoint?: { x: number; y: number };
  zoom?: number;
  mode: "thumbnail" | "preview" | "export";
}) {
  const definition: VariantDefinition = SUSHI_EDITORIAL_VARIANTS[templateId];
  const ratioId = outputId === "story-9x16" || outputId === "square" ? outputId : "portrait-4x5";
  const layout = definition.layouts[ratioId];
  const focus = focalPoint ?? layout.focalPoint;
  const fitTitle = fitFontSizeCqw(headline, layout.headline.width, layout.headlineSize, templateId === "sushi-authentic-japanese-01" ? 3 : 2);
  const fitTagline = fitFontSizeCqw(tagline, layout.tagline.width, layout.taglineSize, 3);
  const titleLines = headline.split("\n");
  const isPaper = definition.variant === "new-menu";
  const isParty = definition.variant === "party";
  const isLunch = definition.variant === "lunch";
  const isRestaurant = definition.variant === "restaurant";
  const isAuthentic = definition.variant === "authentic";
  const sharedText: CSSProperties = {
    position: "absolute", color: "#fff", whiteSpace: "pre-line", overflow: "hidden", overflowWrap: "anywhere",
    textShadow: isPaper ? "none" : "0 1px 3px rgba(0,0,0,.24)",
  };
  const panelBox = ratioId === "story-9x16"
    ? { x: 0, y: 0, width: 1, height: isPaper ? .52 : .55 }
    : { x: 0, y: 0, width: isPaper ? .59 : .56, height: 1 };
  const titleColor = isPaper ? "#bd4b19" : "#fff7e9";
  const titleFamily = isPaper ? '"Brush Script MT", "Segoe Script", cursive' : 'Georgia, "Times New Roman", serif';

  return <div
    className={`template-art template-art--sushi-editorial template-art--${templateId} template-art--${ratioId}`}
    data-template-id={definition.id}
    data-template-version={definition.version}
    data-template-mode={mode}
    data-output-id={outputId}
    data-text-fit-warning={fitTitle.overflow || fitTagline.overflow ? "text" : undefined}
    style={{ position: "relative", width: "100%", height: "100%", aspectRatio: `${layout.width} / ${layout.height}`, overflow: "hidden", containerType: "inline-size", isolation: "isolate", background: "#21170f" }}
  >
    {photoUrl ? <img
      src={photoUrl} alt="" draggable={false} data-template-slot="hero"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: `${focus.x * 100}% ${focus.y * 100}%`, transform: `scale(${zoom * 1.06})`, transformOrigin: `${focus.x * 100}% ${focus.y * 100}%` }}
    /> : <div data-template-slot="hero" style={{ position: "absolute", inset: 0, background: "linear-gradient(145deg,#342820,#ba7047 52%,#211811)" }} />}
    <div aria-hidden="true" style={{ position: "absolute", inset: 0, background: layout.overlay, pointerEvents: "none" }} />
    {(isPaper || isParty) && <div aria-hidden="true" style={{
      ...boxStyle(panelBox), zIndex: 1,
      background: isPaper ? "linear-gradient(135deg,#fff2dc,#efe0c6)" : "linear-gradient(150deg,#171310,#211b17)",
      clipPath: ratioId === "story-9x16"
        ? "polygon(0 0,100% 0,100% 94%,92% 96%,100% 98%,0 100%)"
        : "polygon(0 0,100% 0,97% 7%,100% 14%,96% 22%,100% 31%,96% 40%,100% 50%,96% 61%,100% 72%,96% 83%,100% 93%,96% 100%,0 100%)",
    }} />}
    {isPaper && <div aria-hidden="true" style={{ position: "absolute", zIndex: 2, left: "5%", top: "6%", width: "10%", height: "8%", border: "1px solid rgba(189,75,25,.45)", borderRadius: "50% 45% 52% 40%", transform: "rotate(-18deg)" }} />}
    {isParty && <div aria-hidden="true" style={{
      position: "absolute", zIndex: 2, left: "3%", bottom: "4%", width: ratioId === "story-9x16" ? "48%" : "42%", height: "19%", opacity: .5,
      backgroundImage: "repeating-radial-gradient(ellipse at 50% 100%, transparent 0 8px, #b99a6e 9px 10px, transparent 11px 18px)",
    }} />}
    {isLunch && <div aria-hidden="true" style={{ position: "absolute", zIndex: 2, right: "8%", top: "43%", width: "25%", aspectRatio: "1", borderRadius: "50%", border: "1px solid rgba(255,170,82,.8)", boxShadow: "0 0 0 8px rgba(238,103,18,.14)" }} />}
    {isRestaurant && <div aria-hidden="true" style={{ position: "absolute", zIndex: 2, ...boxStyle({ x: .075, y: layout.headline.y + layout.headline.height + .025, width: .28, height: .004 }), background: "linear-gradient(90deg,#d6b78f,transparent)" }} />}
    <div style={{ ...sharedText, ...boxStyle(layout.eyebrow), zIndex: 3, fontFamily: 'Arial, "Noto Sans", sans-serif', fontSize: "2.5cqw", fontWeight: 700, letterSpacing: ".15em", color: isPaper ? "#815e43" : "#e7c99d", display: "flex", alignItems: "center" }}>{definition.eyebrow}</div>
    <div data-template-slot="headline" style={{
      ...sharedText, ...boxStyle(layout.headline), zIndex: 3, color: titleColor, fontFamily: titleFamily,
      fontSize: `${fitTitle.fontSizeCqw}cqw`, lineHeight: .94, fontWeight: isPaper ? 600 : 500, letterSpacing: isPaper ? "-.035em" : "-.045em",
      display: "flex", flexDirection: "column", justifyContent: "center",
    }}>{isAuthentic ? titleLines.map((line, index) => <span key={`${index}-${line}`} style={{ color: index === 1 ? "#e7662d" : index > 1 ? "#d7b795" : titleColor }}>{line}</span>) : headline}</div>
    {tagline.trim() ? <div data-template-slot="tagline" style={{
      ...sharedText, ...boxStyle(layout.tagline), zIndex: 3, fontFamily: isPaper ? 'Georgia, "Times New Roman", serif' : 'Arial, "Noto Sans", sans-serif',
      fontSize: `${fitTagline.fontSizeCqw}cqw`, lineHeight: 1.3, letterSpacing: isParty ? ".025em" : isPaper ? ".01em" : ".045em",
      color: isPaper ? "#594435" : "#fff7e9", fontWeight: isLunch ? 700 : 400,
      ...(isLunch ? { background: "linear-gradient(100deg,#ea6a12,#fb8b20)", padding: "3% 4%", borderRadius: "0 12px 12px 0", boxSizing: "border-box" as const } : {}),
      ...(isPaper ? { display: "grid", placeItems: "center", textAlign: "center" as const, background: "rgba(255,249,238,.82)", borderRadius: "999px", padding: "3%", boxSizing: "border-box" as const } : {}),
    }}>{tagline}</div> : null}
    {availabilityText.trim() ? <div data-template-slot="availability" style={{
      ...sharedText, ...boxStyle(layout.availability), zIndex: 4, display: "flex", alignItems: "center", justifyContent: "center",
      boxSizing: "border-box", padding: "2% 3%", borderRadius: "999px", border: "1px solid rgba(231,201,157,.8)",
      background: "linear-gradient(110deg,rgba(29,20,14,.88),rgba(65,40,24,.78))", color: "#fff4df",
      fontFamily: 'Arial, "Noto Sans", sans-serif', fontSize: "2cqw", fontWeight: 600, lineHeight: 1.28, letterSpacing: ".025em",
      textAlign: "center", textShadow: "0 1px 3px rgba(0,0,0,.45)", backdropFilter: "blur(4px)",
    }}>{availabilityText}</div> : null}
    <div data-template-watermark-safe-area="true" style={{ ...boxStyle(layout.safeArea), position: "absolute", pointerEvents: "none", zIndex: 4 }} />
  </div>;
}
