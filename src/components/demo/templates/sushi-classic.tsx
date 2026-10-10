export interface SushiClassicProps {
  photoUrl: string | null;
  title: string;
  dishName?: string;
  shortCopy: string;
}

/**
 * M1 proof-of-pipeline template — see nails-classic.tsx for the same note:
 * fidelity to 寿司社交媒体内容预览界面.png lands in M3, not here.
 */
export function SushiClassicTemplate({ photoUrl, title, dishName, shortCopy }: SushiClassicProps) {
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
          background: "linear-gradient(to top, rgba(10,6,5,0.78) 0%, rgba(10,6,5,0.2) 40%, rgba(10,6,5,0) 62%)",
        }}
      />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "6% 7% 16%", color: "var(--demo-primary-ink)" }}>
        {dishName ? (
          <div style={{ fontSize: "clamp(10px, 2.8cqw, 16px)", fontWeight: 600, letterSpacing: "0.04em", opacity: 0.85, marginBottom: "2%" }}>
            {dishName}
          </div>
        ) : null}
        <div style={{ fontSize: "clamp(18px, 6.2cqw, 40px)", fontWeight: 700, lineHeight: 1.2, wordBreak: "break-word" }}>{title}</div>
        <div style={{ marginTop: "2%", fontSize: "clamp(12px, 3.2cqw, 20px)", lineHeight: 1.4, opacity: 0.92, wordBreak: "break-word" }}>
          {shortCopy}
        </div>
      </div>
    </div>
  );
}
