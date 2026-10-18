import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PartnerLanding } from "@/components/partners/partner-landing";
import { AppFooter } from "@/components/shell/app-footer";
import { PublicHeader } from "@/components/shell/public-header";
import { getCurrentUser } from "@/lib/auth/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("partners.landing.meta");
  const title = t("title");
  const description = t("description");
  return {
    title,
    description,
    openGraph: { title, description, images: ["/visual/campaign-cover.webp"] },
    twitter: { card: "summary_large_image", title, description, images: ["/visual/campaign-cover.webp"] },
  };
}

export default async function PartnersLandingPage() {
  const user = await getCurrentUser();

  return (
    <div className="ds-document ds-marketing-document flex min-h-screen flex-col">
      <PublicHeader signedIn={user !== null} />
      <main className="mx-auto w-full max-w-[1080px] flex-1 px-4 py-14">
        <PartnerLanding />
      </main>
      <AppFooter />
    </div>
  );
}
