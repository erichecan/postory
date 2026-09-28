"use client";

import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import type { DesignElement } from "@/types/design";
import { hasRichText, RichText } from "./rich-text";

const px = (v: string | undefined, fallback: number) => (v ? parseFloat(v) : fallback);

const DISPLAY_FONTS = new Set(["Anton", "Archivo Black", "Syne"]);
const CJK = /[\u3400-\u9fff\uff00-\uffef]/;

function effectiveWeight(el: DesignElement) {
  const { fontFamily, fontWeight } = el.style;
  if (fontFamily && DISPLAY_FONTS.has(fontFamily) && CJK.test(el.content ?? "")) return "900";
  return fontWeight;
}

export function FitText({ el }: { el: DesignElement }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const base = px(el.style.fontSize, 32);
  const min = px(el.style.minFontSize, 8);
  const [size, setSize] = useState(base);
  const [fontsTick, setFontsTick] = useState(0);
  const fit = el.style.textMode !== "overflow";

  useLayoutEffect(() => {
    let cancelled = false;
    document.fonts?.ready.then(() => !cancelled && setFontsTick((t) => t + 1));
    return () => {
      cancelled = true;
    };
  }, []);

  useLayoutEffect(() => {
    const box = boxRef.current;
    const text = textRef.current;
    if (!box || !text) return;
    let s = base;
    text.style.fontSize = `${s}px`;
    while (fit && s > min && (text.scrollWidth > box.clientWidth + 1 || text.scrollHeight > box.clientHeight + 1)) {
      s = Math.max(min, s - Math.max(1, s * 0.05));
      text.style.fontSize = `${s}px`;
    }
    setSize(s);
  }, [base, min, el.content, el.w, el.h, el.style.fontFamily, el.style.fontWeight, el.style.letterSpacing, el.style.lineHeight, el.style.textTransform, el.style.padding, el.style.writingMode, fit, fontsTick]);

  const st = el.style;
  const vertical = st.writingMode?.startsWith("vertical");
  const text = hasRichText(el.content) ? <RichText content={el.content ?? ""} /> : el.content;
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        padding: st.padding,
        border: st.border,
        boxShadow: st.boxShadow,
        backgroundColor: st.backgroundColor,
        borderRadius: st.borderRadius,
        boxSizing: "border-box",
      }}
    >
      <div
        ref={boxRef}
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: vertical ? "center" : st.verticalAlign ?? "flex-start",
          justifyContent: st.textAlign === "center" ? "center" : st.textAlign === "right" ? "flex-end" : "flex-start",
          overflow: fit ? "hidden" : "visible",
        }}
      >
        <span
          ref={textRef}
          style={{
            display: "block",
            maxWidth: "100%",
            maxHeight: vertical ? "100%" : undefined,
            color: st.color,
            fontSize: `${size}px`,
            fontFamily: st.fontFamily ? `"${st.fontFamily}", "Noto Sans SC", sans-serif` : undefined,
            fontWeight: effectiveWeight(el),
            fontStyle: st.fontStyle,
            lineHeight: st.lineHeight ?? 1.2,
            letterSpacing: st.letterSpacing,
            textAlign: st.textAlign ?? "left",
            textDecoration: st.textDecoration,
            textTransform: st.textTransform,
            textShadow: st.textShadow,
            WebkitTextStroke: st.textStroke,
            writingMode: st.writingMode as CSSProperties["writingMode"],
            whiteSpace: "pre-wrap",
            overflowWrap: "break-word",
          }}
        >
          {st.textBackground ? (
            <span
              style={{
                background: st.textBackground,
                borderRadius: st.textBackgroundRadius,
                padding: "0.08em 0.3em",
                boxDecorationBreak: "clone",
                WebkitBoxDecorationBreak: "clone",
              }}
            >
              {text}
            </span>
          ) : (
            text
          )}
        </span>
      </div>
    </div>
  );
}
