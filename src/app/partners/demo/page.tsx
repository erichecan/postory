import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PartnerDemoJourney } from "@/components/partners/partner-demo-journey";
import { AppFooter } from "@/components/shell/app-footer";
import { PublicHeader } from "@/components/shell/public-header";
import { getCurrentUser } from "@/lib/auth/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("partners.demo");
  return { title: t("title"), description: t("subtitle") };
}

export default async function PartnerDemoPage() {
  const user = await getCurrentUser();
  return (
    <div className="ds-document ds-marketing-document flex min-h-screen flex-col">
      <PublicHeader signedIn={user !== null} />
      <main className="mx-auto w-full max-w-[1080px] flex-1 px-4 py-8 sm:py-12">
        <PartnerDemoJourney />
      </main>
      <AppFooter />
    </div>
  );
}
