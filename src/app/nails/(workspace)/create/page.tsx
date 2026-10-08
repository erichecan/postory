import { getTranslations } from "next-intl/server";
import { getNailsWorkspace } from "@/lib/nails/workspace";
import { listMediaAssetsForOwner } from "@/lib/db/media-assets";
import { nailsMediaUrl } from "@/lib/storage";
import { PageHeading, NailsCard } from "@/components/nails/primitives";
import { MediaLibrary } from "@/components/nails/media-library";
import { BottomSheet } from "@/components/nails/bottom-sheet";

export default async function CreatePage() {
  const { user, studio } = await getNailsWorkspace();
  const t = await getTranslations("nails");
  const assets = await listMediaAssetsForOwner(user.id, studio.id);
  const initialAssets = assets.map((asset) => ({ id: asset.id, url: nailsMediaUrl(asset.key), width: asset.width, height: asset.height }));
  return <>
    <PageHeading eyebrow={studio.name} title={t("createTitle")} description={t("createDescription")} />
    <MediaLibrary initialAssets={initialAssets} />
    <NailsCard className="items-center py-8 text-center">
      <span className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-primary">{t("comingSoon")}</span>
      <p className="max-w-sm text-sm leading-7 text-muted-foreground">{t("noteComingSoonDescription")}</p>
    </NailsCard>
    <BottomSheet trigger={t("help")} title={t("helpTitle")} description={t("helpDescription")} />
  </>;
}
