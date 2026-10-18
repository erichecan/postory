import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AppFooter } from "@/components/shell/app-footer";
import { PublicHeader } from "@/components/shell/public-header";

export default async function PartnerClientsForbidden() {
  const t = await getTranslations("partners.clients");
  return (
    <div className="ds-document flex min-h-screen flex-col">
      <PublicHeader signedIn />
      <main className="mx-auto flex w-full max-w-[640px] flex-1 flex-col items-start gap-3 px-4 py-16">
        <h1 className="text-2xl font-semibold tracking-tight">{t("forbiddenTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("forbiddenBody")}</p>
        <Link className="text-primary underline" href="/partners/clients">
          {t("backToClients")}
        </Link>
      </main>
      <AppFooter />
    </div>
  );
}
