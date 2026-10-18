import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { PartnerTrialView } from "@/components/partners/partner-trial-view";
import { AppFooter } from "@/components/shell/app-footer";
import { PublicHeader } from "@/components/shell/public-header";
import { getCurrentUser } from "@/lib/auth/session";
import { getTrialRequestByToken } from "@/lib/db/partner-trials";

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const [t, trial] = await Promise.all([getTranslations("partners.view"), getTrialRequestByToken((await params).token)]);
  if (!trial) return { title: t("notFound") };
  const title = trial.clientBrandName;
  const description = t(`status.${trial.status}`);
  return {
    title,
    description,
    openGraph: { title, description, images: ["/visual/campaign-cover.webp"] },
    twitter: { card: "summary_large_image", title, description, images: ["/visual/campaign-cover.webp"] },
  };
}

export default async function PartnerTrialViewPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const [user, trial] = await Promise.all([getCurrentUser(), getTrialRequestByToken(token)]);
  if (!trial) notFound();

  return (
    <div className="ds-document flex min-h-screen flex-col">
      <PublicHeader signedIn={user !== null} />
      <main className="mx-auto flex w-full max-w-[720px] flex-1 flex-col gap-8 px-4 py-12">
        <header className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">{trial.clientBrandName}</h1>
        </header>
        <PartnerTrialView trial={trial} token={token} />
      </main>
      <AppFooter />
    </div>
  );
}
