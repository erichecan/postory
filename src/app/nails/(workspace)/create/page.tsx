import { getTranslations } from "next-intl/server";
import { getNailsWorkspace } from "@/lib/nails/workspace";
import { listMediaAssetsForOwner } from "@/lib/db/media-assets";
import { nailsMediaUrl } from "@/lib/storage";
import { PageHeading } from "@/components/nails/primitives";
import { MediaLibrary } from "@/components/nails/media-library";
import { BottomSheet } from "@/components/nails/bottom-sheet";
import Link from "next/link";

export default async function CreatePage() {
  const { user, studio } = await getNailsWorkspace();
  const t = await getTranslations("nails");
  const assets = await listMediaAssetsForOwner(user.id, studio.id);
  const initialAssets = assets.map((asset) => ({ id: asset.id, url: nailsMediaUrl(asset.key), width: asset.width, height: asset.height }));
  return <>
    <PageHeading eyebrow={studio.name} title={t("createTitle")} description={t("createDescription")} />
    <Link href="/nails/posts" className="inline-flex min-h-11 items-center rounded-lg border px-4 text-sm font-medium">{t("postListTitle")}</Link>
    <MediaLibrary initialAssets={initialAssets} />
    <BottomSheet trigger={t("help")} title={t("helpTitle")} description={t("helpDescription")} />
  </>;
}
