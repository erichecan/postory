export interface NailsClassicProps {
  photoUrl: string | null;
  title: string;
  shortCopy: string;
}

/**
 * M1 proof-of-pipeline template: aspect-ratio and layout match the
 * portrait-2x3 output (2:3), not yet pixel-matched to the hi-fi mockup —
 * that fidelity pass happens in M2 when Page 04/05 are built against the
 * actual 粉色美甲社媒模板编辑器.png / 美甲笔记预览与导出页面.png references.
 */
export function NailsClassicTemplate({ photoUrl, title, shortCopy }: NailsClassicProps) {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: "2 / 3",
        overflow: "hidden",
        background: "var(--demo-surface)",
        fontFamily: "system-ui, -apple-system, sans-serif",
        containerType: "inline-size",
      }}
    >
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoUrl} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <div style={{ position: "absolute", inset: 0, background: "var(--demo-bg)" }} />
      )}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.15) 38%, rgba(0,0,0,0) 60%)",
        }}
      />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "6% 7% 16%", color: "#ffffff" }}>
        <div style={{ fontSize: "clamp(18px, 6.2cqw, 40px)", fontWeight: 700, lineHeight: 1.2, wordBreak: "break-word" }}>{title}</div>
        <div style={{ marginTop: "2%", fontSize: "clamp(12px, 3.2cqw, 20px)", lineHeight: 1.4, opacity: 0.92, wordBreak: "break-word" }}>
          {shortCopy}
        </div>
      </div>
    </div>
  );
}
