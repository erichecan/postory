import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Logo } from "@/components/brand/logo";
import { LocaleSwitcher } from "@/components/i18n/locale-switcher";
import { buttonVariants } from "@/components/ui/button";

export async function PublicHeader({ signedIn }: { signedIn: boolean }) {
  const t = await getTranslations("plans");
  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1080px] items-center gap-3 px-4">
        <Logo href="/" />
        <div className="ml-auto flex items-center gap-2">
          <LocaleSwitcher />
          <Link href={signedIn ? "/templates" : "/login"} className={buttonVariants({ variant: signedIn ? "default" : "outline" })}>
            {signedIn ? t("toApp") : t("login")}
          </Link>
        </div>
      </div>
    </header>
  );
}
