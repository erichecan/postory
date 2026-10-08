import { getTranslations } from "next-intl/server";
import { ShieldCheck } from "lucide-react";
import { getNailsWorkspace } from "@/lib/nails/workspace";
import { NailsCard, PageHeading } from "@/components/nails/primitives";
import { StudioForm } from "@/components/nails/studio-form";
import { SignOutButton } from "@/components/nails/sign-out-button";

export default async function MePage() {
  const { user, studio } = await getNailsWorkspace();
  const t = await getTranslations("nails");
  return <>
    <PageHeading eyebrow={t("workspace")} title={t("meTitle")} description={t("meDescription")} />
    <NailsCard><h2 className="text-base font-semibold">{t("studioInfo")}</h2><StudioForm initialName={studio.name} initialTimeZone={studio.timeZone} timeZones={Intl.supportedValuesOf("timeZone")} /></NailsCard>
    <NailsCard>
      <h2 className="text-base font-semibold">{t("account")}</h2>
      <p className="break-all text-sm">{user.email ?? user.phone}</p>
      {user.email && <p className="flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="size-4" aria-hidden="true" />{t(user.emailVerifiedAt ? "verified" : "notVerified")}</p>}
      <div><SignOutButton /></div>
    </NailsCard>
  </>;
}
