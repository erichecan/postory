import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import { BRAND } from "@/lib/brand";
import "./globals.css";

export const metadata: Metadata = {
  title: `${BRAND.name} ${BRAND.nameZh} · ${BRAND.tagline}`,
  description: "选模板、改文案、排期发布",
};

const TEMPLATE_FONTS =
  "https://fonts.googleapis.com/css2?family=Anton&family=Archivo+Black&family=Fraunces:ital,wght@0,400..900;1,400..900&family=Inter:wght@400..900&family=Space+Grotesk:wght@400..700&family=Syne:wght@400..800&family=Noto+Sans+SC:wght@400..900&display=swap";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="zh-CN" className="dark h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href={TEMPLATE_FONTS} crossOrigin="anonymous" />
      </head>
      <body className="min-h-full bg-background font-sans text-foreground">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
