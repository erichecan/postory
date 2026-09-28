import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Logo } from "@/components/brand/logo";
import { LocaleSwitcher } from "@/components/i18n/locale-switcher";
import { countAllTemplatesCached } from "@/lib/db/templates";

const SHOWCASE = [
  "/assets/templates/orshot/orshot-2444-1.png",
  "/assets/templates/orshot/orshot-2427-1.png",
  "/assets/templates/orshot/orshot-2439-1.png",
  "/assets/templates/orshot/orshot-2354-1.png",
];

export async function AuthShell({ children }: { children: React.ReactNode }) {
  const [t, count] = await Promise.all([getTranslations("auth.showcase"), countAllTemplatesCached()]);
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col p-6 sm:p-10">
        <div className="flex items-center justify-between">
          <Logo href="/" />
          <LocaleSwitcher />
        </div>
        <div className="flex flex-1 items-center justify-center py-10">{children}</div>
      </div>
      <div className="relative hidden overflow-hidden bg-sidebar lg:block">
        <div className="absolute inset-0 grid grid-cols-2 gap-4 p-10 opacity-90">
          {SHOWCASE.map((src, i) => (
            <div key={src} className={`relative overflow-hidden rounded-2xl ${i % 2 ? "mt-16" : ""}`}>
              <Image src={src} alt="" fill sizes="25vw" className="object-cover" priority={i < 2} />
            </div>
          ))}
        </div>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-sidebar via-sidebar/90 to-transparent p-10 pt-32">
          <p className="text-2xl font-semibold">{t("title", { count })}</p>
          <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
        </div>
      </div>
    </div>
  );
}
