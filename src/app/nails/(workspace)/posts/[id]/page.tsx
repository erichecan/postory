import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getNailsWorkspace } from "@/lib/nails/workspace";
import { getNailsPost } from "@/lib/db/nails-posts";
import { listMediaAssetsForOwner } from "@/lib/db/media-assets";
import { listUpcomingAvailabilityForOwner } from "@/lib/db/appointments";
import { nailsMediaUrl } from "@/lib/storage";
import { NailsPostEditor } from "@/components/nails/nails-post-editor";
import { PageHeading } from "@/components/nails/primitives";

export default async function NailsPostPage({ params }: PageProps<"/nails/posts/[id]">) {
  const { id } = await params;
  const { user, studio } = await getNailsWorkspace();
  const [post, assets, t] = await Promise.all([getNailsPost(user.id, studio.id, id), listMediaAssetsForOwner(user.id, studio.id), getTranslations("nails")]);
  if (!post) notFound();
  const calendar = await listUpcomingAvailabilityForOwner(user.id, 21);
  const slots = Object.values(calendar.availabilityByDate).flat().map((slot) => ({ value: slot.startAt.toISOString(), label: new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short", timeZone: studio.timeZone }).format(slot.startAt) }));
  const selectedAt = post.availability[0]?.startAt.toISOString() ?? null;
  const stale = Boolean(selectedAt && !slots.some((slot) => slot.value === selectedAt));
  return <>
    <PageHeading eyebrow={studio.name} title={post.title || t("postEditorTitle")} description={t("postEditorDescription")} />
    <NailsPostEditor post={{ id: post.id, title: post.title, body: post.body, tags: post.tags, theme: post.theme, template: post.template, status: post.status, media: post.media.map(({ mediaAsset }) => ({ id: mediaAsset.id, url: nailsMediaUrl(mediaAsset.key) })), selectedAt, stale, exports: post.exports.map(({ id: exportId, createdAt }) => ({ id: exportId, createdAt: createdAt.toISOString() })) }} library={assets.map((asset) => ({ id: asset.id, url: nailsMediaUrl(asset.key) }))} slots={slots} />
  </>;
}
