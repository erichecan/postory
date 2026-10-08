import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowUpRight, Flower2 } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { nailsReturnPath } from "@/lib/nails/validation";
import { NailsLoginForm } from "@/components/nails/login-form";
import { NailsCard, PageHeading } from "@/components/nails/primitives";

export default async function NailsLoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = nailsReturnPath((await searchParams).next);
  if (await getCurrentUser()) redirect(next);
  const t = await getTranslations("nails");
  return <main className="mx-auto grid max-w-4xl gap-8 px-5 py-10 sm:py-16 md:grid-cols-2 md:items-center md:gap-14">
    <div className="space-y-5">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-accent text-primary"><Flower2 className="size-9" aria-hidden="true" /></div>
      <PageHeading eyebrow="PoStory for Nails" title={t("tagline")} description={t("loginDescription")} />
      <Link href="/nails/demo" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-primary">{t("demoLink")}<ArrowUpRight className="size-4" aria-hidden="true" /></Link>
    </div>
    <NailsCard>
      <h2 className="text-xl font-semibold">{t("loginTitle")}</h2>
      <NailsLoginForm next={next} />
      <p className="text-xs leading-6 text-muted-foreground">{t("loginTerms")} <Link href="/legal/terms" className="underline">{t("terms")}</Link> {t("and")} <Link href="/legal/privacy" className="underline">{t("privacy")}</Link></p>
    </NailsCard>
  </main>;
}
