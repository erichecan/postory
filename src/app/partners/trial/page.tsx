import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PartnerTrialForm } from "@/components/partners/partner-trial-form";
import { AppFooter } from "@/components/shell/app-footer";
import { PublicHeader } from "@/components/shell/public-header";
import { getCurrentUser } from "@/lib/auth/session";

const STEP_KEYS = ["step1", "step2", "step3"] as const;

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("partners.trial"))("title") };
}

export default async function PartnerTrialPage() {
  const [user, t] = await Promise.all([getCurrentUser(), getTranslations("partners.trial")]);

  return (
    <div className="ds-document flex min-h-screen flex-col">
      <PublicHeader signedIn={user !== null} />
      <main className="mx-auto flex w-full max-w-[1080px] flex-1 flex-col gap-8 px-4 py-10 sm:py-14">
        <header className="mx-auto flex w-full max-w-3xl flex-col items-center gap-3 text-center">
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{t("tag")}</span>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t("title")}</h1>
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">{t("subtitle")}</p>
          <ol className="mt-2 grid w-full gap-2 text-xs sm:grid-cols-3">
            {STEP_KEYS.map((key, index) => (
              <li key={key} className="flex items-center justify-center gap-2 rounded-full border bg-card px-3 py-2">
                <span className="grid size-5 place-items-center rounded-full bg-primary/10 font-semibold text-primary">{index + 1}</span>
                {t(key)}
              </li>
            ))}
          </ol>
        </header>
        <PartnerTrialForm />
      </main>
      <AppFooter />
    </div>
  );
}
