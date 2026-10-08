import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireNailsUser } from "@/lib/nails/workspace";
import { findStudioForOwner } from "@/lib/db/studios";
import { StudioForm } from "@/components/nails/studio-form";
import { NailsCard, PageHeading } from "@/components/nails/primitives";
import { SignOutButton } from "@/components/nails/sign-out-button";

export default async function OnboardingPage() {
  const user = await requireNailsUser("/nails/onboarding");
  if (await findStudioForOwner(user.id)) redirect("/nails/create");
  const t = await getTranslations("nails");
  return <main className="mx-auto max-w-lg space-y-6 px-5 py-10">
    <PageHeading eyebrow={t("step")} title={t("onboardingTitle")} description={t("onboardingDescription")} />
    <NailsCard><StudioForm onboarding timeZones={Intl.supportedValuesOf("timeZone")} /></NailsCard>
    <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground"><span className="break-all">{user.email ?? user.phone}</span><SignOutButton /></div>
  </main>;
}
