import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PartnerTrialForm } from "@/components/partners/partner-trial-form";
import { AppFooter } from "@/components/shell/app-footer";
import { PublicHeader } from "@/components/shell/public-header";
import { getCurrentUser } from "@/lib/auth/session";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("partners.trial"))("title") };
}

export default async function PartnerTrialPage() {
  const [user, t] = await Promise.all([getCurrentUser(), getTranslations("partners.trial")]);

  return (
    <div className="ds-document flex min-h-screen flex-col">
      <PublicHeader signedIn={user !== null} />
      <main className="mx-auto flex w-full max-w-[1080px] flex-1 flex-col gap-8 px-4 py-12">
        <header className="flex flex-col gap-2 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="mx-auto max-w-xl text-sm text-muted-foreground">{t("subtitle")}</p>
        </header>
        <PartnerTrialForm />
      </main>
      <AppFooter />
    </div>
  );
}
