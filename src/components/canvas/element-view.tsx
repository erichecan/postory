"use client";

import type { CSSProperties } from "react";
import type { DesignElement } from "@/types/design";
import { FitText } from "./fit-text";

function shapeStyle(el: DesignElement): CSSProperties {
  const st = el.style;
  const stroke = st.stroke ? `${parseFloat(String(st.strokeWidth ?? 1))}px solid ${st.stroke}` : undefined;
  if (el.shapeType === "line") {
    return { borderTop: stroke ?? `${el.h}px solid ${st.fill ?? "#000"}`, height: 0, top: el.h / 2 };
  }
  return {
    background: st.fill,
    border: st.border ?? stroke,
    borderRadius: el.shapeType === "circle" ? "50%" : st.borderRadius,
    boxShadow: st.boxShadow,
  };
}

export function ElementView({ el }: { el: DesignElement }) {
  const box: CSSProperties = {
    position: "absolute",
    left: el.x,
    top: el.y,
    width: el.w,
    height: el.h,
    zIndex: el.z,
    transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
    opacity: el.style.opacity,
    filter: el.style.filter,
    mixBlendMode: el.style.mixBlendMode as CSSProperties["mixBlendMode"],
  };

  if (el.type === "text") {
    return (
      <div style={box}>
        <FitText el={el} />
      </div>
    );
  }

  if (el.type === "shape") {
    return <div style={{ ...box, ...shapeStyle(el) }} />;
  }

  if (el.style.svgColor && el.content?.startsWith("data:image/svg")) {
    const mask = `url("${el.content.replace(/"/g, "%22")}") center / ${el.style.objectFit === "cover" ? "cover" : "contain"} no-repeat`;
    return <div style={{ ...box, background: el.style.svgColor, mask, WebkitMask: mask }} />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={el.content}
      alt=""
      draggable={false}
      style={{
        ...box,
        maxWidth: "none",
        objectFit: el.style.objectFit ?? "cover",
        objectPosition: el.style.objectPosition,
        borderRadius: el.style.borderRadius,
        boxShadow: el.style.boxShadow,
        border: el.style.borderWidth ? `${el.style.borderWidth} ${el.style.borderStyle ?? "solid"} ${el.style.borderColor}` : undefined,
      }}
    />
  );
}
