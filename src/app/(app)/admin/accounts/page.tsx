import { getFormatter, getTranslations } from "next-intl/server";
import { CreateAccountForm } from "@/components/admin/create-account-form";
import { ToggleUserButton } from "@/components/admin/toggle-user-button";
import { requireAdmin } from "@/lib/auth/session";
import { listUsers } from "@/lib/db/users";

export default async function AccountsPage() {
  await requireAdmin();
  const [users, t, format] = await Promise.all([listUsers(), getTranslations("admin"), getFormatter()]);
  const columns = [t("columns.name"), t("columns.phone"), t("columns.source"), t("columns.designs"), t("columns.createdAt"), t("columns.status"), ""];
  return (
    <div className="mx-auto flex max-w-[1080px] flex-col gap-8 px-4 py-10">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("total", { count: users.length })}</p>
      </header>
      <CreateAccountForm />
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
            <tr>
              {columns.map((h) => <th key={h} className="px-4 py-2.5 font-medium">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t">
                <td className="px-4 py-3">{u.name}{u.role === "ADMIN" && <span className="ml-2 rounded bg-primary/15 px-1.5 py-0.5 text-[11px] text-primary">{t("adminBadge")}</span>}</td>
                <td className="px-4 py-3 tabular-nums">{u.phone}</td>
                <td className="px-4 py-3 text-muted-foreground">{t(u.source === "OFFLINE" ? "source.offline" : "source.self")}</td>
                <td className="px-4 py-3 tabular-nums">{u._count.designs}</td>
                <td className="px-4 py-3 text-muted-foreground">{format.dateTime(u.createdAt, { dateStyle: "medium" })}</td>
                <td className="px-4 py-3">{u.disabled ? <span className="text-destructive">{t("status.disabled")}</span> : <span className="text-emerald-400">{t("status.active")}</span>}</td>
                <td className="px-4 py-3 text-right">{u.role !== "ADMIN" && <ToggleUserButton id={u.id} disabled={u.disabled} />}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
