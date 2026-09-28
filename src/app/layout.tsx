import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import { BRAND } from "@/lib/brand";
import fontSheets from "@/data/font-stylesheets.json";
import "./globals.css";

export const metadata: Metadata = {
  title: `${BRAND.name} ${BRAND.nameZh} · ${BRAND.tagline}`,
  description: "选模板、改文案、排期发布",
};

const UI_FONTS = "https://fonts.googleapis.com/css2?family=Inter:wght@400..900&family=Noto+Sans+SC:wght@400..900&display=swap";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="zh-CN" className="dark h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {[UI_FONTS, ...fontSheets.stylesheets].map((href) => (
          <link key={href} rel="stylesheet" href={href} crossOrigin="anonymous" />
        ))}
      </head>
      <body className="min-h-full bg-background font-sans text-foreground">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
