/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { getNailsWorkspace } from "@/lib/nails/workspace";
import { listNailsPosts } from "@/lib/db/nails-posts";
import { nailsMediaUrl } from "@/lib/storage";
import { PageHeading, EmptyState, NailsCard } from "@/components/nails/primitives";
import { getTranslations } from "next-intl/server";
import { FileText } from "lucide-react";
import { PostCopyButton } from "@/components/nails/post-copy-button";

export default async function NailsPostsPage() {
  const { user, studio } = await getNailsWorkspace();
  const [posts, t] = await Promise.all([listNailsPosts(user.id, studio.id), getTranslations("nails")]);
  return <>
    <PageHeading eyebrow={studio.name} title={t("postListTitle")} description={t("postListDescription")} />
    {posts.length === 0 ? <EmptyState icon={<FileText className="size-7" />} title={t("postEmptyTitle")} description={t("postEmptyDescription")}><Link href="/nails/create" className="rounded-lg bg-primary px-5 py-3 text-sm text-primary-foreground">{t("createTitle")}</Link></EmptyState> : <div className="space-y-3">{posts.map((post) => <NailsCard key={post.id} className="flex-row items-center gap-3 p-4">
      <Link className="flex min-w-0 flex-1 items-center gap-4" href={`/nails/posts/${post.id}`}>
      {post.media[0] && <img src={nailsMediaUrl(post.media[0].mediaAsset.key)} alt="" className="size-16 rounded-lg object-cover" />}
      <div className="min-w-0 flex-1"><p className="truncate font-medium">{post.title || t("postUntitled")}</p><p className="text-xs text-muted-foreground">{t(`postStatus${post.status}`)} · {new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(post.updatedAt)}</p></div>
      </Link><PostCopyButton id={post.id} label={t("postDuplicate")} />
    </NailsCard>)}</div>}
  </>;
}
