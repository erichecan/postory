import type { CSSProperties } from "react";
import type { LayeredTemplateDefinition, OutputId } from "@/lib/demo/contracts";
import { fitFontSizeCqw, resolveTemplateLayout } from "@/lib/demo/templates/layout-resolver";

type Rect = { x: number; y: number; width: number; height: number };
type FocalPoint = { x: number; y: number };

function boxStyle(box: Rect): CSSProperties {
  return {
    position: "absolute",
    left: `${box.x * 100}%`,
    top: `${box.y * 100}%`,
    width: `${box.width * 100}%`,
    height: `${box.height * 100}%`,
  };
}

export interface FullBleedEditorialProps {
  definition: LayeredTemplateDefinition;
  photoUrl: string | null;
  headline: string;
  tagline: string;
  appointmentText?: string;
  outputId: OutputId;
  focalPoint?: FocalPoint;
  zoom?: number;
  mode: "thumbnail" | "preview" | "export";
}

export function FullBleedEditorialFamily({ definition, photoUrl, headline, tagline, appointmentText = "", outputId, focalPoint, zoom = 1, mode }: FullBleedEditorialProps) {
  const resolved = resolveTemplateLayout(definition, outputId as "square" | "portrait-4x5" | "story-9x16");
  const layout = resolved.layout;
  const isAutumnCatEye = definition.id === "nails-autumn-cat-eye-01";
  const focus = focalPoint ?? layout.focalPoint;
  // A small base overscan trims rounded preview-image edges; user zoom adds to it.
  const imageTransform = `scale(${zoom})`;
  const textStyle = (box: Rect, fontSizeCqw: number, lineHeight: number, fontFamily: string, maxLines: number, color: string, extra: CSSProperties = {}): CSSProperties => ({
    ...boxStyle(box),
    color,
    fontFamily,
    fontSize: `${fontSizeCqw}cqw`,
    lineHeight,
    whiteSpace: "pre-line",
    overflow: "hidden",
    overflowWrap: "anywhere",
    display: "-webkit-box",
    WebkitBoxOrient: "vertical",
    WebkitLineClamp: maxLines,
    textShadow: "0 1px 2px rgba(0,0,0,.18)",
    ...extra,
  } as CSSProperties);

  const fittedHeadline = fitFontSizeCqw(headline, layout.headline.width, layout.headline.fontSizeCqw, layout.headline.maxLines);
  const fittedTagline = fitFontSizeCqw(tagline, layout.tagline.width, layout.tagline.fontSizeCqw, layout.tagline.maxLines);
  const textFitWarning = [fittedHeadline.overflow && "headline", fittedTagline.overflow && "tagline"].filter(Boolean).join(" ");
  const eyebrowLayout = layout.editorialEyebrow;
  const editorialRule = layout.editorialRule;
  const eyebrowParts = eyebrowLayout?.text.trim().split(/\s+/) ?? [];
  const eyebrowStyle: CSSProperties | undefined = eyebrowLayout ? {
    ...boxStyle(eyebrowLayout),
    zIndex: 29,
    display: "flex",
    alignItems: "center",
    gap: "1.2cqw",
    color: eyebrowLayout.color,
    fontFamily: eyebrowLayout.fontFamily,
    fontSize: `${eyebrowLayout.fontSizeCqw}cqw`,
    fontWeight: 700,
    letterSpacing: eyebrowLayout.letterSpacing,
    whiteSpace: "nowrap",
    textShadow: "0 1px 8px rgba(0,0,0,.5)",
  } : undefined;

  return <div
    className={`template-art template-art--editorial template-art--${outputId}`}
    data-template-id={definition.id}
    data-template-version={definition.version}
    data-template-mode={mode}
    data-output-id={outputId}
    data-text-fit-warning={textFitWarning || undefined}
    style={{ position: "relative", width: "100%", height: "100%", aspectRatio: `${layout.width} / ${layout.height}`, overflow: "hidden", containerType: "inline-size", isolation: "isolate", background: "#241c16" }}
  >
    {photoUrl ? <img
      src={photoUrl}
      alt=""
      draggable={false}
      data-template-slot="hero"
      style={{ ...boxStyle(layout.photo), zIndex: 0, objectFit: "cover", objectPosition: `${focus.x * 100}% ${focus.y * 100}%`, transform: imageTransform, transformOrigin: `${focus.x * 100}% ${focus.y * 100}%` }}
    /> : <div data-template-slot="hero" style={{ ...boxStyle(layout.photo), zIndex: 0, background: "linear-gradient(145deg,#342820,#ba7047 52%,#211811)" }} />}
    {layout.atmosphereOverlay ? <div aria-hidden="true" data-template-layer="atmosphere" style={{ ...boxStyle(layout.photo), zIndex: 8, pointerEvents: "none", background: layout.atmosphereOverlay.gradient, mixBlendMode: layout.atmosphereOverlay.blendMode }} /> : null}
    <div aria-hidden="true" style={{ ...boxStyle(layout.overlay), zIndex: 10, background: layout.overlay.gradient, pointerEvents: "none" }} />
    {editorialRule ? <div aria-hidden="true" data-template-layer="editorial-rule" style={{ ...boxStyle(editorialRule), zIndex: 28, background: `linear-gradient(90deg,${editorialRule.color},rgba(231,190,120,0))`, pointerEvents: "none" }} /> : null}
    {eyebrowLayout && eyebrowStyle ? <div aria-hidden="true" data-template-layer="editorial-eyebrow" style={eyebrowStyle}><span>{eyebrowParts.slice(0, -1).join(" ")}</span><span style={{ marginLeft: "auto", opacity: 0.8 }}>{eyebrowParts.at(-1)}</span></div> : null}
    <div
      data-template-slot="headline"
      style={textStyle(layout.headline, fittedHeadline.fontSizeCqw, layout.headline.lineHeight, layout.headline.fontFamily, layout.headline.maxLines, layout.headline.color ?? "#fff", {
        zIndex: 30, fontWeight: isAutumnCatEye ? 600 : 500, letterSpacing: isAutumnCatEye ? "-.02em" : "-.035em",
        ...(isAutumnCatEye ? { backgroundImage: "linear-gradient(105deg,#FFF5DE 2%,#F0D5A0 42%,#C78A46 78%,#F8E7C4 100%)", backgroundClip: "text", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", filter: "drop-shadow(0 2px 10px rgba(14,6,4,.38))" } : {}),
      })}
    >{isAutumnCatEye ? headline.split("\n").map((line, index) => <span key={`${index}-${line}`} style={{ display: "block", fontSize: index === 0 ? "1em" : ".88em", letterSpacing: index === 0 ? "-.02em" : ".015em" }}>{line}</span>) : headline}</div>
    {tagline.trim() ? <div
      data-template-slot="tagline"
      style={textStyle(layout.tagline, fittedTagline.fontSizeCqw, layout.tagline.lineHeight, layout.tagline.fontFamily, layout.tagline.maxLines, layout.tagline.color ?? "#fff", { zIndex: 31, fontWeight: isAutumnCatEye ? 500 : 500, letterSpacing: isAutumnCatEye ? ".16em" : ".075em", textTransform: "uppercase", ...(isAutumnCatEye ? { textShadow: "0 1px 10px rgba(0,0,0,.55)" } : {}) })}
    >{tagline}</div> : null}
    {appointmentText.trim() && layout.appointment ? <div data-template-slot="availability" style={{ ...textStyle(layout.appointment, layout.appointment.fontSizeCqw, layout.appointment.lineHeight, layout.appointment.fontFamily, layout.appointment.maxLines, layout.appointment.color ?? "#fff", { zIndex: 32, fontWeight: 600, letterSpacing: ".04em", textShadow: "0 1px 8px rgba(0,0,0,.65)" }) }}>{appointmentText}</div> : null}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={definition.decorationAssets.ornamentTop} alt="" aria-hidden="true" draggable={false} style={{ ...boxStyle(layout.ornamentTop), zIndex: 20, objectFit: "contain", pointerEvents: "none" }} />
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={definition.decorationAssets.ornamentBottom} alt="" aria-hidden="true" draggable={false} style={{ ...boxStyle(layout.ornamentBottom), zIndex: 21, objectFit: "contain", pointerEvents: "none" }} />
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={definition.decorationAssets.accentBrush} alt="" aria-hidden="true" draggable={false} style={{ ...boxStyle(layout.accentBrush), zIndex: 22, objectFit: "contain", pointerEvents: "none" }} />
  </div>;
}
