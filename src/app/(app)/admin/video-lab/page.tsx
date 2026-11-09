import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { VideoLab } from "@/components/admin/video-lab";
import { requireAdmin } from "@/lib/auth/session";

export default async function AdminVideoLabPage() {
  if (process.env.ENABLE_VIDEO_LAB !== "true") notFound();
  await requireAdmin();
  const t = await getTranslations("admin.videoLab");
  return (
    <div className="mx-auto flex max-w-[1080px] flex-col gap-8 px-4 py-10">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">{t("eyebrow")}</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>
      <VideoLab cloudRunUploadLimit={Boolean(process.env.K_SERVICE)} />
    </div>
  );
}
