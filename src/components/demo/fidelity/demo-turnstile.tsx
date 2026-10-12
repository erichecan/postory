"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (target: HTMLElement, options: { sitekey: string; action: string; callback: (token: string) => void; "expired-callback": () => void; "error-callback": () => void }) => string;
      remove: (widgetId: string) => void;
    };
  }
}

export function DemoTurnstile({ onToken }: { onToken: (token: string) => void }) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";
  const target = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!ready || !siteKey || !target.current || !window.turnstile) return;
    widgetId.current = window.turnstile.render(target.current, {
      sitekey: siteKey,
      action: "demo_generate",
      callback: onToken,
      "expired-callback": () => onToken(""),
      "error-callback": () => onToken(""),
    });
    return () => { if (widgetId.current) window.turnstile?.remove(widgetId.current); widgetId.current = null; };
  }, [ready, siteKey, onToken]);

  if (!siteKey) return process.env.NODE_ENV === "production"
    ? <span role="alert" style={{ fontSize: 12, color: "#a11" }}>人机验证尚未配置</span>
    : <span style={{ fontSize: 12, color: "#777" }}>本地开发：人机验证已跳过</span>;

  return <><Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" onReady={() => setReady(true)} /><div ref={target} /></>;
}
