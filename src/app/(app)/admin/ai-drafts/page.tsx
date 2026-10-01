import { getTranslations } from "next-intl/server";
import { AdminSubnav } from "@/components/admin/admin-subnav";
import { AiDraftTable } from "@/components/admin/ai-draft-table";
import { requireAdmin } from "@/lib/auth/session";
import { listAiDraftTemplates } from "@/lib/db/admin-templates";

export default async function AdminAiDraftsPage() {
  await requireAdmin();
  const [t, items] = await Promise.all([getTranslations("admin.aiDrafts"), listAiDraftTemplates()]);
  return (
    <div className="mx-auto flex max-w-[1080px] flex-col gap-6 px-4 py-10">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <AdminSubnav active="aiDrafts" />
      </header>
      <AiDraftTable items={items} />
    </div>
  );
}
