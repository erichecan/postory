import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { getAgencyAdOpsClient } from "@/lib/db/ad-ops";
import { createAdOpsTaskAction, saveAgencyAdOpsProfileAction } from "@/lib/actions/ad-ops";
import { SafetyNote, State } from "../../page";

const availablePlatforms = ["Meta", "Google", "TikTok", "Microsoft", "Reddit", "Apple Search Ads"];
const offerOptions = [["WEEKDAY_BUNDLE", "工作日套餐"], ["OFF_PEAK", "优惠时段"], ["MIN_SPEND", "达到最低消费优惠"], ["COUPON", "优惠券"]];
const euros = (minor: number) => new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", maximumFractionDigits: 2 }).format(minor / 100);

export default async function AdOpsClientPage({ params, searchParams }: { params: Promise<{ clientUserId: string }>; searchParams: Promise<{ error?: string; saved?: string }> }) {
  const { clientUserId } = await params;
  const query = await searchParams;
  const user = await requireUser();
  const access = await getAgencyAdOpsClient(user.id, clientUserId);
  if (!access) notFound();
  const { clientUser, adOpsProfile: profile } = access;
  const today = new Date().toISOString().slice(0, 10);
  const nextWeek = new Date(Date.now() + 6 * 86_400_000).toISOString().slice(0, 10);
  const errorText: Record<string, string> = { profile: "请检查目标、预算、服务区域和平台选择。月上限必须不低于日上限。", task: "请补全推广任务必填信息。", setup: "请先为客户建立广告配置。", dates: "请检查任务日期（1 至 90 天）。", budget: "推广任务金额超过允许的安全上限。", asset: "所选素材不属于这位客户。", url: "落地页必须使用 HTTPS 地址。" };
  return <main className="ds-document mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 py-10">
    <Link href="/ad-ops" className="text-sm text-primary underline">← 返回 Ads Studio</Link>
    <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">客户工作区</p><h1 className="mt-2 text-3xl font-semibold">{clientUser.profile?.shopName || clientUser.name}</h1><p className="mt-2 text-sm text-muted-foreground">{clientUser.name} · {clientUser.email ?? "未设置邮箱"} · 数据严格按客户账号隔离</p></div><Link href="/ad-ops/portal" className="rounded-lg border bg-card px-4 py-2 text-sm">客户授权入口 ↗</Link></header>
    {query.error && <p role="alert" className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800">{errorText[query.error] ?? "无法完成操作，请检查授权和设置。"}</p>}
    {query.saved && <p className="rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-800">已保存。客户确认前不会在此规则下自动执行付费推广。</p>}
    <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="rounded-2xl border bg-card p-5"><div className="mb-4"><h2 className="text-lg font-semibold">客户业务边界草案</h2><p className="mt-1 text-sm text-muted-foreground">运营录入可靠的经营事实，之后由客户本人确认。不要替客户猜受众标签或同意自动投放。</p></div>
        <form action={saveAgencyAdOpsProfileAction} className="grid gap-4 sm:grid-cols-2">
          <input type="hidden" name="clientUserId" value={clientUser.id} />
          <label className="grid gap-1 text-sm">推广目标<select className="rounded-lg border bg-background p-2.5" name="objective" defaultValue={profile?.objective ?? "BOOKINGS"}><option value="BOOKINGS">预约到店</option><option value="IN_STORE_VISITS">门店到访</option><option value="ONLINE_ORDERS">在线订单</option><option value="LEADS">潜在客户</option><option value="AWARENESS">品牌认知</option></select></label>
          <label className="grid gap-1 text-sm">服务区域<input required maxLength={255} className="rounded-lg border bg-background p-2.5" name="serviceArea" defaultValue={profile?.serviceArea ?? clientUser.profile?.address ?? "Dublin 2 · 门店周边 5 km"} placeholder="城市、门店服务半径或配送区域" /></label>
          <label className="grid gap-1 text-sm">每月最高预算（EUR）<input required type="number" min="1" step="1" className="rounded-lg border bg-background p-2.5" name="monthlyBudget" defaultValue={profile ? profile.monthlyBudgetMinor / 100 : 600} /></label>
          <label className="grid gap-1 text-sm">每日最高预算（EUR）<input required type="number" min="1" step="1" className="rounded-lg border bg-background p-2.5" name="dailyBudget" defaultValue={profile ? profile.dailyBudgetMinor / 100 : 20} /></label>
          <label className="grid gap-1 text-sm sm:col-span-2">必须排除的地区（可选）<input maxLength={500} className="rounded-lg border bg-background p-2.5" name="excludedAreas" defaultValue={profile?.excludedAreas ?? ""} placeholder="只填明确不能服务的地区；不确定时留空" /></label>
          <fieldset className="grid gap-2 sm:col-span-2"><legend className="mb-1 text-sm font-medium">推荐渠道草案</legend><div className="grid gap-2 sm:grid-cols-3">{availablePlatforms.map((platform) => <label key={platform} className="flex items-center gap-2 rounded-lg border p-2.5 text-sm"><input type="checkbox" name="platforms" value={platform} defaultChecked={profile?.recommendedPlatforms.includes(platform) ?? platform === "Meta"} />{platform}</label>)}</div><p className="text-xs text-muted-foreground">勾选的是业务建议范围，不代表已连接广告账户或已取得投放权限。</p></fieldset>
          <button className="w-fit rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground sm:col-span-2">保存草案并请客户确认</button>
        </form>
      </div>
      <aside className="rounded-2xl border bg-card p-5"><h2 className="font-semibold">客户授权状态</h2><p className="mt-2 text-sm">{profile?.clientConfirmedAt ? <span className="text-emerald-700">客户已确认 · {profile.autoRunInPolicy ? "同意授权范围内自动执行" : "每项任务仍需客户确认"}</span> : <span className="text-amber-700">待客户确认配置草案</span>}</p><div className="mt-4 space-y-3 text-sm"><p>平台账户：{profile?.platformAccounts.length ? profile.platformAccounts.map((a) => `${a.platform} · ${a.status}`).join("、") : "尚无付费广告授权"}</p><p>自动化：{profile?.autoRunInPolicy ? "客户已允许在规则内运行" : "默认关闭"}</p><p>币种 / 时区：EUR · Europe/Dublin</p></div><p className="mt-4 rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-900">社交内容发布连接与广告账户授权分开管理。此页面不创建 OAuth 连接。</p></aside>
    </section>
    {profile && <section className="rounded-2xl border bg-card p-5"><div className="mb-4 flex flex-wrap items-end justify-between gap-2"><div><h2 className="text-lg font-semibold">建立推广任务</h2><p className="mt-1 text-sm text-muted-foreground">受众由系统根据客户服务区域推荐，运营可调整；文案由运营用 ChatGPT 起草和核实。</p></div><span className="text-xs text-muted-foreground">客户预算边界：{euros(profile.dailyBudgetMinor)}/天 · {euros(profile.monthlyBudgetMinor)}/月</span></div>
      <form action={createAdOpsTaskAction} className="grid gap-4 sm:grid-cols-2">
        <input type="hidden" name="clientUserId" value={clientUser.id} />
        <label className="grid gap-1 text-sm sm:col-span-2">任务名称<input required minLength={3} maxLength={160} className="rounded-lg border bg-background p-2.5" name="title" placeholder="周一至周四双人晚餐优惠" /></label>
        <label className="grid gap-1 text-sm">投放平台<select className="rounded-lg border bg-background p-2.5" name="platform" defaultValue={profile.recommendedPlatforms[0] ?? "Meta"}>{availablePlatforms.map((platform) => <option key={platform} value={platform}>{platform}</option>)}</select></label>
        <label className="grid gap-1 text-sm">优惠类型<select className="rounded-lg border bg-background p-2.5" name="offerType">{offerOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label className="grid gap-1 text-sm">优惠标题<input required minLength={3} maxLength={160} className="rounded-lg border bg-background p-2.5" name="offerTitle" placeholder="工作日晚餐双人套餐" /></label>
        <label className="grid gap-1 text-sm">每日预算（EUR）<input required type="number" min="1" step="1" defaultValue={Math.min(profile.dailyBudgetMinor / 100, 20)} className="rounded-lg border bg-background p-2.5" name="dailyBudget" /></label>
        <label className="grid gap-1 text-sm">开始日期<input required type="date" name="startsAt" defaultValue={today} className="rounded-lg border bg-background p-2.5" /></label>
        <label className="grid gap-1 text-sm">结束日期<input required type="date" name="endsAt" defaultValue={nextWeek} className="rounded-lg border bg-background p-2.5" /></label>
        <label className="grid gap-1 text-sm sm:col-span-2">优惠规则（请写清价格、日期和限制）<textarea required minLength={8} maxLength={5000} name="offerDetails" rows={3} className="rounded-lg border bg-background p-2.5" placeholder="优惠内容、适用时段、使用条件；不确定的信息先问客户" /></label>
        <label className="grid gap-1 text-sm sm:col-span-2">系统推荐受众 · 运营可调整<input name="audienceNote" readOnly value={`宽泛本地受众 · ${profile.serviceArea} · 由平台自动优化，不推断敏感属性`} className="rounded-lg border bg-muted p-2.5 text-muted-foreground" /></label>
        <label className="grid gap-1 text-sm sm:col-span-2">ChatGPT 优化后的文案<input required minLength={8} name="creativeCopy" className="rounded-lg border bg-background p-2.5" placeholder="运营撰写并核实优惠事实，不要求客户填文案" /></label>
        <label className="grid gap-1 text-sm">素材来源<select name="creativeSource" className="rounded-lg border bg-background p-2.5"><option value="PoStory calendar">PoStory 内容日历</option><option value="PoStory design">PoStory 已有设计</option><option value="New AI variant">新生成广告版</option></select></label>
        <label className="grid gap-1 text-sm">顾客行动<select name="destinationType" className="rounded-lg border bg-background p-2.5"><option value="BOOKING">在线预约</option><option value="VOUCHER">领取优惠券</option><option value="CALL">电话咨询</option><option value="WEBSITE">访问网站</option><option value="WALK_IN">直接到店</option></select></label>
        <label className="grid gap-1 text-sm sm:col-span-2">预约/落地页（可选，必须 HTTPS）<input type="url" name="destinationUrl" className="rounded-lg border bg-background p-2.5" placeholder="https://restaurant.example/book" /></label>
        <label className="grid gap-1 text-sm sm:col-span-2">优惠码核销说明（可选）<input name="redemptionInstructions" className="rounded-lg border bg-background p-2.5" placeholder="顾客预约后到店出示专属优惠码" /></label>
        {clientUser.designs.length > 0 && <label className="grid gap-1 text-sm sm:col-span-2">关联 PoStory 设计（仅显示客户自己的素材）<select name="contentDesignId" className="rounded-lg border bg-background p-2.5"><option value="">暂不关联</option>{clientUser.designs.map((design) => <option key={design.id} value={design.id}>{design.title}</option>)}</select></label>}
        <div className="rounded-lg bg-muted/60 p-3 text-xs leading-5 text-muted-foreground sm:col-span-2">创建后执行预检。超出客户已确认预算、平台或优惠授权范围时进入人工审批；缺少付费广告账户时只能运行零花费模拟。</div>
        <button className="w-fit rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground sm:col-span-2">创建任务并运行预检</button>
      </form>
    </section>}
    <section className="rounded-2xl border bg-card p-5"><h2 className="text-lg font-semibold">推广任务记录</h2>{profile?.tasks.length ? <div className="mt-3 divide-y">{profile.tasks.map((task) => <Link key={task.id} href={`/ad-ops/tasks/${task.id}`} className="flex flex-wrap items-center justify-between gap-3 py-3"><span><b className="block">{task.title}</b><small className="text-muted-foreground">{task.platform} · {euros(task.dailyBudgetMinor)}/天 · {task.startsAt.toISOString().slice(0, 10)} 至 {task.endsAt.toISOString().slice(0, 10)}</small></span><State status={task.status} /></Link>)}</div> : <p className="mt-2 text-sm text-muted-foreground">尚无推广任务。</p>}</section>
    <SafetyNote />
  </main>;
}
