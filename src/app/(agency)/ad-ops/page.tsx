import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { listAdOpsClients } from "@/lib/db/ad-ops";

const euros = (minor: number) => new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(minor / 100);

export default async function AdOpsHomePage() {
  const user = await requireUser();
  const clients = await listAdOpsClients(user.id);
  const tasks = clients.flatMap((access) => (access.adOpsProfile?.tasks ?? []).map((task) => ({ task, clientName: access.clientUser.profile?.shopName || access.clientUser.name })));
  return <main className="ds-document mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 py-10">
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">POSTORY ADS STUDIO</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">广告运营工作台</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">管理客户授权边界、推广任务和经营结果。常规动作按客户确认的规则自动运行；例外才进入人工审批。</p></div>
      <Link href="/partners/clients" className="rounded-lg border bg-card px-4 py-2 text-sm font-medium">客户访问与邀请</Link>
    </header>
    <section className="grid gap-3 sm:grid-cols-3">
      <Summary label="已连接客户" value={String(clients.length)} note="仅显示您有权限访问的客户" />
      <Summary label="推广任务" value={String(tasks.length)} note="跨客户汇总 · EUR" />
      <Summary label="待异常审批" value={String(tasks.filter(({ task }) => task.status === "NEEDS_APPROVAL").length)} note="等待客户确认策略范围" />
    </section>
    <section className="rounded-2xl border bg-card p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2"><div><h2 className="text-lg font-semibold">客户工作区</h2><p className="mt-1 text-sm text-muted-foreground">客户必须先确认目标、预算、服务区域和自动化授权，才会按策略运行任务。</p></div><Link href="/ad-ops/portal" className="text-sm text-primary underline">打开客户入口</Link></div>
      {clients.length === 0 ? <div className="rounded-xl border border-dashed p-8 text-center"><p className="font-medium">还没有接入的客户</p><p className="mt-1 text-sm text-muted-foreground">先在客户访问与邀请中建立 AgencyAccess，再为客户配置广告工作区。</p></div> : <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead><tr className="border-b text-xs text-muted-foreground"><th className="px-2 py-3">客户</th><th className="px-2 py-3">经营目标</th><th className="px-2 py-3">服务区域</th><th className="px-2 py-3">已确认上限</th><th className="px-2 py-3">客户确认</th><th className="px-2 py-3">任务</th><th /></tr></thead><tbody>{clients.map((access) => { const profile = access.adOpsProfile; return <tr key={access.id} className="border-b last:border-0"><td className="px-2 py-3"><b>{access.clientUser.profile?.shopName || access.clientUser.name}</b><small className="block text-muted-foreground">{access.clientUser.name}</small></td><td className="px-2 py-3">{profile?.objective ?? "未配置"}</td><td className="px-2 py-3">{profile?.serviceArea ?? "—"}</td><td className="px-2 py-3">{profile ? `${euros(profile.dailyBudgetMinor)} / 天 · ${euros(profile.monthlyBudgetMinor)} / 月` : "—"}</td><td className="px-2 py-3">{profile?.clientConfirmedAt ? <span className="text-emerald-700">已确认</span> : <span className="text-amber-700">待客户确认</span>}</td><td className="px-2 py-3">{profile?.tasks.length ?? 0}</td><td className="px-2 py-3"><Link className="whitespace-nowrap text-primary underline" href={`/ad-ops/clients/${access.clientUser.id}`}>打开 →</Link></td></tr>; })}</tbody></table></div>}
    </section>
    <section className="rounded-2xl border bg-card p-5"><h2 className="text-lg font-semibold">最近推广任务</h2>{tasks.length ? <div className="mt-3 divide-y">{tasks.slice(0, 8).map(({ task, clientName }) => <Link key={task.id} href={`/ad-ops/tasks/${task.id}`} className="flex flex-wrap items-center justify-between gap-3 py-3"><span><b className="block">{task.title}</b><small className="text-muted-foreground">{clientName} · {task.platform} · {euros(task.dailyBudgetMinor)} / 天</small></span><State status={task.status} /></Link>)}</div> : <p className="mt-2 text-sm text-muted-foreground">创建第一个任务后，这里会显示其预检、审批和模拟状态。</p>}</section>
    <SafetyNote />
  </main>;
}

function Summary({ label, value, note }: { label: string; value: string; note: string }) { return <article className="rounded-xl border bg-card p-4"><p className="text-xs text-muted-foreground">{label}</p><b className="mt-2 block text-2xl">{value}</b><small className="mt-1 block text-muted-foreground">{note}</small></article>; }
export function State({ status }: { status: string }) { const names: Record<string, string> = { DRAFT: "草稿", PREFLIGHT_BLOCKED: "等平台账户授权", NEEDS_APPROVAL: "待客户确认", READY: "已预检，可启动", SIMULATED_RUNNING: "模拟运行中", PAUSED: "已暂停", COMPLETED: "已完成", CANCELLED: "已取消" }; return <span className="rounded-full border bg-muted px-2.5 py-1 text-xs">{names[status] ?? status}</span>; }
export function SafetyNote() { return <aside className="rounded-xl bg-muted/60 p-4 text-xs leading-5 text-muted-foreground"><b className="text-foreground">当前阶段：安全的业务闭环</b><br />此 Ads Studio 不读取有机社交账号作为广告授权，不存平台令牌、不调用广告 API、不产生广告费用。真实 OAuth 与平台提交需独立的客户授权和上线准备。</aside>; }
