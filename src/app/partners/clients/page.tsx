import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PartnerClientsList } from "@/components/partners/partner-clients-list";
import { AppFooter } from "@/components/shell/app-footer";
import { PublicHeader } from "@/components/shell/public-header";
import { listAgencyClientOverviews } from "@/lib/db/agency-access";
import { requireUser } from "@/lib/auth/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("partners.clients.meta");
  return { title: t("title"), description: t("description") };
}

export default async function PartnerClientsPage() {
  const user = await requireUser();
  const [t, clients] = await Promise.all([
    getTranslations("partners.clients"),
    listAgencyClientOverviews(user.id),
  ]);

  return (
    <div className="ds-document flex min-h-screen flex-col">
      <PublicHeader signedIn />
      <main className="mx-auto flex w-full max-w-[960px] flex-1 flex-col gap-6 px-4 py-12">
        <header className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </header>
        <PartnerClientsList clients={clients} />
      </main>
      <AppFooter />
    </div>
  );
}
