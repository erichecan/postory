import { CreateAccountForm } from "@/components/admin/create-account-form";
import { ToggleUserButton } from "@/components/admin/toggle-user-button";
import { requireAdmin } from "@/lib/auth/session";
import { listUsers } from "@/lib/db/users";

const fmt = new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeZone: "Asia/Shanghai" });

export default async function AccountsPage() {
  await requireAdmin();
  const users = await listUsers();
  return (
    <div className="mx-auto flex max-w-[1080px] flex-col gap-8 px-4 py-10">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">账号管理</h1>
        <p className="mt-1 text-sm text-muted-foreground">共 {users.length} 个账号</p>
      </header>
      <CreateAccountForm />
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
            <tr>
              {["名称", "手机号", "开通方式", "作品数", "开通时间", "状态", ""].map((h) => <th key={h} className="px-4 py-2.5 font-medium">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t">
                <td className="px-4 py-3">{u.name}{u.role === "ADMIN" && <span className="ml-2 rounded bg-primary/15 px-1.5 py-0.5 text-[11px] text-primary">管理员</span>}</td>
                <td className="px-4 py-3 tabular-nums">{u.phone}</td>
                <td className="px-4 py-3 text-muted-foreground">{u.source === "OFFLINE" ? "线下开通" : "自助注册"}</td>
                <td className="px-4 py-3 tabular-nums">{u._count.designs}</td>
                <td className="px-4 py-3 text-muted-foreground">{fmt.format(u.createdAt)}</td>
                <td className="px-4 py-3">{u.disabled ? <span className="text-destructive">已停用</span> : <span className="text-emerald-400">正常</span>}</td>
                <td className="px-4 py-3 text-right">{u.role !== "ADMIN" && <ToggleUserButton id={u.id} disabled={u.disabled} />}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
