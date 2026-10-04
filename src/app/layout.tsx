import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { TimeZoneSync } from "@/components/i18n/time-zone-sync";
import { Toaster } from "@/components/ui/sonner";
import fontSheets from "@/data/font-stylesheets.json";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("common");
  return { title: `${t("brandName")} · ${t("tagline")}`, description: t("metaDescription") };
}

const UI_FONTS = "https://fonts.googleapis.com/css2?family=Inter:wght@400..900&family=Noto+Sans+SC:wght@400..900&display=swap";

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();
  return (
    <html lang={locale === "zh" ? "zh-CN" : "en"} className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {[UI_FONTS, ...fontSheets.stylesheets].map((href) => (
          <link key={href} rel="stylesheet" href={href} crossOrigin="anonymous" />
        ))}
      </head>
      <body className="min-h-full bg-background font-sans text-foreground">
        <NextIntlClientProvider>
          {children}
          <Toaster />
          <TimeZoneSync />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
